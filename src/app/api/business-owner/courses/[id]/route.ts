import { NextRequest } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { ServiceError } from '@/lib/actions/api/errors'
import { UserRole } from '@/types'

// Validation schema for course updates
const updateCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long').optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).optional(),
  price: z.number().min(0).optional(),
  thumbnail: z.string().url().optional(),
  isPublished: z.boolean().optional(),
  // Status and availability
  status: z.enum(['DRAFT', 'ACTIVE', 'DISABLED', 'ARCHIVED']).optional(),
  availableFrom: z.string().datetime().nullable().optional(),
  availableUntil: z.string().datetime().nullable().optional(),
  enrollmentOpen: z.boolean().optional(),
  // Reassign lecturer
  lecturerId: z.string().optional(),
})

// GET /api/business-owner/courses/[id] - Get course by ID (business owner only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id } = await params

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        lecturer: {
          select: { id: true, name: true, email: true }
        },
        subCourses: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                order: true,
                isPublished: true,
                duration: true,
              }
            },
            quizzes: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                order: true,
                isPublished: true,
                _count: { select: { questions: true } }
              }
            },
            _count: {
              select: { lessons: true, quizzes: true }
            }
          }
        },
        lessons: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            order: true,
            isPublished: true,
            duration: true,
          }
        }
      }
    })

    if (!course) {
      throw new ServiceError('NOT_FOUND', 'Course not found', 404)
    }

    return jsonSuccess({ success: true, data: course })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch course')
  }
}

// PUT /api/business-owner/courses/[id] - Update course (business owner only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id } = await params

    const body = await request.json()
    const validatedData = updateCourseSchema.parse(body)

    // Convert date strings to Date objects
    const { availableFrom, availableUntil, ...restData } = validatedData
    const updateData: any = { ...restData }
    
    if (availableFrom !== undefined) {
      updateData.availableFrom = availableFrom ? new Date(availableFrom) : null
    }
    if (availableUntil !== undefined) {
      updateData.availableUntil = availableUntil ? new Date(availableUntil) : null
    }

    // Update course
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        lecturer: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return jsonSuccess({
      success: true,
      data: updatedCourse,
      message: 'Course updated successfully'
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to update course')
  }
}

// PATCH /api/business-owner/courses/[id] - Quick status/availability update
const patchCourseSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'DISABLED', 'ARCHIVED']).optional(),
  isPublished: z.boolean().optional(),
  enrollmentOpen: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id } = await params

    const body = await request.json()
    const updateData = patchCourseSchema.parse(body)

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        status: true,
        isPublished: true,
        enrollmentOpen: true,
        updatedAt: true,
      }
    })

    return jsonSuccess({
      success: true,
      data: updatedCourse,
      message: 'Course status updated successfully'
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to update course status')
  }
}

// DELETE /api/business-owner/courses/[id] - Delete course (business owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id } = await params

    // Check if course has enrollments
    const enrollmentCount = await prisma.enrollment.count({
      where: { courseId: id }
    })
    if (enrollmentCount > 0) {
      throw new ServiceError('CONFLICT', 'Cannot delete course with active enrollments', 409)
    }

    // Delete the course (cascading deletes handled by Prisma schema)
    await prisma.course.delete({ where: { id } })

    return jsonSuccess({ success: true, message: 'Course deleted successfully' })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to delete course')
  }
}