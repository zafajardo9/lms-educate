import { NextRequest } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { ServiceError } from '@/lib/actions/api/errors'
import { UserRole } from '@/types'

// Validation schemas
const addMemberSchema = z.object({
  enrollmentId: z.string().min(1, 'Enrollment ID is required'),
  isLeader: z.boolean().optional(),
})

const bulkAddSchema = z.object({
  enrollmentIds: z.array(z.string()).min(1, 'At least one enrollment ID required'),
})

// GET /api/business-owner/courses/[id]/groups/[groupId]/members - List group members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, groupId } = await params

    // Verify group exists
    const group = await prisma.courseGroup.findFirst({
      where: { id: groupId, courseId },
      select: { id: true, name: true, type: true, maxMembers: true, allowedSubCourseIds: true }
    })

    if (!group) {
      throw new ServiceError('NOT_FOUND', 'Group not found', 404)
    }

    const memberships = await prisma.courseGroupMembership.findMany({
      where: { groupId },
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
    })

    // Get allowed subcourses if restricted
    let allowedSubCourses: any[] = []
    if (group.allowedSubCourseIds.length > 0) {
      allowedSubCourses = await prisma.subCourse.findMany({
        where: { id: { in: group.allowedSubCourseIds } },
        select: { id: true, title: true }
      })
    }

    return jsonSuccess({
      success: true,
      data: {
        groupId,
        groupName: group.name,
        groupType: group.type,
        maxMembers: group.maxMembers,
        memberCount: memberships.length,
        spotsRemaining: group.maxMembers ? group.maxMembers - memberships.length : null,
        allowedSubCourses,
        members: memberships.map(m => ({
          membershipId: m.id,
          student: m.student,
          enrollment: m.enrollment,
          isLeader: m.isLeader,
          joinedAt: m.joinedAt,
        }))
      }
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch group members')
  }
}

// POST /api/business-owner/courses/[id]/groups/[groupId]/members - Add member(s) to group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id: courseId, groupId } = await params

    const body = await request.json()
    const isBulk = Array.isArray(body.enrollmentIds)

    // Verify group exists and has capacity
    const group = await prisma.courseGroup.findFirst({
      where: { id: groupId, courseId, isArchived: false },
      include: { _count: { select: { memberships: true } } }
    })

    if (!group) {
      throw new ServiceError('NOT_FOUND', 'Group not found or is archived', 404)
    }

    if (isBulk) {
      const { enrollmentIds } = bulkAddSchema.parse(body)

      // Check capacity
      if (group.maxMembers && group._count.memberships + enrollmentIds.length > group.maxMembers) {
        throw new ServiceError(
          'CONFLICT',
          `Group only has ${group.maxMembers - group._count.memberships} spots remaining`,
          409
        )
      }

      // Verify enrollments exist and belong to this course
      const enrollments = await prisma.enrollment.findMany({
        where: { id: { in: enrollmentIds }, courseId },
        select: { id: true, studentId: true }
      })

      const validIds = new Set(enrollments.map(e => e.id))
      const invalidIds = enrollmentIds.filter(id => !validIds.has(id))

      if (invalidIds.length > 0) {
        throw new ServiceError('VALIDATION_ERROR', `Invalid enrollment IDs: ${invalidIds.join(', ')}`, 400)
      }

      // Check for existing memberships
      const existingMemberships = await prisma.courseGroupMembership.findMany({
        where: { groupId, enrollmentId: { in: enrollmentIds } },
        select: { enrollmentId: true }
      })
      const alreadyMembers = new Set(existingMemberships.map(m => m.enrollmentId))
      const toAdd = enrollments.filter(e => !alreadyMembers.has(e.id))

      if (toAdd.length === 0) {
        throw new ServiceError('CONFLICT', 'All students are already in this group', 409)
      }

      // Create memberships
      await prisma.courseGroupMembership.createMany({
        data: toAdd.map(e => ({
          groupId,
          enrollmentId: e.id,
          studentId: e.studentId,
        }))
      })

      return jsonSuccess({
        success: true,
        data: { added: toAdd.length, skipped: alreadyMembers.size },
        message: `${toAdd.length} member(s) added to ${group.name}`
      })

    } else {
      const { enrollmentId, isLeader } = addMemberSchema.parse(body)

      // Check capacity
      if (group.maxMembers && group._count.memberships >= group.maxMembers) {
        throw new ServiceError('CONFLICT', 'Group is full', 409)
      }

      // Verify enrollment exists
      const enrollment = await prisma.enrollment.findFirst({
        where: { id: enrollmentId, courseId },
        include: { student: { select: { id: true, name: true } } }
      })

      if (!enrollment) {
        throw new ServiceError('NOT_FOUND', 'Enrollment not found', 404)
      }

      // Check if already a member
      const existingMembership = await prisma.courseGroupMembership.findUnique({
        where: { groupId_studentId: { groupId, studentId: enrollment.studentId } }
      })

      if (existingMembership) {
        throw new ServiceError('CONFLICT', 'Student is already in this group', 409)
      }

      const membership = await prisma.courseGroupMembership.create({
        data: {
          groupId,
          enrollmentId,
          studentId: enrollment.studentId,
          isLeader: isLeader ?? false,
        },
        include: {
          student: { select: { id: true, name: true } }
        }
      })

      return jsonSuccess(
        {
          success: true,
          data: membership,
          message: `${enrollment.student.name} added to ${group.name}${isLeader ? ' as leader' : ''}`
        },
        { status: 201 }
      )
    }

  } catch (error) {
    return handleErrorResponse(error, 'Failed to add member to group')
  }
}

// PATCH /api/business-owner/courses/[id]/groups/[groupId]/members - Update member (set leader)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { groupId } = await params

    const body = await request.json()
    const patchSchema = z.object({
      membershipId: z.string(),
      isLeader: z.boolean(),
    })
    const { membershipId, isLeader } = patchSchema.parse(body)

    const membership = await prisma.courseGroupMembership.findFirst({
      where: { id: membershipId, groupId },
      include: { student: { select: { name: true } } }
    })

    if (!membership) {
      throw new ServiceError('NOT_FOUND', 'Membership not found', 404)
    }

    const updated = await prisma.courseGroupMembership.update({
      where: { id: membershipId },
      data: { isLeader }
    })

    return jsonSuccess({
      success: true,
      data: updated,
      message: isLeader
        ? `${membership.student.name} is now group leader`
        : `${membership.student.name} is no longer group leader`
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to update member')
  }
}

// DELETE /api/business-owner/courses/[id]/groups/[groupId]/members - Remove member from group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { groupId } = await params

    const { searchParams } = new URL(request.url)
    const membershipId = searchParams.get('membershipId')

    if (!membershipId) {
      throw new ServiceError('VALIDATION_ERROR', 'membershipId query parameter is required', 400)
    }

    const membership = await prisma.courseGroupMembership.findFirst({
      where: { id: membershipId, groupId },
      include: { student: { select: { name: true } } }
    })

    if (!membership) {
      throw new ServiceError('NOT_FOUND', 'Membership not found', 404)
    }

    await prisma.courseGroupMembership.delete({
      where: { id: membershipId }
    })

    return jsonSuccess({
      success: true,
      message: `${membership.student.name} removed from group (still enrolled in course)`
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to remove member from group')
  }
}
