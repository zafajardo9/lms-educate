import { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { UserRole } from '@/types'

import { ServiceError } from './errors'
import { SessionUser } from './types/session'
import { buildPagination } from './utils'

const userFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.nativeEnum(UserRole),
  password: z.string().min(6),
  isActive: z.boolean().optional().default(true),
})

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
})

const profileSchema = z.object({
  bio: z.string().optional(),
  avatar: z.string().url().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
})

function assertBusinessOwner(sessionUser: SessionUser) {
  if (sessionUser.role !== UserRole.BUSINESS_OWNER) {
    throw new ServiceError('FORBIDDEN', 'Business owner access required', 403)
  }
}

function assertCanManageUser(sessionUser: SessionUser, userId: string) {
  if (sessionUser.role === UserRole.BUSINESS_OWNER) {
    return
  }

  if (sessionUser.id !== userId) {
    throw new ServiceError('FORBIDDEN', 'Access denied', 403)
  }
}

export async function listUsers(sessionUser: SessionUser, searchParams: URLSearchParams) {
  assertBusinessOwner(sessionUser)

  const filters = userFiltersSchema.parse({
    search: searchParams.get('search') ?? undefined,
    role: searchParams.get('role') ?? undefined,
    isActive: searchParams.get('isActive') ?? undefined,
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  })

  const where: Prisma.UserWhereInput = {}

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ]
  }

  if (filters.role) {
    where.role = filters.role
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive
  }

  const skip = (filters.page - 1) * filters.limit

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: filters.limit,
    }),
    prisma.user.count({ where }),
  ])

  const sanitizedUsers = users.map(({ password: _password, ...rest }) => rest)

  return {
    users: sanitizedUsers,
    pagination: buildPagination(filters.page, filters.limit, total),
  }
}

export async function createUser(sessionUser: SessionUser, payload: unknown) {
  assertBusinessOwner(sessionUser)

  const data = createUserSchema.parse(payload)

  const existingUser = await prisma.user.findUnique({ where: { email: data.email } })
  if (existingUser) {
    throw new ServiceError('USER_EXISTS', 'User with this email already exists', 409)
  }

  const hashedPassword = await bcrypt.hash(data.password, 12)

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      role: data.role,
      isActive: data.isActive,
      password: hashedPassword,
    },
    include: { profile: true },
  })

  const { password, ...userResponse } = user
  return userResponse
}

export async function getUserById(sessionUser: SessionUser, userId: string) {
  assertCanManageUser(sessionUser, userId)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      profile: true,
    },
  })

  if (!user) {
    throw new ServiceError('USER_NOT_FOUND', 'User not found', 404)
  }

  return user
}

export async function updateUser(sessionUser: SessionUser, userId: string, payload: unknown) {
  assertCanManageUser(sessionUser, userId)

  const data = updateUserSchema.parse(payload)

  if (data.role && sessionUser.role !== UserRole.BUSINESS_OWNER) {
    throw new ServiceError('FORBIDDEN', 'Only business owners can change user roles', 403)
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      profile: true,
    },
  })

  return user
}

export async function deleteUser(sessionUser: SessionUser, userId: string) {
  assertBusinessOwner(sessionUser)

  const deleted = await prisma.user.delete({
    where: { id: userId },
    select: { id: true },
  })

  if (!deleted) {
    throw new ServiceError('USER_NOT_FOUND', 'User not found', 404)
  }
}

export async function getUserProfile(sessionUser: SessionUser, userId: string) {
  assertCanManageUser(sessionUser, userId)

  return prisma.userProfile.findUnique({ where: { userId } })
}

export async function upsertUserProfile(sessionUser: SessionUser, userId: string, payload: unknown) {
  assertCanManageUser(sessionUser, userId)

  const data = profileSchema.parse(payload)

  const updateData = {
    ...data,
    ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
  }

  return prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      ...updateData,
    },
    update: updateData,
  })
}
