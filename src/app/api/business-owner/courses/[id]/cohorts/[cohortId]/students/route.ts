import { NextRequest } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { ServiceError } from '@/lib/actions/api/errors'
import { UserRole } from '@/types'

// Validation schemas
const addStudentSchema = z.object({
  enrollmentId: z.string().min(1, 'Enrollment ID is required'),
})

const bulkAddSchema = z.object({
  enrollmentIds: z.array(z.string()).min(1, 'At least one enrollment ID required'),
})

// GET /api/business-owner/courses/[id]/cohorts/[cohortId]/students - List students in cohort
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cohortId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, cohortId } = await params

    // Verify cohort exists
    const cohort = await prisma.cohort.findFirst({
      where: { id: cohortId, courseId },
      select: { id: true, name: true, enrollmentLimit: true }
    })

    if (!cohort) {
      throw new ServiceError('NOT_FOUND', 'Cohort not found', 404)
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { cohortId },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { enrolledAt: 'desc' }
    })

    return jsonSuccess({
      success: true,
      data: {
        cohortId,
        cohortName: cohort.name,
        enrollmentLimit: cohort.enrollmentLimit,
        studentCount: enrollments.length,
        spotsRemaining: cohort.enrollmentLimit ? cohort.enrollmentLimit - enrollments.length : null,
        students: enrollments.map(e => ({
          enrollmentId: e.id,
          student: e.student,
          progress: e.progress,
          enrolledAt: e.enrolledAt,
          completedAt: e.completedAt,
        }))
      }
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch cohort students')
  }
}

// POST /api/business-owner/courses/[id]/cohorts/[cohortId]/students - Add student(s) to cohort
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cohortId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, cohortId } = await params

    const body = await request.json()
    const isBulk = Array.isArray(body.enrollmentIds)

    // Verify cohort exists and has capacity
    const cohort = await prisma.cohort.findFirst({
      where: { id: cohortId, courseId },
      include: { _count: { select: { enrollments: true } } }
    })

    if (!cohort) {
      throw new ServiceError('NOT_FOUND', 'Cohort not found', 404)
    }

    if (isBulk) {
      const { enrollmentIds } = bulkAddSchema.parse(body)

      // Check capacity
      if (cohort.enrollmentLimit && cohort._count.enrollments + enrollmentIds.length > cohort.enrollmentLimit) {
        throw new ServiceError(
          'CONFLICT',
          `Cohort only has ${cohort.enrollmentLimit - cohort._count.enrollments} spots remaining`,
          409
        )
      }

      // Verify enrollments exist and belong to this course
      const enrollments = await prisma.enrollment.findMany({
        where: { id: { in: enrollmentIds }, courseId },
        select: { id: true, cohortId: true }
      })

      const validIds = new Set(enrollments.map(e => e.id))
      const invalidIds = enrollmentIds.filter(id => !validIds.has(id))

      if (invalidIds.length > 0) {
        throw new ServiceError('VALIDATION_ERROR', `Invalid enrollment IDs: ${invalidIds.join(', ')}`, 400)
      }

      // Filter out already in this cohort
      const toUpdate = enrollments.filter(e => e.cohortId !== cohortId)

      if (toUpdate.length === 0) {
        throw new ServiceError('CONFLICT', 'All students are already in this cohort', 409)
      }

      // Update enrollments
      await prisma.enrollment.updateMany({
        where: { id: { in: toUpdate.map(e => e.id) } },
        data: { cohortId }
      })

      return jsonSuccess({
        success: true,
        data: { added: toUpdate.length, skipped: enrollments.length - toUpdate.length },
        message: `${toUpdate.length} student(s) added to ${cohort.name}`
      })

    } else {
      const { enrollmentId } = addStudentSchema.parse(body)

      // Check capacity
      if (cohort.enrollmentLimit && cohort._count.enrollments >= cohort.enrollmentLimit) {
        throw new ServiceError('CONFLICT', 'Cohort is full', 409)
      }

      // Verify enrollment exists
      const enrollment = await prisma.enrollment.findFirst({
        where: { id: enrollmentId, courseId },
        include: { student: { select: { name: true } } }
      })

      if (!enrollment) {
        throw new ServiceError('NOT_FOUND', 'Enrollment not found', 404)
      }

      if (enrollment.cohortId === cohortId) {
        throw new ServiceError('CONFLICT', 'Student is already in this cohort', 409)
      }

      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { cohortId }
      })

      return jsonSuccess({
        success: true,
        message: `${enrollment.student.name} added to ${cohort.name}`
      })
    }

  } catch (error) {
    return handleErrorResponse(error, 'Failed to add student to cohort')
  }
}

// DELETE /api/business-owner/courses/[id]/cohorts/[cohortId]/students - Remove student from cohort
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cohortId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, cohortId } = await params

    const { searchParams } = new URL(request.url)
    const enrollmentId = searchParams.get('enrollmentId')

    if (!enrollmentId) {
      throw new ServiceError('VALIDATION_ERROR', 'enrollmentId query parameter is required', 400)
    }

    // Verify enrollment exists and is in this cohort
    const enrollment = await prisma.enrollment.findFirst({
      where: { id: enrollmentId, courseId, cohortId },
      include: { student: { select: { name: true } } }
    })

    if (!enrollment) {
      throw new ServiceError('NOT_FOUND', 'Enrollment not found in this cohort', 404)
    }

    // Remove from cohort (not from course)
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { cohortId: null }
    })

    return jsonSuccess({
      success: true,
      message: `${enrollment.student.name} removed from cohort (still enrolled in course)`
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to remove student from cohort')
  }
}
