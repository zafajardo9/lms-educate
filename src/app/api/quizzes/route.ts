import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import connectDB from '@/lib/mongodb'
import { requireAuth } from '@/lib/middleware/auth'
import { Quiz } from '@/lib/models/Quiz'
import { UserRole } from '@/types'

const quizzesQuerySchema = z.object({
  courseId: z.string().optional(),
  isPublished: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export async function GET(request: NextRequest) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const filters = quizzesQuerySchema.parse({
      courseId: searchParams.get('courseId') ?? undefined,
      isPublished: searchParams.get('isPublished') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    })

    const query: Record<string, any> = {}

    if (filters.courseId) {
      query.courseId = filters.courseId
    }

    if (filters.isPublished !== undefined) {
      query.isPublished = filters.isPublished
    }

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ]
    }

    // Students can only see published quizzes
    if (user.role === UserRole.STUDENT) {
      query.isPublished = true
    }

    const skip = (filters.page - 1) * filters.limit

    const [quizzes, total] = await Promise.all([
      Quiz.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit)
        .lean(),
      Quiz.countDocuments(query),
    ])

    const totalPages = Math.max(1, Math.ceil(total / filters.limit))

    return NextResponse.json({
      success: true,
      data: quizzes,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages,
        hasNext: filters.page < totalPages,
        hasPrev: filters.page > 1,
      },
    })
  } catch (error) {
    console.error('Error listing quizzes:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch quizzes',
        },
      },
      { status: 500 }
    )
  }
}
