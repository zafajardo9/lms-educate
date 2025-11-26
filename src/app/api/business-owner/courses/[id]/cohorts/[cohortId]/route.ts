import { NextRequest } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { ServiceError } from '@/lib/actions/api/errors'
import { UserRole } from '@/types'

// Validation schema
const updateCohortSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  enrollmentLimit: z.number().int().min(1).optional().nullable(),
  status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  timezone: z.string().max(50).optional().nullable(),
})

// GET /api/business-owner/courses/[id]/cohorts/[cohortId] - Get cohort details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cohortId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, cohortId } = await params

    const cohort = await prisma.cohort.findFirst({
      where: { id: cohortId, courseId },
      include: {
        course: {
          select: { id: true, title: true }
        },
        enrollments: {
          include: {
            student: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { enrolledAt: 'desc' }
        },
        _count: {
          select: { enrollments: true, cohortMemberships: true }
        }
      }
    })

    if (!cohort) {
      throw new ServiceError('NOT_FOUND', 'Cohort not found', 404)
    }

    return jsonSuccess({
      success: true,
      data: {
        ...cohort,
        enrolledCount: cohort._count.enrollments,
        spotsRemaining: cohort.enrollmentLimit 
          ? cohort.enrollmentLimit - cohort._count.enrollments 
          : null,
      }
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch cohort')
  }
}

// PUT /api/business-owner/courses/[id]/cohorts/[cohortId] - Update cohort
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cohortId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, cohortId } = await params

    const body = await request.json()
    const validatedData = updateCohortSchema.parse(body)

    // Verify cohort exists
    const existing = await prisma.cohort.findFirst({
      where: { id: cohortId, courseId }
    })

    if (!existing) {
      throw new ServiceError('NOT_FOUND', 'Cohort not found', 404)
    }

    // Prepare update data with date conversion
    const { startDate, endDate, ...restData } = validatedData
    const updateData: any = { ...restData }

    if (startDate !== undefined) {
      updateData.startDate = startDate ? new Date(startDate) : null
    }
    if (endDate !== undefined) {
      updateData.endDate = endDate ? new Date(endDate) : null
    }

    // Validate dates
    const finalStartDate = updateData.startDate ?? existing.startDate
    const finalEndDate = updateData.endDate ?? existing.endDate
    if (finalStartDate && finalEndDate && finalEndDate <= finalStartDate) {
      throw new ServiceError('VALIDATION_ERROR', 'End date must be after start date', 400)
    }

    const updated = await prisma.cohort.update({
      where: { id: cohortId },
      data: updateData,
      include: {
        _count: { select: { enrollments: true } }
      }
    })

    return jsonSuccess({
      success: true,
      data: updated,
      message: 'Cohort updated successfully'
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to update cohort')
  }
}

// PATCH /api/business-owner/courses/[id]/cohorts/[cohortId] - Update cohort status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cohortId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, cohortId } = await params

    const body = await request.json()
    const patchSchema = z.object({
      status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED'])
    })
    const { status } = patchSchema.parse(body)

    const existing = await prisma.cohort.findFirst({
      where: { id: cohortId, courseId }
    })

    if (!existing) {
      throw new ServiceError('NOT_FOUND', 'Cohort not found', 404)
    }

    const updated = await prisma.cohort.update({
      where: { id: cohortId },
      data: { status },
      select: { id: true, name: true, status: true }
    })

    return jsonSuccess({
      success: true,
      data: updated,
      message: `Cohort status changed to ${status}`
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to update cohort status')
  }
}

// DELETE /api/business-owner/courses/[id]/cohorts/[cohortId] - Archive or delete cohort
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cohortId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, cohortId } = await params

    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'

    const existing = await prisma.cohort.findFirst({
      where: { id: cohortId, courseId },
      include: {
        _count: { select: { enrollments: true } }
      }
    })

    if (!existing) {
      throw new ServiceError('NOT_FOUND', 'Cohort not found', 404)
    }

    // If cohort has enrollments, prefer archiving over deletion
    if (existing._count.enrollments > 0) {
      if (hardDelete) {
        // Hard delete - removes cohort but keeps enrollments (students stay in course)
        // Note: CohortEnrollment records will be cascade deleted
        await prisma.cohort.delete({
          where: { id: cohortId }
        })

        return jsonSuccess({
          success: true,
          message: `Cohort "${existing.name}" permanently deleted. ${existing._count.enrollments} student(s) remain enrolled in the course but are no longer in this cohort.`
        })
      }

      // Default: Archive instead of delete
      const archived = await prisma.cohort.update({
        where: { id: cohortId },
        data: { status: 'ARCHIVED' },
        select: { id: true, name: true, status: true }
      })

      return jsonSuccess({
        success: true,
        data: archived,
        message: `Cohort "${existing.name}" archived (${existing._count.enrollments} students preserved). Use ?hard=true to permanently delete.`
      })
    }

    // No enrollments - safe to delete
    await prisma.cohort.delete({
      where: { id: cohortId }
    })

    return jsonSuccess({
      success: true,
      message: `Cohort "${existing.name}" deleted successfully`
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to delete cohort')
  }
}
