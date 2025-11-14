import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Types } from 'mongoose'

import connectDB from '@/lib/mongodb'
import { requireAuth } from '@/lib/middleware/auth'
import { Organization, OrganizationMembership } from '@/lib/models/Organization'
import { User } from '@/lib/models/User'
import {
  InvitationStatus,
  OrganizationRole,
  UserRole,
} from '@/types'

const listMembersQuerySchema = z.object({
  role: z.nativeEnum(OrganizationRole).optional(),
  invitationStatus: z.nativeEnum(InvitationStatus).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(OrganizationRole).default(OrganizationRole.LEARNER),
  message: z.string().max(1000).optional(),
})

async function ensureOrganizationExists(organizationId: string) {
  const organization = await Organization.findById(organizationId).lean()
  if (!organization) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ORGANIZATION_NOT_FOUND',
          message: 'Organization not found',
        },
      },
      { status: 404 }
    )
  }
  return null
}

async function ensureOrgManagementAccess(
  user: { id: string; role: UserRole },
  organizationId: string,
  allowedRoles: OrganizationRole[] = [OrganizationRole.OWNER, OrganizationRole.ADMIN]
) {
  if (user.role === UserRole.BUSINESS_OWNER) {
    return null
  }

  const membership = await OrganizationMembership.findOne({
    organizationId,
    userId: user.id,
    invitationStatus: InvitationStatus.ACCEPTED,
  }).lean<{ role: OrganizationRole }>()

  if (!membership) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not a member of this organization',
        },
      },
      { status: 403 }
    )
  }

  if (!allowedRoles.includes(membership.role as OrganizationRole)) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions for this organization',
        },
      },
      { status: 403 }
    )
  }

  return null
}

// GET /api/organizations/[organizationId]/members - List members
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ organizationId: string }> }
) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  const { organizationId } = await context.params

  try {
    await connectDB()

    const orgError = await ensureOrganizationExists(organizationId)
    if (orgError) return orgError

    const accessError = await ensureOrgManagementAccess(
      { id: user.id, role: user.role as UserRole },
      organizationId,
    )
    if (accessError) return accessError

    const { searchParams } = new URL(request.url)
    const filters = listMembersQuerySchema.parse({
      role: searchParams.get('role') ?? undefined,
      invitationStatus: searchParams.get('invitationStatus') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    })

    const membershipQuery: Record<string, any> = {
      organizationId,
    }

    if (filters.role) {
      membershipQuery.role = filters.role
    }

    if (filters.invitationStatus) {
      membershipQuery.invitationStatus = filters.invitationStatus
    }

    if (filters.search) {
      const matchedUsers = await User.find({
        $or: [
          { name: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } },
        ],
      })
        .select('_id')
        .lean<{ _id: Types.ObjectId }>()

      const userIds = (matchedUsers ?? []).map((matchedUser: { _id: Types.ObjectId }) => matchedUser._id.toString())

      membershipQuery.$or = [
        ...(userIds.length > 0 ? [{ userId: { $in: userIds } }] : []),
        { invitationEmail: { $regex: filters.search, $options: 'i' } },
      ]
    }

    const skip = (filters.page - 1) * filters.limit

    const [memberships, total] = await Promise.all([
      OrganizationMembership.find(membershipQuery)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit)
        .lean(),
      OrganizationMembership.countDocuments(membershipQuery),
    ])

    const totalPages = Math.max(1, Math.ceil(total / filters.limit))

    return NextResponse.json({
      success: true,
      data: memberships,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages,
        hasNext: filters.page < totalPages,
        hasPrev: filters.page > 1,
      },
    })
  } catch (error) {
    console.error('Error listing organization members:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch organization members',
        },
      },
      { status: 500 }
    )
  }
}

// POST /api/organizations/[organizationId]/members - Invite member
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ organizationId: string }> }
) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  const { organizationId } = await context.params

  try {
    await connectDB()

    const orgError = await ensureOrganizationExists(organizationId)
    if (orgError) return orgError

    const accessError = await ensureOrgManagementAccess(user, organizationId)
    if (accessError) return accessError

    const body = await request.json()
    const payload = inviteMemberSchema.parse(body)
    const normalizedEmail = payload.email.toLowerCase()

    const invitedUser = await User.findOne({ email: normalizedEmail })
      .lean<{ _id: Types.ObjectId }>()

    const existingMembership = await OrganizationMembership.findOne({
      organizationId,
      $or: [
        ...(invitedUser ? [{ userId: invitedUser._id.toString() }] : []),
        { invitationEmail: normalizedEmail },
      ],
    })

    if (existingMembership) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MEMBERSHIP_EXISTS',
            message: 'User is already invited or part of this organization',
          },
        },
        { status: 409 }
      )
    }

    const membership = await OrganizationMembership.create({
      organizationId,
      userId: invitedUser ? invitedUser._id.toString() : undefined,
      role: payload.role,
      invitationEmail: normalizedEmail,
      invitationStatus: invitedUser ? InvitationStatus.ACCEPTED : InvitationStatus.PENDING,
      invitedById: user.id,
      joinedAt: invitedUser ? new Date() : undefined,
      metadata: payload.message ? { invitationMessage: payload.message } : undefined,
    })

    await membership.populate('user', 'name email role')

    return NextResponse.json(
      {
        success: true,
        data: { membership },
        message: invitedUser ? 'Member added successfully' : 'Invitation sent successfully',
      },
      { status: invitedUser ? 201 : 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid member data',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    console.error('Error inviting organization member:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to invite member',
        },
      },
      { status: 500 }
    )
  }
}
