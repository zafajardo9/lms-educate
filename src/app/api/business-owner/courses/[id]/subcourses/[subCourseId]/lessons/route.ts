import { NextRequest } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { ServiceError } from '@/lib/actions/api/errors'
import { UserRole } from '@/types'

// Validation schemas
const createLessonSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  videoUrl: z.string().url().optional().nullable(),
  attachments: z.array(z.string()).optional(),
  duration: z.number().int().min(0).optional().nullable(),
  order: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
})

// GET /api/business-owner/courses/[id]/subcourses/[subCourseId]/lessons - List lessons
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subCourseId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, subCourseId } = await params

    // Verify subcourse exists
    const subCourse = await prisma.subCourse.findFirst({
      where: { id: subCourseId, courseId },
      select: { id: true, title: true }
    })

    if (!subCourse) {
      throw new ServiceError('NOT_FOUND', 'Subcourse not found', 404)
    }

    const lessons = await prisma.lesson.findMany({
      where: { subCourseId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        content: true,
        videoUrl: true,
        attachments: true,
        duration: true,
        order: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return jsonSuccess({
      success: true,
      data: {
        subCourseId,
        subCourseTitle: subCourse.title,
        lessons
      }
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch lessons')
  }
}

// POST /api/business-owner/courses/[id]/subcourses/[subCourseId]/lessons - Create lesson
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subCourseId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, subCourseId } = await params

    const body = await request.json()
    const data = createLessonSchema.parse(body)

    // Verify subcourse exists and get organization
    const subCourse = await prisma.subCourse.findFirst({
      where: { id: subCourseId, courseId },
      select: { id: true, organizationId: true }
    })

    if (!subCourse) {
      throw new ServiceError('NOT_FOUND', 'Subcourse not found', 404)
    }

    // Get next order if not provided
    let order = data.order
    if (order === undefined) {
      const lastLesson = await prisma.lesson.findFirst({
        where: { subCourseId },
        orderBy: { order: 'desc' },
        select: { order: true }
      })
      order = (lastLesson?.order ?? -1) + 1
    }

    const lesson = await prisma.lesson.create({
      data: {
        title: data.title,
        content: data.content,
        videoUrl: data.videoUrl,
        attachments: data.attachments ?? [],
        duration: data.duration,
        order,
        isPublished: data.isPublished ?? false,
        subCourseId,
        courseId, // Also link to course for direct queries
        organizationId: subCourse.organizationId,
      }
    })

    return jsonSuccess(
      { success: true, data: lesson, message: 'Lesson created successfully' },
      { status: 201 }
    )

  } catch (error) {
    return handleErrorResponse(error, 'Failed to create lesson')
  }
}

// PUT /api/business-owner/courses/[id]/subcourses/[subCourseId]/lessons - Reorder lessons
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subCourseId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, subCourseId } = await params

    const body = await request.json()
    const reorderSchema = z.object({
      lessonIds: z.array(z.string()).min(1)
    })
    const { lessonIds } = reorderSchema.parse(body)

    // Verify subcourse exists
    const subCourse = await prisma.subCourse.findFirst({
      where: { id: subCourseId, courseId }
    })

    if (!subCourse) {
      throw new ServiceError('NOT_FOUND', 'Subcourse not found', 404)
    }

    // Update order for each lesson
    await Promise.all(
      lessonIds.map((id, index) =>
        prisma.lesson.update({
          where: { id },
          data: { order: index }
        })
      )
    )

    const updatedLessons = await prisma.lesson.findMany({
      where: { subCourseId },
      orderBy: { order: 'asc' },
      select: { id: true, title: true, order: true }
    })

    return jsonSuccess({
      success: true,
      data: updatedLessons,
      message: 'Lessons reordered successfully'
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to reorder lessons')
  }
}
