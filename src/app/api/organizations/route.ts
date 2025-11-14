import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import connectDB from '@/lib/mongodb'
import { requireAuth } from '@/lib/middleware/auth'
import { Organization, OrganizationMembership } from '@/lib/models/Organization'
import {
  InvitationStatus,
  OrganizationPlan,
  OrganizationRole,
  OrganizationStatus,
  UserRole,
} from '@/types'

const organizationsQuerySchema = z.object({
  search: z.string().optional(),
  plan: z.nativeEnum(OrganizationPlan).optional(),
  status: z.nativeEnum(OrganizationStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

const createOrganizationSchema = z.object({
  name: z.string().min(3).max(200),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).optional(),
  secondaryColor: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  plan: z.nativeEnum(OrganizationPlan).optional(),
  status: z.nativeEnum(OrganizationStatus).optional(),
  metadata: z.record(z.any()).optional(),
})

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export async function GET(request: NextRequest) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const filters = organizationsQuerySchema.parse({
      search: searchParams.get('search') ?? undefined,
      plan: searchParams.get('plan') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    })

    const query: any = {}

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ]
    }

    if (filters.plan) {
      query.plan = filters.plan
    }

    if (filters.status) {
      query.status = filters.status
    }

    if (user.role !== UserRole.BUSINESS_OWNER) {
      const memberships = await OrganizationMembership.find({
        userId: user.id,
        invitationStatus: InvitationStatus.ACCEPTED,
      })
        .select('organizationId')
        .lean()

      const membershipOrganizationIds = memberships
        .map((membership: { organizationId?: string }) => membership.organizationId)
        .filter((organizationId): organizationId is string => Boolean(organizationId))

      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { ownerId: user.id },
            { _id: { $in: membershipOrganizationIds } },
          ],
        },
      ]
    }

    const skip = (filters.page - 1) * filters.limit

    const [organizations, total] = await Promise.all([
      Organization.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit)
        .lean(),
      Organization.countDocuments(query),
    ])

    const totalPages = Math.ceil(total / filters.limit) || 1

    return NextResponse.json({
      success: true,
      data: organizations,
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
    console.error('Error fetching organizations:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch organizations',
        },
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user

  if (user.role !== UserRole.BUSINESS_OWNER) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Business owner privileges required to create organizations',
        },
      },
      { status: 403 }
    )
  }

  try {
    await connectDB()

    const body = await request.json()
    const payload = createOrganizationSchema.parse(body)

    const baseSlug = payload.slug ? slugify(payload.slug) : slugify(payload.name)
    let finalSlug = baseSlug
    let suffix = 1

    // Ensure slug uniqueness
    while (await Organization.exists({ slug: finalSlug })) {
      finalSlug = `${baseSlug}-${suffix}`
      suffix += 1
    }

    const organization = await Organization.create({
      name: payload.name,
      slug: finalSlug,
      description: payload.description,
      logoUrl: payload.logoUrl,
      primaryColor: payload.primaryColor,
      secondaryColor: payload.secondaryColor,
      timezone: payload.timezone || 'UTC',
      locale: payload.locale || 'en',
      plan: payload.plan || OrganizationPlan.FREE,
      status: payload.status || OrganizationStatus.ACTIVE,
      ownerId: user.id,
      metadata: payload.metadata,
    })

    await OrganizationMembership.create({
      organizationId: organization._id.toString(),
      userId: user.id,
      role: OrganizationRole.OWNER,
      invitationStatus: InvitationStatus.ACCEPTED,
      invitedById: user.id,
      joinedAt: new Date(),
    })

    return NextResponse.json(
      {
        success: true,
        data: { organization: organization.toObject() },
        message: 'Organization created successfully',
      },
      { status: 201 }
    )
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid organization data',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_SLUG',
            message: 'An organization with this slug already exists',
          },
        },
        { status: 409 }
      )
    }

    console.error('Error creating organization:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create organization',
        },
      },
      { status: 500 }
    )
  }
}
