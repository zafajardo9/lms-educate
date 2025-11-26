import { NextRequest } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { ServiceError } from '@/lib/actions/api/errors'
import { UserRole } from '@/types'

// Validation schema
const updateSubCourseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  order: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
})

// GET /api/business-owner/courses/[id]/subcourses/[subCourseId] - Get subcourse details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subCourseId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, subCourseId } = await params

    const subCourse = await prisma.subCourse.findFirst({
      where: { id: subCourseId, courseId },
      include: {
        course: {
          select: { id: true, title: true }
        },
        lessons: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            content: true,
            videoUrl: true,
            duration: true,
            order: true,
            isPublished: true,
          }
        },
        quizzes: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            timeLimit: true,
            maxAttempts: true,
            passingScore: true,
            order: true,
            isPublished: true,
            _count: { select: { questions: true } }
          }
        },
        _count: {
          select: { lessons: true, quizzes: true }
        }
      }
    })

    if (!subCourse) {
      throw new ServiceError('NOT_FOUND', 'Subcourse not found', 404)
    }

    return jsonSuccess({ success: true, data: subCourse })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch subcourse')
  }
}

// PUT /api/business-owner/courses/[id]/subcourses/[subCourseId] - Update subcourse
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subCourseId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, subCourseId } = await params

    const body = await request.json()
    const updateData = updateSubCourseSchema.parse(body)

    // Verify subcourse exists and belongs to course
    const existing = await prisma.subCourse.findFirst({
      where: { id: subCourseId, courseId }
    })

    if (!existing) {
      throw new ServiceError('NOT_FOUND', 'Subcourse not found', 404)
    }

    const updated = await prisma.subCourse.update({
      where: { id: subCourseId },
      data: updateData,
      include: {
        _count: { select: { lessons: true, quizzes: true } }
      }
    })

    return jsonSuccess({
      success: true,
      data: updated,
      message: 'Subcourse updated successfully'
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to update subcourse')
  }
}

// PATCH /api/business-owner/courses/[id]/subcourses/[subCourseId] - Toggle visibility
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subCourseId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, subCourseId } = await params

    const body = await request.json()
    const patchSchema = z.object({
      isPublished: z.boolean()
    })
    const { isPublished } = patchSchema.parse(body)

    // Verify subcourse exists
    const existing = await prisma.subCourse.findFirst({
      where: { id: subCourseId, courseId }
    })

    if (!existing) {
      throw new ServiceError('NOT_FOUND', 'Subcourse not found', 404)
    }

    const updated = await prisma.subCourse.update({
      where: { id: subCourseId },
      data: { isPublished },
      select: { id: true, title: true, isPublished: true }
    })

    return jsonSuccess({
      success: true,
      data: updated,
      message: isPublished ? 'Subcourse published' : 'Subcourse hidden'
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to update subcourse visibility')
  }
}

// DELETE /api/business-owner/courses/[id]/subcourses/[subCourseId] - Delete subcourse
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subCourseId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, subCourseId } = await params

    // Verify subcourse exists
    const existing = await prisma.subCourse.findFirst({
      where: { id: subCourseId, courseId },
      include: {
        _count: { select: { lessons: true, quizzes: true } }
      }
    })

    if (!existing) {
      throw new ServiceError('NOT_FOUND', 'Subcourse not found', 404)
    }

    // Delete subcourse (cascades to lessons and quizzes)
    await prisma.subCourse.delete({
      where: { id: subCourseId }
    })

    return jsonSuccess({
      success: true,
      message: `Subcourse "${existing.title}" deleted with ${existing._count.lessons} lessons and ${existing._count.quizzes} quizzes`
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to delete subcourse')
  }
}
