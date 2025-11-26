import { NextRequest } from 'next/server'
import { z } from 'zod'

import prisma from '@/lib/prisma'
import { handleErrorResponse, jsonSuccess } from '@/lib/actions/api/response'
import { requireRole } from '@/lib/actions/api/session'
import { UserRole } from '@/types'

// Validation schema for profile updates
const updateProfileSchema = z.object({
  bio: z.string().optional(),
  avatar: z.string().url().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
})

// GET /api/business-owner/users/[id]/profile - Get user profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id } = await params

    const profile = await prisma.userProfile.findUnique({
      where: { userId: id }
    })

    return jsonSuccess({ success: true, data: { profile } })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to fetch profile')
  }
}

// PUT /api/business-owner/users/[id]/profile - Update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(request, UserRole.BUSINESS_OWNER)
    const { id } = await params

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Convert dateOfBirth string to Date if provided
    const updateData = {
      ...validatedData,
      ...(validatedData.dateOfBirth && { dateOfBirth: new Date(validatedData.dateOfBirth) })
    }

    // Update or create profile
    const profile = await prisma.userProfile.upsert({
      where: { userId: id },
      create: {
        userId: id,
        ...updateData
      },
      update: updateData
    })

    return jsonSuccess({
      success: true,
      data: { profile },
      message: 'Profile updated successfully'
    })

  } catch (error) {
    return handleErrorResponse(error, 'Failed to update profile')
  }
}