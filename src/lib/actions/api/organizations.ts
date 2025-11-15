import { Prisma } from '@prisma/client'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import {
  InvitationStatus,
  OrganizationPlan,
  OrganizationRole,
  OrganizationStatus,
  UserRole,
} from '@/types'

import { ServiceError } from './errors'
import { SessionUser } from './types'
import { buildPagination, slugify, normalizeEmail } from './utils'

const organizationFiltersSchema = z.object({
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

const listMembersSchema = z.object({
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
  const organization = await prisma.organization.findUnique({ where: { id: organizationId } })
  if (!organization) {
    throw new ServiceError('ORGANIZATION_NOT_FOUND', 'Organization not found', 404)
  }
  return organization
}

async function ensureOrgManagementAccess(
  sessionUser: SessionUser,
  organizationId: string,
  allowedRoles: OrganizationRole[] = [OrganizationRole.OWNER, OrganizationRole.ADMIN]
) {
  if (sessionUser.role === UserRole.BUSINESS_OWNER) {
    return
  }

  const membership = await prisma.organizationMembership.findFirst({
    where: {
      organizationId,
      userId: sessionUser.id,
      invitationStatus: InvitationStatus.ACCEPTED,
    },
    select: { role: true },
  })

  if (!membership) {
    throw new ServiceError('FORBIDDEN', 'You are not a member of this organization', 403)
  }

  if (!allowedRoles.includes(membership.role)) {
    throw new ServiceError('FORBIDDEN', 'Insufficient permissions for this organization', 403)
  }
}

export async function listOrganizations(sessionUser: SessionUser, searchParams: URLSearchParams) {
  const filters = organizationFiltersSchema.parse({
    search: searchParams.get('search') ?? undefined,
    plan: searchParams.get('plan') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  })

  const where: Prisma.OrganizationWhereInput = {}

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters.plan) {
    where.plan = filters.plan
  }

  if (filters.status) {
    where.status = filters.status
  }

  if (sessionUser.role !== UserRole.BUSINESS_OWNER) {
    where.OR = [
      ...(where.OR || []),
      { ownerId: sessionUser.id },
      {
        memberships: {
          some: {
            userId: sessionUser.id,
            invitationStatus: InvitationStatus.ACCEPTED,
          },
        },
      },
    ]
  }

  const skip = (filters.page - 1) * filters.limit

  const [organizations, total] = await Promise.all([
    prisma.organization.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: filters.limit,
    }),
    prisma.organization.count({ where }),
  ])

  return {
    organizations,
    pagination: buildPagination(filters.page, filters.limit, total),
  }
}

export async function createOrganization(sessionUser: SessionUser, payload: unknown) {
  if (sessionUser.role !== UserRole.BUSINESS_OWNER) {
    throw new ServiceError('FORBIDDEN', 'Business owner privileges required to create organizations', 403)
  }

  const data = createOrganizationSchema.parse(payload)
  const baseSlug = data.slug ? slugify(data.slug) : slugify(data.name)
  let finalSlug = baseSlug
  let suffix = 1

  while (await prisma.organization.findUnique({ where: { slug: finalSlug } })) {
    finalSlug = `${baseSlug}-${suffix}`
    suffix += 1
  }

  const organization = await prisma.organization.create({
    data: {
      name: data.name,
      slug: finalSlug,
      description: data.description,
      logoUrl: data.logoUrl,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      timezone: data.timezone || 'UTC',
      locale: data.locale || 'en',
      plan: data.plan || OrganizationPlan.FREE,
      status: data.status || OrganizationStatus.ACTIVE,
      ownerId: sessionUser.id,
      metadata: data.metadata,
    },
  })

  await prisma.organizationMembership.create({
    data: {
      organizationId: organization.id,
      userId: sessionUser.id,
      role: OrganizationRole.OWNER,
      invitationStatus: InvitationStatus.ACCEPTED,
      invitedById: sessionUser.id,
      joinedAt: new Date(),
    },
  })

  return organization
}

export async function listOrganizationMembers(
  sessionUser: SessionUser,
  organizationId: string,
  searchParams: URLSearchParams
) {
  await ensureOrganizationExists(organizationId)
  await ensureOrgManagementAccess(sessionUser, organizationId)

  const filters = listMembersSchema.parse({
    role: searchParams.get('role') ?? undefined,
    invitationStatus: searchParams.get('invitationStatus') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  })

  const where: Prisma.OrganizationMembershipWhereInput = {
    organizationId,
  }

  if (filters.role) {
    where.role = filters.role
  }

  if (filters.invitationStatus) {
    where.invitationStatus = filters.invitationStatus
  }

  if (filters.search) {
    where.OR = [
      { invitationEmail: { contains: filters.search, mode: 'insensitive' } },
      {
        user: {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
          ],
        },
      },
    ]
  }

  const skip = (filters.page - 1) * filters.limit

  const [memberships, total] = await Promise.all([
    prisma.organizationMembership.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: filters.limit,
    }),
    prisma.organizationMembership.count({ where }),
  ])

  return {
    memberships,
    pagination: buildPagination(filters.page, filters.limit, total),
  }
}

export async function inviteOrganizationMember(
  sessionUser: SessionUser,
  organizationId: string,
  payload: unknown
) {
  const organization = await ensureOrganizationExists(organizationId)
  await ensureOrgManagementAccess(sessionUser, organizationId)

  const data = inviteMemberSchema.parse(payload)
  const normalizedEmail = normalizeEmail(data.email)

  const invitedUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })

  const existingMembership = await prisma.organizationMembership.findFirst({
    where: {
      organizationId,
      OR: [
        ...(invitedUser ? [{ userId: invitedUser.id }] : []),
        { invitationEmail: normalizedEmail },
      ],
    },
  })

  if (existingMembership) {
    throw new ServiceError('MEMBERSHIP_EXISTS', 'User is already invited or part of this organization', 409)
  }

  const membership = await prisma.organizationMembership.create({
    data: {
      organizationId: organization.id,
      userId: invitedUser?.id,
      role: data.role,
      invitationEmail: invitedUser ? null : normalizedEmail,
      invitationStatus: invitedUser ? InvitationStatus.ACCEPTED : InvitationStatus.PENDING,
      invitedById: sessionUser.id,
      joinedAt: invitedUser ? new Date() : null,
      metadata: data.message ? { invitationMessage: data.message } : undefined,
    },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  })

  return membership
}
