import { NextRequest } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { auth } from '@/lib/auth'
import { ServiceError } from '@/lib/actions/api/errors'
import { UserRole } from '@/types'

// Validation schemas
const enrollStudentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  cohortId: z.string().optional(), // Optional: assign to cohort on enrollment
  groupId: z.string().optional(),  // Optional: assign to group on enrollment
})

const bulkEnrollSchema = z.object({
  studentIds: z.array(z.string()).min(1, 'At least one student ID required'),
  cohortId: z.string().optional(),
  groupId: z.string().optional(),
})

// GET /api/business-owner/courses/[id]/enrollments - List all enrolled students
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession(request)
    if (!session) {
      return Response.json({ success: false, error: { message: 'Unauthorized', code: 401 } }, { status: 401 })
    }

    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId } = await params

    // Parse query params
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const search = searchParams.get('search')?.trim()
    const cohortId = searchParams.get('cohortId')
    const groupId = searchParams.get('groupId')
    const status = searchParams.get('status') // 'completed', 'in_progress', 'not_started'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, organizationId: true, title: true }
    })

    if (!course) {
      throw new ServiceError('NOT_FOUND', 'Course not found', 404)
    }

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { courseId }

    // Search by student name or email
    if (search) {
      where.student = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ]
      }
    }

    // Filter by cohort
    if (cohortId && cohortId !== 'all') {
      where.cohortId = cohortId
    }

    // Filter by group
    if (groupId && groupId !== 'all') {
      where.courseGroupMemberships = {
        some: { groupId }
      }
    }

    // Filter by status
    if (status) {
      switch (status) {
        case 'completed':
          where.completedAt = { not: null }
          break
        case 'in_progress':
          where.progress = { gt: 0, lt: 100 }
          where.completedAt = null
          break
        case 'not_started':
          where.progress = 0
          where.completedAt = null
          break
      }
    }

    // Filter by enrollment date range
    if (startDate) {
      where.enrolledAt = { ...where.enrolledAt, gte: new Date(startDate) }
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      where.enrolledAt = { ...where.enrolledAt, lte: end }
    }

    // Get total count for pagination
    const total = await prisma.enrollment.count({ where })

    // Get paginated enrollments
    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: { select: { avatar: true } }
          }
        },
        cohort: { select: { id: true, name: true } },
        courseGroupMemberships: {
          include: {
            group: { select: { id: true, name: true, type: true } }
          }
        },
      },
      orderBy: { enrolledAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    // Transform enrollments to match frontend type
    const transformedEnrollments = enrollments.map(enrollment => ({
      id: enrollment.id,
      student: enrollment.student,
      cohort: enrollment.cohort,
      groups: enrollment.courseGroupMemberships.map(m => ({
        id: m.group.id,
        name: m.group.name,
        type: m.group.type,
      })),
      progress: enrollment.progress,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      lastAccessedAt: enrollment.lastAccessedAt,
    }))

    return jsonSuccess({
      success: true,
      data: {
        courseId,
        courseTitle: course.title,
        enrollments: transformedEnrollments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      }
    })
  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch enrollments')
  }
}

