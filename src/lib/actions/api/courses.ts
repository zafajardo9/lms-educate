import { Prisma } from '@prisma/client'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { CourseLevel, InvitationStatus, UserRole } from '@/types'
import { ServiceError } from './errors'
import { SessionUser } from './types/session'
import { buildPagination } from './utils'

const courseFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  level: z.nativeEnum(CourseLevel).optional(),
  lecturerId: z.string().optional(),
  isPublished: z.boolean().optional(),
  tags: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  level: z.nativeEnum(CourseLevel),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).optional(),
  price: z.number().min(0).optional(),
  thumbnail: z.string().url().optional(),
})

const updateCourseSchema = createCourseSchema.partial().extend({
  isPublished: z.boolean().optional(),
})

export async function listCourses(sessionUser: SessionUser, searchParams: URLSearchParams) {
  const rawIsPublished = searchParams.get('isPublished')
  const filters = courseFiltersSchema.parse({
    search: searchParams.get('search') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    level: searchParams.get('level') ?? undefined,
    lecturerId: searchParams.get('lecturerId') ?? undefined,
    isPublished:
      rawIsPublished === 'true'
        ? true
        : rawIsPublished === 'false'
          ? false
          : undefined,
    tags: searchParams.get('tags') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  })

  const tags = filters.tags
    ? filters.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
    : undefined

  const where: Prisma.CourseWhereInput = {}

  if (sessionUser.role === UserRole.LECTURER) {
    where.lecturerId = sessionUser.id
  } else if (sessionUser.role === UserRole.STUDENT) {
    where.isPublished = true
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters.category) {
    where.category = filters.category
  }

  if (filters.level) {
    where.level = filters.level
  }

  if (filters.lecturerId && sessionUser.role === UserRole.BUSINESS_OWNER) {
    where.lecturerId = filters.lecturerId
  }

  if (filters.isPublished !== undefined) {
    where.isPublished = filters.isPublished
  }

  if (tags && tags.length > 0) {
    where.tags = { hasSome: tags }
  }

  const skip = (filters.page - 1) * filters.limit

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      include: {
        lecturer: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: filters.limit,
    }),
    prisma.course.count({ where }),
  ])

  return {
    courses,
    pagination: buildPagination(filters.page, filters.limit, total),
  }
}

export async function createCourse(sessionUser: SessionUser, payload: unknown) {
  if (![UserRole.LECTURER, UserRole.BUSINESS_OWNER].includes(sessionUser.role)) {
    throw new ServiceError('FORBIDDEN', 'Insufficient permissions', 403)
  }

  const courseData = createCourseSchema.parse(payload)

  const membership = await prisma.organizationMembership.findFirst({
    where: {
      userId: sessionUser.id,
      invitationStatus: InvitationStatus.ACCEPTED,
    },
    select: { organizationId: true },
  })

  if (!membership) {
    throw new ServiceError('NO_ORGANIZATION', 'User must belong to an organization', 400)
  }

  return prisma.course.create({
    data: {
      ...courseData,
      tags: courseData.tags || [],
      lecturerId: sessionUser.id,
      organizationId: membership.organizationId,
      isPublished: false,
    },
    include: {
      lecturer: {
        select: { id: true, name: true, email: true },
      },
    },
  })
}

export async function getCourseById(sessionUser: SessionUser, courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      lecturer: { select: { id: true, name: true, email: true } },
      subCourses: true,
      lessons: true,
    },
  })

  if (!course) {
    throw new ServiceError('NOT_FOUND', 'Course not found', 404)
  }

  const canAccess =
    sessionUser.role === UserRole.BUSINESS_OWNER ||
    course.lecturerId === sessionUser.id ||
    (sessionUser.role === UserRole.STUDENT && course.isPublished)

  if (!canAccess) {
    throw new ServiceError('FORBIDDEN', 'Access denied', 403)
  }

  let enrollment = null
  if (sessionUser.role === UserRole.STUDENT) {
    enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: sessionUser.id,
          courseId,
        },
      },
    })
  }

  return { course, enrollment }
}

export async function updateCourse(sessionUser: SessionUser, courseId: string, payload: unknown) {
  const course = await prisma.course.findUnique({ where: { id: courseId } })

  if (!course) {
    throw new ServiceError('NOT_FOUND', 'Course not found', 404)
  }

  const canUpdate =
    sessionUser.role === UserRole.BUSINESS_OWNER || course.lecturerId === sessionUser.id

  if (!canUpdate) {
    throw new ServiceError('FORBIDDEN', 'Insufficient permissions', 403)
  }

  const updateData = updateCourseSchema.parse(payload)

  return prisma.course.update({
    where: { id: courseId },
    data: updateData,
    include: {
      lecturer: {
        select: { id: true, name: true, email: true },
      },
    },
  })
}

export async function deleteCourse(sessionUser: SessionUser, courseId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } })

  if (!course) {
    throw new ServiceError('NOT_FOUND', 'Course not found', 404)
  }

  const canDelete =
    sessionUser.role === UserRole.BUSINESS_OWNER || course.lecturerId === sessionUser.id

  if (!canDelete) {
    throw new ServiceError('FORBIDDEN', 'Insufficient permissions', 403)
  }

  const enrollmentCount = await prisma.enrollment.count({ where: { courseId } })
  if (enrollmentCount > 0) {
    throw new ServiceError(
      'CONFLICT',
      'Cannot delete course with active enrollments',
      409
    )
  }

  await prisma.course.delete({ where: { id: courseId } })
}

export async function enrollInCourse(sessionUser: SessionUser, courseId: string) {
  if (sessionUser.role !== UserRole.STUDENT) {
    throw new ServiceError('FORBIDDEN', 'Only students can enroll in courses', 403)
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) {
    throw new ServiceError('NOT_FOUND', 'Course not found', 404)
  }

  if (!course.isPublished) {
    throw new ServiceError('FORBIDDEN', 'Course is not available for enrollment', 403)
  }

  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: sessionUser.id,
        courseId,
      },
    },
  })

  if (existingEnrollment) {
    throw new ServiceError('CONFLICT', 'Already enrolled in this course', 409)
  }

  return prisma.enrollment.create({
    data: {
      studentId: sessionUser.id,
      courseId,
      organizationId: course.organizationId,
      enrolledAt: new Date(),
      progress: 0,
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true, description: true } },
    },
  })
}

export async function unenrollFromCourse(sessionUser: SessionUser, courseId: string) {
  if (sessionUser.role !== UserRole.STUDENT) {
    throw new ServiceError('FORBIDDEN', 'Only students can unenroll from courses', 403)
  }

  const result = await prisma.enrollment.deleteMany({
    where: {
      studentId: sessionUser.id,
      courseId,
    },
  })

  if (result.count === 0) {
    throw new ServiceError('NOT_FOUND', 'Enrollment not found', 404)
  }
}
