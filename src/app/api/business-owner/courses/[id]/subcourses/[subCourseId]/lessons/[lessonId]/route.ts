import { NextRequest } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { ServiceError } from '@/lib/actions/api/errors'
import { UserRole } from '@/types'

// Validation schema
const updateLessonSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  videoUrl: z.string().url().optional().nullable(),
  attachments: z.array(z.string()).optional(),
  duration: z.number().int().min(0).optional().nullable(),
  order: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
})

// GET /api/business-owner/courses/[id]/subcourses/[subCourseId]/lessons/[lessonId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subCourseId: string; lessonId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { subCourseId, lessonId } = await params

    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, subCourseId },
      include: {
        subCourse: {
          select: { id: true, title: true }
        },
        course: {
          select: { id: true, title: true }
        }
      }
    })

    if (!lesson) {
      throw new ServiceError('NOT_FOUND', 'Lesson not found', 404)
    }

    return jsonSuccess({ success: true, data: lesson })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch lesson')
  }
}

// PUT /api/business-owner/courses/[id]/subcourses/[subCourseId]/lessons/[lessonId]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subCourseId: string; lessonId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { subCourseId, lessonId } = await params

    const body = await request.json()
    const updateData = updateLessonSchema.parse(body)

    // Verify lesson exists
    const existing = await prisma.lesson.findFirst({
      where: { id: lessonId, subCourseId }
    })

    if (!existing) {
      throw new ServiceError('NOT_FOUND', 'Lesson not found', 404)
    }

    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: updateData
    })

    return jsonSuccess({
      success: true,
      data: updated,
      message: 'Lesson updated successfully'
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to update lesson')
  }
}

// PATCH /api/business-owner/courses/[id]/subcourses/[subCourseId]/lessons/[lessonId] - Toggle visibility
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subCourseId: string; lessonId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { subCourseId, lessonId } = await params

    const body = await request.json()
    const patchSchema = z.object({
      isPublished: z.boolean()
    })
    const { isPublished } = patchSchema.parse(body)

    const existing = await prisma.lesson.findFirst({
      where: { id: lessonId, subCourseId }
    })

    if (!existing) {
      throw new ServiceError('NOT_FOUND', 'Lesson not found', 404)
    }

    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: { isPublished },
      select: { id: true, title: true, isPublished: true }
    })

    return jsonSuccess({
      success: true,
      data: updated,
      message: isPublished ? 'Lesson published' : 'Lesson hidden'
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to update lesson visibility')
  }
}

// DELETE /api/business-owner/courses/[id]/subcourses/[subCourseId]/lessons/[lessonId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subCourseId: string; lessonId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { subCourseId, lessonId } = await params

    const existing = await prisma.lesson.findFirst({
      where: { id: lessonId, subCourseId }
    })

    if (!existing) {
      throw new ServiceError('NOT_FOUND', 'Lesson not found', 404)
    }

    await prisma.lesson.delete({
      where: { id: lessonId }
    })

    return jsonSuccess({
      success: true,
      message: `Lesson "${existing.title}" deleted successfully`
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to delete lesson')
  }
}
