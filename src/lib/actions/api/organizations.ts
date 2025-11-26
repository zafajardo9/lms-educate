import { Prisma, OrganizationMemberRole } from '@prisma/client'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { UserRole } from '@/types'

import { ServiceError } from './errors'
import { SessionUser } from './types'
import { buildPagination, slugify, normalizeEmail } from './utils'

const organizationFiltersSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

const createOrganizationSchema = z.object({
  name: z.string().min(3).max(200),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  description: z.string().max(2000).optional(),
})

const updateOrganizationSchema = createOrganizationSchema.partial()

const listMembersSchema = z.object({
  role: z.nativeEnum(OrganizationMemberRole).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(OrganizationMemberRole).default(OrganizationMemberRole.LECTURER),
})

async function ensureOrganizationExists(organizationId: string) {
  const organization = await prisma.organization.findUnique({ where: { id: organizationId } })
  if (!organization) {
    throw new ServiceError('ORGANIZATION_NOT_FOUND', 'Organization not found', 404)
  }
  return organization
}

export async function getOrganizationById(sessionUser: SessionUser, organizationId: string) {
  return ensureOrganizationOwner(sessionUser, organizationId)
}

export async function updateOrganization(
  sessionUser: SessionUser,
  organizationId: string,
  payload: unknown
) {
  const existing = await ensureOrganizationOwner(sessionUser, organizationId)
  const data = updateOrganizationSchema.parse(payload)

  const updateData: Prisma.OrganizationUpdateInput = {}

  if (data.name !== undefined) {
    updateData.name = data.name
  }

  if (data.description !== undefined) {
    updateData.description = data.description
  }

  if (data.slug) {
    const baseSlug = slugify(data.slug)
    let finalSlug = baseSlug
    let suffix = 1

    if (baseSlug !== existing.slug) {
      while (await prisma.organization.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${baseSlug}-${suffix}`
        suffix += 1
      }
      updateData.slug = finalSlug
    }
  }

  if (Object.keys(updateData).length === 0) {
    return existing
  }

  return prisma.organization.update({ where: { id: organizationId }, data: updateData })
}

export async function deleteOrganization(sessionUser: SessionUser, organizationId: string) {
  await ensureOrganizationOwner(sessionUser, organizationId)
  await prisma.organization.delete({ where: { id: organizationId } })
  return { success: true }
}

async function ensureOrganizationOwner(sessionUser: SessionUser, organizationId: string) {
  const organization = await ensureOrganizationExists(organizationId)

  if (organization.ownerId !== sessionUser.id) {
    throw new ServiceError('FORBIDDEN', 'You do not own this organization', 403)
  }

  return organization
}

async function ensureOrgManagementAccess(
  sessionUser: SessionUser,
  organizationId: string,
  allowedRoles: OrganizationMemberRole[] = [OrganizationMemberRole.OWNER, OrganizationMemberRole.ADMIN]
) {
  if (sessionUser.role === UserRole.BUSINESS_OWNER) {
    return
  }

  const membership = await prisma.organizationMembership.findFirst({
    where: {
      organizationId,
      userId: sessionUser.id,
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

  if (sessionUser.role !== UserRole.BUSINESS_OWNER) {
    where.OR = [
      ...(where.OR || []),
      { ownerId: sessionUser.id },
      {
        memberships: {
          some: {
            userId: sessionUser.id,
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
      ownerId: sessionUser.id,
    },
  })

  await prisma.organizationMembership.create({
    data: {
      organizationId: organization.id,
      userId: sessionUser.id,
      role: OrganizationMemberRole.OWNER,
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

  if (filters.search) {
    where.user = {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ],
    }
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

export async function addOrganizationMember(
  sessionUser: SessionUser,
  organizationId: string,
  payload: unknown
) {
  await ensureOrgManagementAccess(sessionUser, organizationId, [OrganizationMemberRole.OWNER, OrganizationMemberRole.ADMIN])

  const data = addMemberSchema.parse(payload)
  const normalizedEmail = normalizeEmail(data.email)

  const invitedUser = await prisma.user.findUnique({ where: { email: normalizedEmail } })

  if (!invitedUser) {
    throw new ServiceError('USER_NOT_FOUND', 'No user found with the provided email', 404)
  }

  const existingMembership = await prisma.organizationMembership.findFirst({
    where: {
      organizationId,
      userId: invitedUser.id,
    },
  })

  if (existingMembership) {
    throw new ServiceError('MEMBERSHIP_EXISTS', 'User is already part of this organization', 409)
  }

  const membership = await prisma.organizationMembership.create({
    data: {
      organizationId,
      userId: invitedUser.id,
      role: data.role,
    },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  })

  return membership
}
