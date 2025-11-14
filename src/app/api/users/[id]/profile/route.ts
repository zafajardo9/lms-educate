import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { UserRole } from '@/types'
import { z } from 'zod'

// Validation schema for profile updates
const updateProfileSchema = z.object({
  bio: z.string().optional(),
  avatar: z.string().url().optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
})

// Helper function to check authorization
async function checkAuth(request: NextRequest, userId: string) {
  const session = await auth.api.getSession({ headers: request.headers })
  
  if (!session?.user) {
    return { error: NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )}
  }

  // Business owners can manage all profiles, others can only manage themselves
  const canManage = session.user.role === UserRole.BUSINESS_OWNER || session.user.id === userId

  if (!canManage) {
    return { error: NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
      { status: 403 }
    )}
  }

  return { session }
}

// GET /api/users/[id]/profile - Get user profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authResult = await checkAuth(request, id)
    if (authResult.error) return authResult.error

    const profile = await prisma.userProfile.findUnique({
      where: { userId: id }
    })

    return NextResponse.json({
      success: true,
      data: { profile }
    })

  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch profile' } },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id]/profile - Update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authResult = await checkAuth(request, id)
    if (authResult.error) return authResult.error

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

    return NextResponse.json({
      success: true,
      data: { profile },
      message: 'Profile updated successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: error.errors } },
        { status: 400 }
      )
    }

    console.error('Error updating profile:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update profile' } },
      { status: 500 }
    )
  }
}