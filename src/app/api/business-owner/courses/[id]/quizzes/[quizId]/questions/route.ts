import { NextRequest } from 'next/server'
import { z } from 'zod'

import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { ServiceError } from '@/lib/actions/api/errors'
import prisma from '@/lib/prisma'
import { UserRole } from '@/types'

const createQuestionSchema = z.object({
  type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY']),
  question: z.string().min(1, 'Question is required').max(1000),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  explanation: z.string().max(1000).optional().nullable(),
  points: z.number().int().min(1).default(1),
  order: z.number().int().min(0).optional(),
})

const bulkCreateQuestionsSchema = z.object({
  questions: z.array(createQuestionSchema).min(1, 'At least one question required'),
})

const syncQuestionsSchema = z.object({
  questions: z.array(createQuestionSchema).min(1, 'At least one question required'),
})

const reorderQuestionsSchema = z.object({
  questionIds: z.array(z.string()).min(1),
})

type RouteParams = Promise<{ id: string; quizId: string }>

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, quizId } = await params

    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, courseId },
      select: {
        id: true,
        title: true,
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            type: true,
            question: true,
            options: true,
            correctAnswer: true,
            explanation: true,
            points: true,
            order: true,
          },
        },
      },
    })

    if (!quiz) {
      throw new ServiceError('NOT_FOUND', 'Quiz not found', 404)
    }

    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0)

    return jsonSuccess({
      success: true,
      data: {
        quizId,
        quizTitle: quiz.title,
        questions: quiz.questions,
        totalQuestions: quiz.questions.length,
        totalPoints,
      },
    })
  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch questions')
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, quizId } = await params
    const body = await request.json()

    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, courseId },
      select: { id: true },
    })

    if (!quiz) {
      throw new ServiceError('NOT_FOUND', 'Quiz not found', 404)
    }

    if (body.questions && Array.isArray(body.questions)) {
      const { questions } = bulkCreateQuestionsSchema.parse(body)

      const lastQuestion = await prisma.question.findFirst({
        where: { quizId },
        orderBy: { order: 'desc' },
        select: { order: true },
      })
      let nextOrder = (lastQuestion?.order ?? -1) + 1

      const createManyResult = await prisma.question.createMany({
        data: questions.map((question, index) => ({
          quizId,
          type: question.type,
          question: question.question,
          options: question.options ?? [],
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          points: question.points,
          order: question.order ?? nextOrder + index,
        })),
      })

      return jsonSuccess(
        {
          success: true,
          data: { count: createManyResult.count },
          message: `${createManyResult.count} questions created successfully`,
        },
        { status: 201 }
      )
    }

    const data = createQuestionSchema.parse(body)

    if (data.type === 'MULTIPLE_CHOICE' && (!data.options || data.options.length < 2)) {
      throw new ServiceError(
        'VALIDATION_ERROR',
        'Multiple choice questions require at least 2 options',
        400
      )
    }

    let order = data.order
    if (order === undefined) {
      const lastQuestion = await prisma.question.findFirst({
        where: { quizId },
        orderBy: { order: 'desc' },
        select: { order: true },
      })
      order = (lastQuestion?.order ?? -1) + 1
    }

    const question = await prisma.question.create({
      data: {
        quizId,
        type: data.type,
        question: data.question,
        options: data.options ?? [],
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        points: data.points,
        order,
      },
    })

    return jsonSuccess(
      { success: true, data: question, message: 'Question created successfully' },
      { status: 201 }
    )
  } catch (error) {
    return handleErrorResponse(error, 'Failed to create question')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, quizId } = await params

    const body = await request.json()
    const { questions } = syncQuestionsSchema.parse(body)

    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, courseId },
      select: { id: true },
    })

    if (!quiz) {
      throw new ServiceError('NOT_FOUND', 'Quiz not found', 404)
    }

    await prisma.$transaction(async (tx) => {
      await tx.question.deleteMany({ where: { quizId } })

      await tx.question.createMany({
        data: questions.map((question, index) => ({
          quizId,
          type: question.type,
          question: question.question,
          options: question.options ?? [],
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          points: question.points,
          order: question.order ?? index,
        })),
      })
    })

    const refreshedQuestions = await prisma.question.findMany({
      where: { quizId },
      orderBy: { order: 'asc' },
    })

    return jsonSuccess({
      success: true,
      data: {
        quizId,
        totalQuestions: refreshedQuestions.length,
        questions: refreshedQuestions,
      },
      message: 'Questions updated successfully',
    })
  } catch (error) {
    return handleErrorResponse(error, 'Failed to update questions')
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, quizId } = await params
    const body = await request.json()
    const { questionIds } = reorderQuestionsSchema.parse(body)

    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, courseId },
      select: { id: true },
    })

    if (!quiz) {
      throw new ServiceError('NOT_FOUND', 'Quiz not found', 404)
    }

    await Promise.all(
      questionIds.map((id, index) =>
        prisma.question.update({
          where: { id },
          data: { order: index },
        })
      )
    )

    const reorderedQuestions = await prisma.question.findMany({
      where: { quizId },
      orderBy: { order: 'asc' },
      select: { id: true, question: true, order: true },
    })

    return jsonSuccess({
      success: true,
      data: reorderedQuestions,
      message: 'Questions reordered successfully',
    })
  } catch (error) {
    return handleErrorResponse(error, 'Failed to reorder questions')
  }
}
