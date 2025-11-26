import { NextRequest } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { ServiceError } from '@/lib/actions/api/errors'
import { UserRole } from '@/types'

// Validation schema for updates
const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum([UserRole.BUSINESS_OWNER, UserRole.LECTURER, UserRole.STUDENT]).optional(),
  isActive: z.boolean().optional(),
})

// GET /api/business-owner/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        profile: true
      }
    })

    if (!user) {
      throw new ServiceError('NOT_FOUND', 'User not found', 404)
    }

    return jsonSuccess({ success: true, data: { user } })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch user')
  }
}

// PUT /api/business-owner/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id } = await params

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        profile: true
      }
    })

    return jsonSuccess({
      success: true,
      data: { user },
      message: 'User updated successfully'
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to update user')
  }
}

// DELETE /api/business-owner/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id } = await params

    await prisma.user.delete({ where: { id } })

    return jsonSuccess({ success: true, message: 'User deleted successfully' })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to delete user')
  }
}