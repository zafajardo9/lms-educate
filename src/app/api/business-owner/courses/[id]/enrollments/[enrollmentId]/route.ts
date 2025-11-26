import { NextRequest } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { ServiceError } from '@/lib/actions/api/errors'
import { UserRole } from '@/types'

// Validation schema
const updateEnrollmentSchema = z.object({
  cohortId: z.string().optional().nullable(),
  progress: z.number().int().min(0).max(100).optional(),
})

// GET /api/business-owner/courses/[id]/enrollments/[enrollmentId] - Get enrollment details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; enrollmentId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, enrollmentId } = await params

    const enrollment = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, courseId },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        course: {
          select: { id: true, title: true }
        },
        cohort: {
          select: { id: true, name: true, status: true }
        },
        courseGroupMemberships: {
          include: {
            group: {
              select: { id: true, name: true, type: true }
            }
          }
        },
        progressTracking: {
          include: {
            lesson: {
              select: { id: true, title: true, subCourseId: true }
            }
          },
          orderBy: { updatedAt: 'desc' }
        }
      }
    })

    if (!enrollment) {
      throw new ServiceError('NOT_FOUND', 'Enrollment not found', 404)
    }

    // Calculate detailed progress
    const completedLessons = enrollment.progressTracking.filter(p => p.isCompleted).length
    const totalTimeSpent = enrollment.progressTracking.reduce((sum, p) => sum + p.timeSpent, 0)

    return jsonSuccess({
      success: true,
      data: {
        ...enrollment,
        groups: enrollment.courseGroupMemberships.map(m => ({
          ...m.group,
          isLeader: m.isLeader,
          joinedAt: m.joinedAt,
        })),
        stats: {
          completedLessons,
          totalLessonsTracked: enrollment.progressTracking.length,
          totalTimeSpent,
          progress: enrollment.progress,
        }
      }
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch enrollment')
  }
}

// PUT /api/business-owner/courses/[id]/enrollments/[enrollmentId] - Update enrollment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; enrollmentId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, enrollmentId } = await params

    const body = await request.json()
    const data = updateEnrollmentSchema.parse(body)

    // Verify enrollment exists
    const existing = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, courseId }
    })

    if (!existing) {
      throw new ServiceError('NOT_FOUND', 'Enrollment not found', 404)
    }

    // Validate new cohort if changing
    if (data.cohortId !== undefined && data.cohortId !== existing.cohortId) {
      if (data.cohortId) {
        const cohort = await prisma.cohort.findFirst({
          where: { id: data.cohortId, courseId },
          include: { _count: { select: { enrollments: true } } }
        })
        if (!cohort) {
          throw new ServiceError('NOT_FOUND', 'Cohort not found', 404)
        }
        if (cohort.enrollmentLimit && cohort._count.enrollments >= cohort.enrollmentLimit) {
          throw new ServiceError('CONFLICT', 'Cohort is full', 409)
        }
      }
    }

    const updated = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        cohortId: data.cohortId,
        progress: data.progress,
        completedAt: data.progress === 100 ? new Date() : undefined,
      },
      include: {
        student: { select: { id: true, name: true } },
        cohort: { select: { id: true, name: true } },
      }
    })

    return jsonSuccess({
      success: true,
      data: updated,
      message: 'Enrollment updated successfully'
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to update enrollment')
  }
}

// PATCH /api/business-owner/courses/[id]/enrollments/[enrollmentId] - Change cohort
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; enrollmentId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, enrollmentId } = await params

    const body = await request.json()
    const patchSchema = z.object({
      cohortId: z.string().nullable()
    })
    const { cohortId } = patchSchema.parse(body)

    const existing = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, courseId },
      include: { student: { select: { name: true } } }
    })

    if (!existing) {
      throw new ServiceError('NOT_FOUND', 'Enrollment not found', 404)
    }

    // Validate new cohort
    if (cohortId) {
      const cohort = await prisma.cohort.findFirst({
        where: { id: cohortId, courseId },
        include: { _count: { select: { enrollments: true } } }
      })
      if (!cohort) {
        throw new ServiceError('NOT_FOUND', 'Cohort not found', 404)
      }
      if (cohort.enrollmentLimit && cohort._count.enrollments >= cohort.enrollmentLimit) {
        throw new ServiceError('CONFLICT', 'Cohort is full', 409)
      }
    }

    const updated = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { cohortId },
      include: {
        cohort: { select: { id: true, name: true } }
      }
    })

    return jsonSuccess({
      success: true,
      data: updated,
      message: cohortId
        ? `${existing.student.name} moved to ${updated.cohort?.name}`
        : `${existing.student.name} removed from cohort`
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to change cohort')
  }
}

// DELETE /api/business-owner/courses/[id]/enrollments/[enrollmentId] - Unenroll student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; enrollmentId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, enrollmentId } = await params

    const existing = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, courseId },
      include: {
        student: { select: { name: true } },
        _count: { select: { progressTracking: true, courseGroupMemberships: true } }
      }
    })

    if (!existing) {
      throw new ServiceError('NOT_FOUND', 'Enrollment not found', 404)
    }

    // Warn if student has progress
    if (existing._count.progressTracking > 0 || existing.progress > 0) {
      const { searchParams } = new URL(request.url)
      const force = searchParams.get('force') === 'true'

      if (!force) {
        throw new ServiceError(
          'CONFLICT',
          `Student has ${existing.progress}% progress and ${existing._count.progressTracking} lesson records. Add ?force=true to unenroll anyway.`,
          409
        )
      }
    }

    // Delete enrollment (cascades to progress tracking and group memberships)
    await prisma.enrollment.delete({
      where: { id: enrollmentId }
    })

    return jsonSuccess({
      success: true,
      message: `${existing.student.name} has been unenrolled from the course`
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to unenroll student')
  }
}
