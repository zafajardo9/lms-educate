import { NextRequest } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { ServiceError } from '@/lib/actions/api/errors'
import { UserRole } from '@/types'

// Validation schema
const updateQuestionSchema = z.object({
  type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY']).optional(),
  question: z.string().min(1).max(1000).optional(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1).optional(),
  explanation: z.string().max(1000).optional().nullable(),
  points: z.number().int().min(1).optional(),
  order: z.number().int().min(0).optional(),
})

// GET /api/business-owner/courses/[id]/quizzes/[quizId]/questions/[questionId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string; questionId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { quizId, questionId } = await params

    const question = await prisma.question.findFirst({
      where: { id: questionId, quizId },
      include: {
        quiz: {
          select: { id: true, title: true }
        }
      }
    })

    if (!question) {
      throw new ServiceError('NOT_FOUND', 'Question not found', 404)
    }

    return jsonSuccess({ success: true, data: question })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch question')
  }
}

// PUT /api/business-owner/courses/[id]/quizzes/[quizId]/questions/[questionId]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string; questionId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { quizId, questionId } = await params

    const body = await request.json()
    const updateData = updateQuestionSchema.parse(body)

    // Verify question exists
    const existing = await prisma.question.findFirst({
      where: { id: questionId, quizId }
    })

    if (!existing) {
      throw new ServiceError('NOT_FOUND', 'Question not found', 404)
    }

    // Validate options for multiple choice
    const finalType = updateData.type ?? existing.type
    if (finalType === 'MULTIPLE_CHOICE') {
      const finalOptions = updateData.options ?? existing.options
      if (!finalOptions || finalOptions.length < 2) {
        throw new ServiceError('VALIDATION_ERROR', 'Multiple choice questions require at least 2 options', 400)
      }
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: updateData
    })

    return jsonSuccess({
      success: true,
      data: updated,
      message: 'Question updated successfully'
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to update question')
  }
}

// DELETE /api/business-owner/courses/[id]/quizzes/[quizId]/questions/[questionId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string; questionId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { quizId, questionId } = await params

    const existing = await prisma.question.findFirst({
      where: { id: questionId, quizId }
    })

    if (!existing) {
      throw new ServiceError('NOT_FOUND', 'Question not found', 404)
    }

    await prisma.question.delete({
      where: { id: questionId }
    })

    return jsonSuccess({
      success: true,
      message: 'Question deleted successfully'
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to delete question')
  }
}
