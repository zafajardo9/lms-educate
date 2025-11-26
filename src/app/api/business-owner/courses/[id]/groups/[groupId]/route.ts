import { NextRequest } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { ServiceError } from '@/lib/actions/api/errors'
import { UserRole } from '@/types'

// Validation schema
const updateGroupSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  type: z.enum(['STUDY', 'DISCUSSION', 'PROJECT', 'CUSTOM']).optional(),
  isDefault: z.boolean().optional(),
  maxMembers: z.number().int().min(1).optional().nullable(),
  allowedSubCourseIds: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional().nullable(),
})

// GET /api/business-owner/courses/[id]/groups/[groupId] - Get group details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, groupId } = await params

    const group = await prisma.courseGroup.findFirst({
      where: { id: groupId, courseId },
      include: {
        course: {
          select: { id: true, title: true }
        },
        createdBy: {
          select: { id: true, name: true }
        },
        memberships: {
          include: {
            student: {
              select: { id: true, name: true, email: true }
            },
            enrollment: {
              select: { id: true, progress: true, enrolledAt: true }
            }
          },
          orderBy: [
            { isLeader: 'desc' },
            { joinedAt: 'asc' }
          ]
        },
        _count: {
          select: { memberships: true }
        }
      }
    })

    if (!group) {
      throw new ServiceError('NOT_FOUND', 'Group not found', 404)
    }

    // Get allowed subcourse details
    let allowedSubCourses: any[] = []
    if (group.allowedSubCourseIds.length > 0) {
      allowedSubCourses = await prisma.subCourse.findMany({
        where: { id: { in: group.allowedSubCourseIds } },
        select: { id: true, title: true, order: true }
      })
    }

    return jsonSuccess({
      success: true,
      data: {
        ...group,
        memberCount: group._count.memberships,
        spotsRemaining: group.maxMembers ? group.maxMembers - group._count.memberships : null,
        allowedSubCourses,
        hasSubCourseRestriction: group.allowedSubCourseIds.length > 0,
      }
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch group')
  }
}

// PUT /api/business-owner/courses/[id]/groups/[groupId] - Update group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, groupId } = await params

    const body = await request.json()
    const data = updateGroupSchema.parse(body)

    // Verify group exists
    const existing = await prisma.courseGroup.findFirst({
      where: { id: groupId, courseId }
    })

    if (!existing) {
      throw new ServiceError('NOT_FOUND', 'Group not found', 404)
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
        where: { courseId, isDefault: true, id: { not: groupId } },
        data: { isDefault: false }
      })
    }

    const updated = await prisma.courseGroup.update({
      where: { id: groupId },
      data: {
        ...data,
        metadata: data.metadata ?? undefined,
      },
      include: {
        _count: { select: { memberships: true } }
      }
    })

    return jsonSuccess({
      success: true,
      data: {
        ...updated,
        hasSubCourseRestriction: updated.allowedSubCourseIds.length > 0,
      },
      message: 'Group updated successfully'
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to update group')
  }
}

// PATCH /api/business-owner/courses/[id]/groups/[groupId] - Update subcourse access
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, groupId } = await params

    const body = await request.json()
    const patchSchema = z.object({
      allowedSubCourseIds: z.array(z.string()),
    })
    const { allowedSubCourseIds } = patchSchema.parse(body)

    const existing = await prisma.courseGroup.findFirst({
      where: { id: groupId, courseId }
    })

    if (!existing) {
      throw new ServiceError('NOT_FOUND', 'Group not found', 404)
    }

    // Validate subcourse IDs
    if (allowedSubCourseIds.length > 0) {
      const validSubCourses = await prisma.subCourse.findMany({
        where: {
          id: { in: allowedSubCourseIds },
          courseId
        },
        select: { id: true, title: true }
      })

      const validIds = new Set(validSubCourses.map(s => s.id))
      const invalidIds = allowedSubCourseIds.filter(id => !validIds.has(id))

      if (invalidIds.length > 0) {
        throw new ServiceError(
          'VALIDATION_ERROR',
          `Invalid subcourse IDs: ${invalidIds.join(', ')}`,
          400
        )
      }
    }

    const updated = await prisma.courseGroup.update({
      where: { id: groupId },
      data: { allowedSubCourseIds },
      select: {
        id: true,
        name: true,
        allowedSubCourseIds: true,
      }
    })

    // Get subcourse names
    const subCourses = allowedSubCourseIds.length > 0
      ? await prisma.subCourse.findMany({
          where: { id: { in: allowedSubCourseIds } },
          select: { id: true, title: true }
        })
      : []

    return jsonSuccess({
      success: true,
      data: {
        ...updated,
        allowedSubCourses: subCourses,
        hasSubCourseRestriction: allowedSubCourseIds.length > 0,
      },
      message: allowedSubCourseIds.length > 0
        ? `Group restricted to ${allowedSubCourseIds.length} subcourse(s)`
        : 'Group now has access to all subcourses'
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to update group subcourse access')
  }
}

// DELETE /api/business-owner/courses/[id]/groups/[groupId] - Archive or delete group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, groupId } = await params

    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hard') === 'true'
    const restore = searchParams.get('restore') === 'true'

    const existing = await prisma.courseGroup.findFirst({
      where: { id: groupId, courseId },
      include: {
        _count: { select: { memberships: true } }
      }
    })

    if (!existing) {
      throw new ServiceError('NOT_FOUND', 'Group not found', 404)
    }

    // Restore archived group
    if (restore) {
      if (!existing.isArchived) {
        throw new ServiceError('CONFLICT', 'Group is not archived', 409)
      }

      const restored = await prisma.courseGroup.update({
        where: { id: groupId },
        data: { isArchived: false },
        select: { id: true, name: true, isArchived: true }
      })

      return jsonSuccess({
        success: true,
        data: restored,
        message: `Group "${existing.name}" restored successfully`
      })
    }

    // If group has members, prefer archiving over deletion
    if (existing._count.memberships > 0) {
      if (hardDelete) {
        // Hard delete - removes group and memberships (students stay enrolled in course)
        await prisma.courseGroup.delete({
          where: { id: groupId }
        })

        return jsonSuccess({
          success: true,
          message: `Group "${existing.name}" permanently deleted. ${existing._count.memberships} member(s) remain enrolled in the course.`
        })
      }

      // Default: Archive instead of delete
      const archived = await prisma.courseGroup.update({
        where: { id: groupId },
        data: { isArchived: true },
        select: { id: true, name: true, isArchived: true }
      })

      return jsonSuccess({
        success: true,
        data: archived,
        message: `Group "${existing.name}" archived (${existing._count.memberships} members preserved). Use ?hard=true to permanently delete or ?restore=true to restore.`
      })
    }

    // No members - safe to delete
    await prisma.courseGroup.delete({
      where: { id: groupId }
    })

    return jsonSuccess({
      success: true,
      message: `Group "${existing.name}" deleted successfully`
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to delete group')
  }
}
