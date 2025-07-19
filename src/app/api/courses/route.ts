import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Course } from '@/lib/models/Course'
import { User } from '@/lib/models/User'
import connectDB from '@/lib/mongodb'
import { CourseFilters, CreateCourseData, UserRole } from '@/types'
import { z } from 'zod'

// Validation schemas
const createCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).default([]),
  price: z.number().min(0).optional(),
  thumbnail: z.string().url().optional(),
})

const courseFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  lecturerId: z.string().optional(),
  isPublished: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
})

// GET /api/courses - List courses with filtering
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const filters = courseFiltersSchema.parse({
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      level: searchParams.get('level') || undefined,
      lecturerId: searchParams.get('lecturerId') || undefined,
      isPublished: searchParams.get('isPublished') === 'true' ? true : 
                   searchParams.get('isPublished') === 'false' ? false : undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    })

    // Build query based on user role and filters
    let query: any = {}
    
    // Role-based filtering
    if (session.user.role === UserRole.LECTURER) {
      // Lecturers can only see their own courses
      query.lecturerId = session.user.id
    } else if (session.user.role === UserRole.STUDENT) {
      // Students can only see published courses
      query.isPublished = true
    }
    // Business owners can see all courses

    // Apply additional filters
    if (filters.search) {
      query.$text = { $search: filters.search }
    }
    
    if (filters.category) {
      query.category = filters.category
    }
    
    if (filters.level) {
      query.level = filters.level
    }
    
    if (filters.lecturerId && session.user.role === UserRole.BUSINESS_OWNER) {
      query.lecturerId = filters.lecturerId
    }
    
    if (filters.isPublished !== undefined) {
      query.isPublished = filters.isPublished
    }
    
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags }
    }

    // Calculate pagination
    const skip = (filters.page - 1) * filters.limit
    
    // Execute query with pagination
    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('lecturer', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit)
        .lean(),
      Course.countDocuments(query)
    ])

    const totalPages = Math.ceil(total / filters.limit)

    return NextResponse.json({
      success: true,
      data: courses,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages,
        hasNext: filters.page < totalPages,
        hasPrev: filters.page > 1,
      }
    })

  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch courses' 
        } 
      },
      { status: 500 }
    )
  }
}

// POST /api/courses - Create new course
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    // Only lecturers and business owners can create courses
    if (![UserRole.LECTURER, UserRole.BUSINESS_OWNER].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const courseData = createCourseSchema.parse(body)

    // Create course with the authenticated user as lecturer
    const course = await Course.create({
      ...courseData,
      lecturerId: session.user.id,
      isPublished: false, // New courses start as drafts
    })

    // Populate lecturer info for response
    await course.populate('lecturer', 'name email')

    return NextResponse.json({
      success: true,
      data: course,
      message: 'Course created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating course:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid course data',
            details: error.errors
          } 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to create course' 
        } 
      },
      { status: 500 }
    )
  }
}