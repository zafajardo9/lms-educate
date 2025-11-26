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

// GET /api/business-owner/courses/[id]/quizzes - List all course-level quizzes (final quizzes)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId } = await params

    const { searchParams } = new URL(request.url)
    const includeSubCourseQuizzes = searchParams.get('all') === 'true'

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true }
    })

    if (!course) {
      throw new ServiceError('NOT_FOUND', 'Course not found', 404)
    }

    // Get quizzes - either course-level only or all
    const whereClause = includeSubCourseQuizzes
      ? { courseId }
      : { courseId, subCourseId: null } // Only course-level quizzes

    const quizzes = await prisma.quiz.findMany({
      where: whereClause,
      orderBy: { order: 'asc' },
      include: {
        subCourse: {
          select: { id: true, title: true }
        },
        _count: { select: { questions: true, submissions: true } }
      }
    })

    // Separate into course-level and subcourse quizzes if getting all
    if (includeSubCourseQuizzes) {
      const courseLevelQuizzes = quizzes.filter(q => !q.subCourseId)
      const subCourseQuizzes = quizzes.filter(q => q.subCourseId)

      return jsonSuccess({
        success: true,
        data: {
          courseId,
          courseTitle: course.title,
          courseLevelQuizzes,
          subCourseQuizzes,
          totalQuizzes: quizzes.length
        }
      })
    }

    return jsonSuccess({
      success: true,
      data: {
        courseId,
        courseTitle: course.title,
        quizzes
      }
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch quizzes')
  }
}

// POST /api/business-owner/courses/[id]/quizzes - Create course-level quiz (final quiz)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId } = await params

    const body = await request.json()
    const data = createQuizSchema.parse(body)

    // Verify course exists and get organization
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, organizationId: true }
    })

    if (!course) {
      throw new ServiceError('NOT_FOUND', 'Course not found', 404)
    }

    // Get next order if not provided
    let order = data.order
    if (order === undefined) {
      const lastQuiz = await prisma.quiz.findFirst({
        where: { courseId, subCourseId: null },
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
        subCourseId: null, // Course-level quiz
        organizationId: course.organizationId,
      },
      include: {
        _count: { select: { questions: true } }
      }
    })

    return jsonSuccess(
      { success: true, data: quiz, message: 'Course quiz created successfully' },
      { status: 201 }
    )

  } catch (error) {
    return handleErrorResponse(error, 'Failed to create quiz')
  }
}
