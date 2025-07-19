import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { User } from '@/lib/models/User'
import connectDB from '@/lib/mongodb'
import { UserRole, UserFilters } from '@/types'
import { z } from 'zod'

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum([UserRole.BUSINESS_OWNER, UserRole.LECTURER, UserRole.STUDENT]),
  password: z.string().min(6),
  isActive: z.boolean().optional().default(true),
})

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum([UserRole.BUSINESS_OWNER, UserRole.LECTURER, UserRole.STUDENT]).optional(),
  isActive: z.boolean().optional(),
})

// Helper function to check authorization
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

// GET /api/users - List users with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const authError = await checkBusinessOwnerAuth(request)
    if (authError) return authError

    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') as UserRole | null
    const isActive = searchParams.get('isActive')

    // Build filter object
    const filter: any = {}
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (role) {
      filter.role = role
    }
    
    if (isActive !== null) {
      filter.isActive = isActive === 'true'
    }

    // Calculate pagination
    const skip = (page - 1) * limit
    const total = await User.countDocuments(filter)
    const totalPages = Math.ceil(total / limit)

    // Fetch users
    const users = await User.find(filter)
      .populate('profile')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    return NextResponse.json({
      success: true,
      data: {
        users,
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
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch users' } },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const authError = await checkBusinessOwnerAuth(request)
    if (authError) return authError

    await connectDB()

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email })
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_EXISTS', message: 'User with this email already exists' } },
        { status: 409 }
      )
    }

    // Create user
    const user = await User.create(validatedData)
    
    // Return user without password
    const userResponse = user.toJSON()

    return NextResponse.json({
      success: true,
      data: { user: userResponse },
      message: 'User created successfully'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: error.errors } },
        { status: 400 }
      )
    }

    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create user' } },
      { status: 500 }
    )
  }
}