import { NextRequest } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { ServiceError } from '@/lib/actions/api/errors'
import { UserRole } from '@/types'

// Validation schemas
const createCohortSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  enrollmentLimit: z.number().int().min(1).optional().nullable(),
  status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  timezone: z.string().max(50).optional().nullable(),
})

// GET /api/business-owner/courses/[id]/cohorts - List all cohorts for a course
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
      select: { id: true, title: true }
    })

    if (!course) {
      throw new ServiceError('NOT_FOUND', 'Course not found', 404)
    }

    // Get filter params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const whereClause: any = { courseId }
    if (status) {
      whereClause.status = status
    }

    const cohorts = await prisma.cohort.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { 
            enrollments: true,
            cohortMemberships: true 
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { startDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    return jsonSuccess({
      success: true,
      data: {
        courseId,
        courseTitle: course.title,
        cohorts: cohorts.map(c => ({
          ...c,
          enrolledCount: c._count.enrollments,
          spotsRemaining: c.enrollmentLimit ? c.enrollmentLimit - c._count.enrollments : null,
        }))
      }
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch cohorts')
  }
}

// POST /api/business-owner/courses/[id]/cohorts - Create a new cohort
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId } = await params

    const body = await request.json()
    const data = createCohortSchema.parse(body)

    // Verify course exists and get organization
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, organizationId: true }
    })

    if (!course) {
      throw new ServiceError('NOT_FOUND', 'Course not found', 404)
    }

    // Validate dates
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      if (end <= start) {
        throw new ServiceError('VALIDATION_ERROR', 'End date must be after start date', 400)
      }
    }

    const cohort = await prisma.cohort.create({
      data: {
        name: data.name,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        enrollmentLimit: data.enrollmentLimit,
        status: data.status ?? 'PLANNED',
        timezone: data.timezone,
        courseId,
        organizationId: course.organizationId,
      },
      include: {
        _count: { select: { enrollments: true } }
      }
    })

    return jsonSuccess(
      { success: true, data: cohort, message: 'Cohort created successfully' },
      { status: 201 }
    )

  } catch (error) {
    return handleErrorResponse(error, 'Failed to create cohort')
  }
}
