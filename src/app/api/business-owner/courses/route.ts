import { NextRequest } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { ServiceError } from '@/lib/actions/api/errors'
import { UserRole } from '@/types'

// Validation schemas
const createCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  price: z.number().min(0).optional(),
  thumbnail: z.string().url().optional(),
  // Availability settings
  availableFrom: z.string().datetime().optional(),
  availableUntil: z.string().datetime().optional(),
  enrollmentOpen: z.boolean().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'DISABLED', 'ARCHIVED']).optional(),
  isPublished: z.boolean().optional(),
  // Assign to a specific lecturer (optional, defaults to creator)
  lecturerId: z.string().optional(),
})

const courseFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'DISABLED', 'ARCHIVED']).optional(),
  lecturerId: z.string().optional(),
  isPublished: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
})

// GET /api/business-owner/courses - List all courses (business owner only)
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)

    const { searchParams } = new URL(request.url)
    const filters = courseFiltersSchema.parse({
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      level: searchParams.get('level') || undefined,
      lecturerId: searchParams.get('lecturerId') || undefined,
      isPublished: searchParams.get('isPublished') === 'true' ? true : 
                   searchParams.get('isPublished') === 'false' ? false : undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    })

    // Build Prisma where clause - business owners can see all courses
    const where: any = {}

    // Apply filters
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ]
    }
    
    if (filters.category) {
      where.category = filters.category
    }
    
    if (filters.level) {
      where.level = filters.level
    }

    if (filters.status) {
      where.status = filters.status
    }
    
    if (filters.lecturerId) {
      where.lecturerId = filters.lecturerId
    }
    
    if (filters.isPublished !== undefined) {
      where.isPublished = filters.isPublished
    }
    
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags }
    }

    // Calculate pagination
    const skip = (filters.page - 1) * filters.limit
    
    // Execute query with pagination
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          lecturer: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { enrollments: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: filters.limit
      }),
      prisma.course.count({ where })
    ])

    const totalPages = Math.ceil(total / filters.limit)

    return jsonSuccess({
      success: true,
      data: {
        courses,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages,
          hasNext: filters.page < totalPages,
          hasPrev: filters.page > 1,
        }
      }
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch courses')
  }
}

// POST /api/business-owner/courses - Create new course (business owner only)
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, UserRole.BUSINESS_OWNER)

    const body = await request.json()
    const courseData = createCourseSchema.parse(body)

    // Get user's organization (required for course creation)
    const userOrg = await prisma.organizationMembership.findFirst({
      where: { userId: user.id },
      select: { organizationId: true }
    })

    if (!userOrg) {
      throw new ServiceError('VALIDATION_ERROR', 'User must belong to an organization', 400)
    }

    // Prepare course data with proper date conversion
    const { availableFrom, availableUntil, lecturerId, status, isPublished, ...restData } = courseData

    let assignedLecturerId = lecturerId || user.id

    if (lecturerId) {
      const lecturer = await prisma.user.findUnique({
        where: { id: lecturerId },
        select: { id: true, name: true, email: true, role: true, isActive: true },
      })

      if (!lecturer || lecturer.role !== UserRole.LECTURER || !lecturer.isActive) {
        throw new ServiceError('LECTURER_INVALID', 'Selected lecturer is not available', 400)
      }

      const lecturerMembership = await prisma.organizationMembership.findFirst({
        where: {
          organizationId: userOrg.organizationId,
          userId: lecturerId,
        },
      })

      if (!lecturerMembership) {
        throw new ServiceError(
          'LECTURER_NOT_IN_ORGANIZATION',
          'Selected lecturer is not part of your organization',
          400
        )
      }

      assignedLecturerId = lecturerId
    }

    const course = await prisma.course.create({
      data: {
        ...restData,
        lecturerId: assignedLecturerId, // Use validated lecturer or default to creator
        organizationId: userOrg.organizationId,
        status: status ?? 'DRAFT',
        isPublished: isPublished ?? false,
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        availableUntil: availableUntil ? new Date(availableUntil) : null,
      },
      include: {
        lecturer: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return jsonSuccess(
      { success: true, data: course, message: 'Course created successfully' },
      { status: 201 }
    )

  } catch (error) {
    return handleErrorResponse(error, 'Failed to create course')
  }
}