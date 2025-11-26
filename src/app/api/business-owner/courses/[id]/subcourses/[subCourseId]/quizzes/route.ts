import { NextRequest } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { ServiceError } from '@/lib/actions/api/errors'
import { UserRole } from '@/types'

// Validation schemas
const createQuizSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
  timeLimit: z.number().int().min(1).optional().nullable(),
  maxAttempts: z.number().int().min(1).default(1),
  passingScore: z.number().int().min(0).max(100).default(70),
  order: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
})

// GET /api/business-owner/courses/[id]/subcourses/[subCourseId]/quizzes - List quizzes in subcourse
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

    const quizzes = await prisma.quiz.findMany({
      where: { subCourseId },
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { questions: true, submissions: true } }
      }
    })

    return jsonSuccess({
      success: true,
      data: {
        subCourseId,
        subCourseTitle: subCourse.title,
        quizzes
      }
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch quizzes')
  }
}

// POST /api/business-owner/courses/[id]/subcourses/[subCourseId]/quizzes - Create quiz in subcourse
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subCourseId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, subCourseId } = await params

    const body = await request.json()
    const data = createQuizSchema.parse(body)

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
      const lastQuiz = await prisma.quiz.findFirst({
        where: { subCourseId },
        orderBy: { order: 'desc' },
        select: { order: true }
      })
      order = (lastQuiz?.order ?? -1) + 1
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: data.title,
        description: data.description,
        timeLimit: data.timeLimit,
        maxAttempts: data.maxAttempts,
        passingScore: data.passingScore,
        order,
        isPublished: data.isPublished ?? false,
        courseId,
        subCourseId,
        organizationId: subCourse.organizationId,
      },
      include: {
        _count: { select: { questions: true } }
      }
    })

    return jsonSuccess(
      { success: true, data: quiz, message: 'Quiz created successfully' },
      { status: 201 }
    )

  } catch (error) {
    return handleErrorResponse(error, 'Failed to create quiz')
  }
}
