import { NextRequest } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { ServiceError } from '@/lib/actions/api/errors'
import { UserRole } from '@/types'

// Validation schemas
const createGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  type: z.enum(['STUDY', 'DISCUSSION', 'PROJECT', 'CUSTOM']).default('STUDY'),
  isDefault: z.boolean().optional(),
  maxMembers: z.number().int().min(1).optional().nullable(),
  allowedSubCourseIds: z.array(z.string()).optional(), // Empty = all subcourses accessible
  metadata: z.record(z.any()).optional().nullable(),
})

// GET /api/business-owner/courses/[id]/groups - List all groups for a course
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
    const type = searchParams.get('type')
    const includeArchived = searchParams.get('archived') === 'true'

    const whereClause: any = { courseId }
    if (type) {
      whereClause.type = type
    }
    if (!includeArchived) {
      whereClause.isArchived = false
    }

    const groups = await prisma.courseGroup.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { id: true, name: true }
        },
        _count: {
          select: { memberships: true }
        }
      },
      orderBy: [
        { isDefault: 'desc' },
        { type: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Get subcourse names for groups with restrictions
    const subCourseIds = groups.flatMap(g => g.allowedSubCourseIds)
    const subCourses = subCourseIds.length > 0
      ? await prisma.subCourse.findMany({
          where: { id: { in: subCourseIds } },
          select: { id: true, title: true }
        })
      : []

    const subCourseMap = new Map(subCourses.map(s => [s.id, s.title]))

    return jsonSuccess({
      success: true,
      data: {
        courseId,
        courseTitle: course.title,
        groups: groups.map(g => ({
          ...g,
          memberCount: g._count.memberships,
          spotsRemaining: g.maxMembers ? g.maxMembers - g._count.memberships : null,
          allowedSubCourses: g.allowedSubCourseIds.map(id => ({
            id,
            title: subCourseMap.get(id) || 'Unknown'
          })),
          hasSubCourseRestriction: g.allowedSubCourseIds.length > 0,
        }))
      }
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch groups')
  }
}

// POST /api/business-owner/courses/[id]/groups - Create a new group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId } = await params

    const body = await request.json()
    const data = createGroupSchema.parse(body)

    // Verify course exists and get organization
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, organizationId: true }
    })

    if (!course) {
      throw new ServiceError('NOT_FOUND', 'Course not found', 404)
    }

    // Validate allowedSubCourseIds if provided
    if (data.allowedSubCourseIds && data.allowedSubCourseIds.length > 0) {
      const validSubCourses = await prisma.subCourse.findMany({
        where: {
          id: { in: data.allowedSubCourseIds },
          courseId
        },
        select: { id: true }
      })

      const validIds = new Set(validSubCourses.map(s => s.id))
      const invalidIds = data.allowedSubCourseIds.filter(id => !validIds.has(id))

      if (invalidIds.length > 0) {
        throw new ServiceError(
          'VALIDATION_ERROR',
          `Invalid subcourse IDs: ${invalidIds.join(', ')}`,
          400
        )
      }
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.courseGroup.updateMany({
        where: { courseId, isDefault: true },
        data: { isDefault: false }
      })
    }

    const group = await prisma.courseGroup.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        isDefault: data.isDefault ?? false,
        maxMembers: data.maxMembers,
        allowedSubCourseIds: data.allowedSubCourseIds ?? [],
        metadata: data.metadata ?? undefined,
        courseId,
        organizationId: course.organizationId,
        createdById: user.id,
      },
      include: {
        _count: { select: { memberships: true } }
      }
    })

    return jsonSuccess(
      { 
        success: true, 
        data: {
          ...group,
          hasSubCourseRestriction: group.allowedSubCourseIds.length > 0,
        },
        message: 'Group created successfully' 
      },
      { status: 201 }
    )

  } catch (error) {
    return handleErrorResponse(error, 'Failed to create group')
  }
}
