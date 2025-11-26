import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { UserRole } from '@/types'

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum([UserRole.BUSINESS_OWNER, UserRole.LECTURER, UserRole.STUDENT]),
  password: z.string().min(6),
  isActive: z.boolean().optional().default(true),
})

// GET /api/business-owner/users - List users with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') as UserRole | null
    const isActive = searchParams.get('isActive')

    const where: Prisma.UserWhereInput = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (role) {
      where.role = role
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { profile: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)

    return jsonSuccess({
      success: true,
      data: {
        users: users.map(({ password, ...rest }) => rest),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }
      }
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch users')
  }
}

// POST /api/business-owner/users - Create new user
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email: validatedData.email } })
    if (existingUser) {
      const { ServiceError } = await import('@/lib/actions/api/errors')
      throw new ServiceError('CONFLICT', 'User with this email already exists', 409)
    }

    // Create user
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        role: validatedData.role,
        isActive: validatedData.isActive,
        password: hashedPassword,
      },
      include: { profile: true },
    })
    
    // Return user without password
    const { password, ...userResponse } = user

    return jsonSuccess(
      { success: true, data: { user: userResponse }, message: 'User created successfully' },
      { status: 201 }
    )

  } catch (error) {
    return handleErrorResponse(error, 'Failed to create user')
  }
}