// POST /api/business-owner/courses/[id]/enrollments - Enroll student(s)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession(request)
    if (!session) {
      return Response.json({ success: false, error: { message: 'Unauthorized', code: 401 } }, { status: 401 })
    }

    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId } = await params

    const body = await request.json()

    // Check if bulk or single enrollment
    const isBulk = Array.isArray(body.studentIds)

    // Verify course exists and get organization
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, organizationId: true, enrollmentOpen: true, title: true }
    })

    if (!course) {
      throw new ServiceError('NOT_FOUND', 'Course not found', 404)
    }

    if (!course.enrollmentOpen) {
      throw new ServiceError('FORBIDDEN', 'Enrollment is closed for this course', 403)
    }

    if (isBulk) {
      // Bulk enrollment
      const { studentIds, cohortId, groupId } = bulkEnrollSchema.parse(body)

      // Validate students exist and are STUDENT role
      const students = await prisma.user.findMany({
        where: { id: { in: studentIds }, role: 'STUDENT' },
        select: { id: true }
      })

      const validStudentIds = new Set(students.map(s => s.id))
      const invalidIds = studentIds.filter(id => !validStudentIds.has(id))

      if (invalidIds.length > 0) {
        throw new ServiceError(
          'VALIDATION_ERROR',
          `Invalid or non-student user IDs: ${invalidIds.join(', ')}`,
          400
        )
      }

      // Check for existing enrollments
      const existingEnrollments = await prisma.enrollment.findMany({
        where: { courseId, studentId: { in: studentIds } },
        select: { studentId: true }
      })
      const alreadyEnrolled = new Set(existingEnrollments.map(e => e.studentId))
      const newStudentIds = studentIds.filter(id => !alreadyEnrolled.has(id))

      if (newStudentIds.length === 0) {
        throw new ServiceError('CONFLICT', 'All students are already enrolled', 409)
      }

      // Validate cohort if provided
      if (cohortId) {
        const cohort = await prisma.cohort.findFirst({
          where: { id: cohortId, courseId },
          include: { _count: { select: { enrollments: true } } }
        })
        if (!cohort) {
          throw new ServiceError('NOT_FOUND', 'Cohort not found', 404)
        }
        if (cohort.enrollmentLimit && cohort._count.enrollments + newStudentIds.length > cohort.enrollmentLimit) {
          throw new ServiceError('CONFLICT', `Cohort enrollment limit (${cohort.enrollmentLimit}) would be exceeded`, 409)
        }
      }

      // Validate group if provided
      if (groupId) {
        const group = await prisma.courseGroup.findFirst({
          where: { id: groupId, courseId, isArchived: false },
          include: { _count: { select: { memberships: true } } }
        })
        if (!group) {
          throw new ServiceError('NOT_FOUND', 'Group not found', 404)
        }
        if (group.maxMembers && group._count.memberships + newStudentIds.length > group.maxMembers) {
          throw new ServiceError('CONFLICT', `Group member limit (${group.maxMembers}) would be exceeded`, 409)
        }
      }

      // Create enrollments
      const enrollments = await prisma.$transaction(async (tx) => {
        const created = await tx.enrollment.createMany({
          data: newStudentIds.map(studentId => ({
            studentId,
            courseId,
            cohortId,
            organizationId: course.organizationId,
          }))
        })

        // Get created enrollment IDs for group membership
        if (groupId) {
          const newEnrollments = await tx.enrollment.findMany({
            where: { courseId, studentId: { in: newStudentIds } },
            select: { id: true, studentId: true }
          })

          await tx.courseGroupMembership.createMany({
            data: newEnrollments.map(e => ({
              groupId,
              enrollmentId: e.id,
              studentId: e.studentId,
            }))
          })
        }

        return created
      })

      return jsonSuccess(
        {
          success: true,
          data: {
            enrolled: enrollments.count,
            skipped: alreadyEnrolled.size,
            skippedIds: Array.from(alreadyEnrolled),
          },
          message: `${enrollments.count} student(s) enrolled successfully`
        },
        { status: 201 }
      )

    } else {
      // Single enrollment
      const { studentId, cohortId, groupId } = enrollStudentSchema.parse(body)

      // Validate student
      const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true, name: true, role: true }
      })

      if (!student) {
        throw new ServiceError('NOT_FOUND', 'Student not found', 404)
      }

      if (student.role !== 'STUDENT') {
        throw new ServiceError('VALIDATION_ERROR', 'User is not a student', 400)
      }

      // Check existing enrollment
      const existing = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId } }
      })

      if (existing) {
        throw new ServiceError('CONFLICT', 'Student is already enrolled in this course', 409)
      }

      // Validate cohort if provided
      if (cohortId) {
        const cohort = await prisma.cohort.findFirst({
          where: { id: cohortId, courseId },
          include: { _count: { select: { enrollments: true } } }
        })
        if (!cohort) {
          throw new ServiceError('NOT_FOUND', 'Cohort not found', 404)
        }
        if (cohort.enrollmentLimit && cohort._count.enrollments >= cohort.enrollmentLimit) {
          throw new ServiceError('CONFLICT', 'Cohort is full', 409)
        }
      }

      // Validate group if provided
      if (groupId) {
        const group = await prisma.courseGroup.findFirst({
          where: { id: groupId, courseId, isArchived: false },
          include: { _count: { select: { memberships: true } } }
        })
        if (!group) {
          throw new ServiceError('NOT_FOUND', 'Group not found', 404)
        }
        if (group.maxMembers && group._count.memberships >= group.maxMembers) {
          throw new ServiceError('CONFLICT', 'Group is full', 409)
        }
      }

      // Create enrollment with optional cohort and group
      const enrollment = await prisma.$transaction(async (tx) => {
        const created = await tx.enrollment.create({
          data: {
            studentId,
            courseId,
            cohortId,
            organizationId: course.organizationId,
          },
          include: {
            student: { select: { id: true, name: true, email: true } },
            cohort: { select: { id: true, name: true } },
          }
        })

        // Add to group if specified
        if (groupId) {
          await tx.courseGroupMembership.create({
            data: {
              groupId,
              enrollmentId: created.id,
              studentId,
            }
          })
        }

        return created
      })

      return jsonSuccess(
        {
          success: true,
          data: enrollment,
          message: `${student.name} enrolled in ${course.title}`
        },
        { status: 201 }
      )
    }
  } catch (error) {
    return handleErrorResponse(error, 'Failed to enroll student')
  }
}
