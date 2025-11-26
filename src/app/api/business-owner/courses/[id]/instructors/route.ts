import { NextRequest } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { ServiceError } from '@/lib/actions/api/errors'
import { UserRole } from '@/types'

// Validation schemas
const addInstructorSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['OWNER', 'LEAD_INSTRUCTOR', 'INSTRUCTOR', 'TA', 'REVIEWER']).default('INSTRUCTOR'),
  permissions: z.object({
    canEditContent: z.boolean().optional(),
    canManageStudents: z.boolean().optional(),
    canGradeQuizzes: z.boolean().optional(),
    canViewAnalytics: z.boolean().optional(),
  }).optional(),
})

const updateInstructorSchema = z.object({
  role: z.enum(['OWNER', 'LEAD_INSTRUCTOR', 'INSTRUCTOR', 'TA', 'REVIEWER']).optional(),
  permissions: z.object({
    canEditContent: z.boolean().optional(),
    canManageStudents: z.boolean().optional(),
    canGradeQuizzes: z.boolean().optional(),
    canViewAnalytics: z.boolean().optional(),
  }).optional(),
})

// GET /api/business-owner/courses/[id]/instructors - List all instructors for a course
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
      select: { id: true, title: true, lecturerId: true }
    })

    if (!course) {
      throw new ServiceError('NOT_FOUND', 'Course not found', 404)
    }

    // Get all instructors for this course
    const instructors = await prisma.courseInstructor.findMany({
      where: { 
        courseId,
        removedAt: null // Only active instructors
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        invitedBy: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { role: 'asc' },
        { addedAt: 'asc' }
      ]
    })

    // Also get the primary lecturer info
    const primaryLecturer = await prisma.user.findUnique({
      where: { id: course.lecturerId },
      select: { id: true, name: true, email: true, role: true }
    })

    return jsonSuccess({
      success: true,
      data: {
        courseId,
        courseTitle: course.title,
        primaryLecturer,
        instructors: instructors.map(i => ({
          id: i.id,
          user: i.user,
          role: i.role,
          permissions: i.permissions,
          addedAt: i.addedAt,
          invitedBy: i.invitedBy,
        }))
      }
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch course instructors')
  }
}

// POST /api/business-owner/courses/[id]/instructors - Add instructor to course
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId } = await params

    const body = await request.json()
    const { userId, role, permissions } = addInstructorSchema.parse(body)

    // Verify course exists and get organization
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, organizationId: true, lecturerId: true }
    })

    if (!course) {
      throw new ServiceError('NOT_FOUND', 'Course not found', 404)
    }

    // Verify the user exists and is a lecturer
    const userToAdd = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true }
    })

    if (!userToAdd) {
      throw new ServiceError('NOT_FOUND', 'User not found', 404)
    }

    if (userToAdd.role !== UserRole.LECTURER) {
      throw new ServiceError('VALIDATION_ERROR', 'Only lecturers can be added as course instructors', 400)
    }

    // Check if user is already the primary lecturer
    if (course.lecturerId === userId) {
      throw new ServiceError('CONFLICT', 'This user is already the primary lecturer for this course', 409)
    }

    // Check if already an instructor
    const existingInstructor = await prisma.courseInstructor.findUnique({
      where: { courseId_userId: { courseId, userId } }
    })

    if (existingInstructor) {
      if (existingInstructor.removedAt) {
        // Reactivate the instructor
        const reactivated = await prisma.courseInstructor.update({
          where: { id: existingInstructor.id },
          data: {
            removedAt: null,
            role,
            permissions,
            invitedById: currentUser.id,
            addedAt: new Date(),
          },
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        })

        return jsonSuccess({
          success: true,
          data: reactivated,
          message: `${userToAdd.name} has been re-added as ${role}`
        })
      }
      throw new ServiceError('CONFLICT', 'User is already an instructor for this course', 409)
    }

    // Add new instructor
    const instructor = await prisma.courseInstructor.create({
      data: {
        courseId,
        organizationId: course.organizationId,
        userId,
        role,
        permissions,
        invitedById: currentUser.id,
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    })

    return jsonSuccess(
      {
        success: true,
        data: instructor,
        message: `${userToAdd.name} added as ${role}`
      },
      { status: 201 }
    )

  } catch (error) {
    return handleErrorResponse(error, 'Failed to add instructor')
  }
}

// PUT /api/business-owner/courses/[id]/instructors - Bulk update instructors
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId } = await params

    const body = await request.json()
    
    // Validate bulk update schema
    const bulkUpdateSchema = z.object({
      instructors: z.array(z.object({
        userId: z.string(),
        role: z.enum(['OWNER', 'LEAD_INSTRUCTOR', 'INSTRUCTOR', 'TA', 'REVIEWER']),
        permissions: z.object({
          canEditContent: z.boolean().optional(),
          canManageStudents: z.boolean().optional(),
          canGradeQuizzes: z.boolean().optional(),
          canViewAnalytics: z.boolean().optional(),
        }).optional(),
      }))
    })

    const { instructors } = bulkUpdateSchema.parse(body)

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, organizationId: true }
    })

    if (!course) {
      throw new ServiceError('NOT_FOUND', 'Course not found', 404)
    }

    // Update each instructor
    const results = await Promise.all(
      instructors.map(async (inst) => {
        return prisma.courseInstructor.upsert({
          where: { courseId_userId: { courseId, userId: inst.userId } },
          update: {
            role: inst.role,
            permissions: inst.permissions,
            removedAt: null, // Reactivate if was removed
          },
          create: {
            courseId,
            organizationId: course.organizationId,
            userId: inst.userId,
            role: inst.role,
            permissions: inst.permissions,
          },
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        })
      })
    )

    return jsonSuccess({
      success: true,
      data: results,
      message: `Updated ${results.length} instructor(s)`
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to update instructors')
  }
}
