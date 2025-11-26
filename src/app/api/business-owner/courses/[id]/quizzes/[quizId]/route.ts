import { NextRequest } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { ServiceError } from '@/lib/actions/api/errors'
import { UserRole } from '@/types'

// Validation schema
const updateQuizSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000).optional(),
  timeLimit: z.number().int().min(1).optional().nullable(),
  maxAttempts: z.number().int().min(1).optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  order: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
})

// GET /api/business-owner/courses/[id]/quizzes/[quizId] - Get quiz details with questions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, quizId } = await params

    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, courseId },
      include: {
        course: {
          select: { id: true, title: true }
        },
        subCourse: {
          select: { id: true, title: true }
        },
        questions: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { submissions: true }
        }
      }
    })

    if (!quiz) {
      throw new ServiceError('NOT_FOUND', 'Quiz not found', 404)
    }

    return jsonSuccess({ success: true, data: quiz })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch quiz')
  }
}

// PUT /api/business-owner/courses/[id]/quizzes/[quizId] - Update quiz
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, quizId } = await params

    const body = await request.json()
    const updateData = updateQuizSchema.parse(body)

    // Verify quiz exists
    const existing = await prisma.quiz.findFirst({
      where: { id: quizId, courseId }
    })

    if (!existing) {
      throw new ServiceError('NOT_FOUND', 'Quiz not found', 404)
    }

    const updated = await prisma.quiz.update({
      where: { id: quizId },
      data: updateData,
      include: {
        _count: { select: { questions: true } }
      }
    })

    return jsonSuccess({
      success: true,
      data: updated,
      message: 'Quiz updated successfully'
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to update quiz')
  }
}

// PATCH /api/business-owner/courses/[id]/quizzes/[quizId] - Toggle visibility
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, quizId } = await params

    const body = await request.json()
    const patchSchema = z.object({
      isPublished: z.boolean()
    })
    const { isPublished } = patchSchema.parse(body)

    const existing = await prisma.quiz.findFirst({
      where: { id: quizId, courseId }
    })

    if (!existing) {
      throw new ServiceError('NOT_FOUND', 'Quiz not found', 404)
    }

    const updated = await prisma.quiz.update({
      where: { id: quizId },
      data: { isPublished },
      select: { id: true, title: true, isPublished: true }
    })

    return jsonSuccess({
      success: true,
      data: updated,
      message: isPublished ? 'Quiz published' : 'Quiz hidden'
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to update quiz visibility')
  }
}

// DELETE /api/business-owner/courses/[id]/quizzes/[quizId] - Delete quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; quizId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, quizId } = await params

    const existing = await prisma.quiz.findFirst({
      where: { id: quizId, courseId },
      include: {
        _count: { select: { questions: true, submissions: true } }
      }
    })

    if (!existing) {
      throw new ServiceError('NOT_FOUND', 'Quiz not found', 404)
    }

    // Warn if quiz has submissions
    if (existing._count.submissions > 0) {
      const { searchParams } = new URL(request.url)
      const force = searchParams.get('force') === 'true'
      
      if (!force) {
        throw new ServiceError(
          'CONFLICT',
          `Quiz has ${existing._count.submissions} submissions. Add ?force=true to delete anyway.`,
          409
        )
      }
    }

    await prisma.quiz.delete({
      where: { id: quizId }
    })

    return jsonSuccess({
      success: true,
      message: `Quiz "${existing.title}" deleted with ${existing._count.questions} questions`
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to delete quiz')
  }
}
