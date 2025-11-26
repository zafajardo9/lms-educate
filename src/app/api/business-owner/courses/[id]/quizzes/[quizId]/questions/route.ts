import { NextRequest } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { ServiceError } from '@/lib/actions/api/errors'
import { UserRole } from '@/types'

// Validation schemas
const createQuestionSchema = z.object({
  type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY']),
  question: z.string().min(1, 'Question is required').max(1000),
  options: z.array(z.string()).optional(), // Required for MULTIPLE_CHOICE
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  explanation: z.string().max(1000).optional().nullable(),
  points: z.number().int().min(1).default(1),
  order: z.number().int().min(0).optional(),
})

const bulkCreateQuestionsSchema = z.object({
  questions: z.array(createQuestionSchema).min(1, 'At least one question required')
})

// GET /api/business-owner/courses/[id]/quizzes/[quizId]/questions - List questions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, quizId } = await params

    // Verify quiz exists
    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, courseId },
      select: { id: true, title: true }
    })

    if (!quiz) {
      throw new ServiceError('NOT_FOUND', 'Quiz not found', 404)
    }

    const questions = await prisma.question.findMany({
      where: { quizId },
      orderBy: { order: 'asc' }
    })

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0)

    return jsonSuccess({
      success: true,
      data: {
        quizId,
        quizTitle: quiz.title,
        questions,
        totalQuestions: questions.length,
        totalPoints
      }
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch questions')
  }
}

// POST /api/business-owner/courses/[id]/quizzes/[quizId]/questions - Create question(s)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, quizId } = await params

    const body = await request.json()

    // Verify quiz exists
    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, courseId }
    })

    if (!quiz) {
      throw new ServiceError('NOT_FOUND', 'Quiz not found', 404)
    }

    // Check if bulk or single
    if (body.questions && Array.isArray(body.questions)) {
      // Bulk create
      const { questions } = bulkCreateQuestionsSchema.parse(body)

      // Get current max order
      const lastQuestion = await prisma.question.findFirst({
        where: { quizId },
        orderBy: { order: 'desc' },
        select: { order: true }
      })
      let nextOrder = (lastQuestion?.order ?? -1) + 1

      const createdQuestions = await prisma.question.createMany({
        data: questions.map((q, index) => ({
          quizId,
          type: q.type,
          question: q.question,
          options: q.options ?? [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          points: q.points,
          order: q.order ?? nextOrder + index,
        }))
      })

      return jsonSuccess(
        { 
          success: true, 
          data: { count: createdQuestions.count },
          message: `${createdQuestions.count} questions created successfully`
        },
        { status: 201 }
      )
    } else {
      // Single create
      const data = createQuestionSchema.parse(body)

      // Validate options for multiple choice
      if (data.type === 'MULTIPLE_CHOICE' && (!data.options || data.options.length < 2)) {
        throw new ServiceError('VALIDATION_ERROR', 'Multiple choice questions require at least 2 options', 400)
      }

      // Get next order if not provided
      let order = data.order
      if (order === undefined) {
        const lastQuestion = await prisma.question.findFirst({
          where: { quizId },
          orderBy: { order: 'desc' },
          select: { order: true }
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
        }
      })

      return jsonSuccess(
        { success: true, data: question, message: 'Question created successfully' },
        { status: 201 }
      )
    }

  } catch (error) {
    return handleErrorResponse(error, 'Failed to create question')
  }
}

// PUT /api/business-owner/courses/[id]/quizzes/[quizId]/questions - Reorder questions
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, quizId } = await params

    const body = await request.json()
    const reorderSchema = z.object({
      questionIds: z.array(z.string()).min(1)
    })
    const { questionIds } = reorderSchema.parse(body)

    // Verify quiz exists
    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, courseId }
    })

    if (!quiz) {
      throw new ServiceError('NOT_FOUND', 'Quiz not found', 404)
    }

    // Update order for each question
    await Promise.all(
      questionIds.map((id, index) =>
        prisma.question.update({
          where: { id },
          data: { order: index }
        })
      )
    )

    const updatedQuestions = await prisma.question.findMany({
      where: { quizId },
      orderBy: { order: 'asc' },
      select: { id: true, question: true, order: true }
    })

    return jsonSuccess({
      success: true,
      data: updatedQuestions,
      message: 'Questions reordered successfully'
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to reorder questions')
  }
}
