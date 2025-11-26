import { NextRequest } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { ServiceError } from '@/lib/actions/api/errors'
import { UserRole } from '@/types'

// Validation schemas
const createSubCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  order: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
})

// GET /api/business-owner/courses/[id]/subcourses - List all subcourses
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId } = await params

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, organizationId: true }
    })

    if (!course) {
      throw new ServiceError('NOT_FOUND', 'Course not found', 404)
    }

    const subCourses = await prisma.subCourse.findMany({
      where: { courseId },
      include: {
        lessons: {
          select: { id: true, title: true, order: true, isPublished: true },
          orderBy: { order: 'asc' }
        },
        quizzes: {
          select: { id: true, title: true, order: true, isPublished: true },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { lessons: true, quizzes: true }
        }
      },
      orderBy: { order: 'asc' }
    })

    return jsonSuccess({
      success: true,
      data: {
        courseId,
        courseTitle: course.title,
        subCourses
      }
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch subcourses')
  }
}

// POST /api/business-owner/courses/[id]/subcourses - Create subcourse
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId } = await params

    const body = await request.json()
    const data = createSubCourseSchema.parse(body)

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
      const lastSubCourse = await prisma.subCourse.findFirst({
        where: { courseId },
        orderBy: { order: 'desc' },
        select: { order: true }
      })
      order = (lastSubCourse?.order ?? -1) + 1
    }

    const subCourse = await prisma.subCourse.create({
      data: {
        title: data.title,
        description: data.description,
        order,
        isPublished: data.isPublished ?? false,
        courseId,
        organizationId: course.organizationId,
      },
      include: {
        _count: { select: { lessons: true, quizzes: true } }
      }
    })

    return jsonSuccess(
      { success: true, data: subCourse, message: 'Subcourse created successfully' },
      { status: 201 }
    )

  } catch (error) {
    return handleErrorResponse(error, 'Failed to create subcourse')
  }
}

// PUT /api/business-owner/courses/[id]/subcourses - Reorder subcourses
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId } = await params

    const body = await request.json()
    const reorderSchema = z.object({
      subCourseIds: z.array(z.string()).min(1, 'At least one subcourse ID required')
    })
    const { subCourseIds } = reorderSchema.parse(body)

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true }
    })

    if (!course) {
      throw new ServiceError('NOT_FOUND', 'Course not found', 404)
    }

    // Update order for each subcourse
    await Promise.all(
      subCourseIds.map((id, index) =>
        prisma.subCourse.update({
          where: { id },
          data: { order: index }
        })
      )
    )

    const updatedSubCourses = await prisma.subCourse.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      select: { id: true, title: true, order: true }
    })

    return jsonSuccess({
      success: true,
      data: updatedSubCourses,
      message: 'Subcourses reordered successfully'
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to reorder subcourses')
  }
}
