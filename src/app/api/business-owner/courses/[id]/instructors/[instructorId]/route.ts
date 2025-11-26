import { NextRequest } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { ServiceError } from '@/lib/actions/api/errors'
import { UserRole } from '@/types'

// Validation schema
const updateInstructorSchema = z.object({
  role: z.enum(['OWNER', 'LEAD_INSTRUCTOR', 'INSTRUCTOR', 'TA', 'REVIEWER']).optional(),
  permissions: z.object({
    canEditContent: z.boolean().optional(),
    canManageStudents: z.boolean().optional(),
    canGradeQuizzes: z.boolean().optional(),
    canViewAnalytics: z.boolean().optional(),
  }).optional(),
})

// GET /api/business-owner/courses/[id]/instructors/[instructorId] - Get specific instructor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; instructorId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, instructorId } = await params

    const instructor = await prisma.courseInstructor.findFirst({
      where: {
        id: instructorId,
        courseId,
        removedAt: null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        course: {
          select: { id: true, title: true }
        },
        invitedBy: {
          select: { id: true, name: true }
        }
      }
    })

    if (!instructor) {
      throw new ServiceError('NOT_FOUND', 'Instructor not found', 404)
    }

    return jsonSuccess({
      success: true,
      data: instructor
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch instructor')
  }
}

// PATCH /api/business-owner/courses/[id]/instructors/[instructorId] - Update instructor role/permissions
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; instructorId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, instructorId } = await params

    const body = await request.json()
    const updateData = updateInstructorSchema.parse(body)

    // Verify instructor exists and belongs to this course
    const existingInstructor = await prisma.courseInstructor.findFirst({
      where: {
        id: instructorId,
        courseId,
        removedAt: null,
      }
    })

    if (!existingInstructor) {
      throw new ServiceError('NOT_FOUND', 'Instructor not found', 404)
    }

    const updatedInstructor = await prisma.courseInstructor.update({
      where: { id: instructorId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return jsonSuccess({
      success: true,
      data: updatedInstructor,
      message: 'Instructor updated successfully'
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to update instructor')
  }
}

// DELETE /api/business-owner/courses/[id]/instructors/[instructorId] - Remove instructor from course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; instructorId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, instructorId } = await params

    // Check if using soft delete or hard delete
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'

    // Verify instructor exists
    const instructor = await prisma.courseInstructor.findFirst({
      where: {
        id: instructorId,
        courseId,
      },
      include: {
        user: { select: { name: true } }
      }
    })

    if (!instructor) {
      throw new ServiceError('NOT_FOUND', 'Instructor not found', 404)
    }

    if (hardDelete) {
      // Permanently delete
      await prisma.courseInstructor.delete({
        where: { id: instructorId }
      })

      return jsonSuccess({
        success: true,
        message: `${instructor.user.name} permanently removed from course`
      })
    } else {
      // Soft delete - set removedAt timestamp
      await prisma.courseInstructor.update({
        where: { id: instructorId },
        data: { removedAt: new Date() }
      })

      return jsonSuccess({
        success: true,
        message: `${instructor.user.name} removed from course`
      })
    }

  } catch (error) {
    return handleErrorResponse(error, 'Failed to remove instructor')
  }
}
