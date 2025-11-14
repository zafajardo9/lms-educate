import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { UserRole } from '@/types'
import { z } from 'zod'

// Validation schema for updates
const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum([UserRole.BUSINESS_OWNER, UserRole.LECTURER, UserRole.STUDENT]).optional(),
  isActive: z.boolean().optional(),
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

  // Business owners can manage all users, others can only manage themselves
  const canManage = session.user.role === UserRole.BUSINESS_OWNER || session.user.id === userId

  if (!canManage) {
    return { error: NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
      { status: 403 }
    )}
  }

  return { session }
}

// Helper function to check business owner authorization
async function checkBusinessOwnerAuth(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }

  if (session.user.role !== UserRole.BUSINESS_OWNER) {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Business owner access required' } },
      { status: 403 }
    )
  }

  return null
}

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authResult = await checkAuth(request, id)
    if (authResult.error) return authResult.error

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
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { user }
    })

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user' } },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authResult = await checkAuth(request, id)
    if (authResult.error) return authResult.error

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // If trying to change role, only business owner can do it
    if (validatedData.role && authResult.session?.user.role !== UserRole.BUSINESS_OWNER) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only business owners can change user roles' } },
        { status: 403 }
      )
    }

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

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { user },
      message: 'User updated successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: error.errors } },
        { status: 400 }
      )
    }

    console.error('Error updating user:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update user' } },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete user (business owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authError = await checkBusinessOwnerAuth(request)
    if (authError) return authError

    const user = await prisma.user.delete({
      where: { id }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete user' } },
      { status: 500 }
    )
  }
}