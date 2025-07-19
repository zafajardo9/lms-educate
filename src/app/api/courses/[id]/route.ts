import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Course } from '@/lib/models/Course'
import { Enrollment } from '@/lib/models/Enrollment'
import connectDB from '@/lib/mongodb'
import { UserRole } from '@/types'
import { z } from 'zod'

// Validation schema for course updates
const updateCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long').optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).optional(),
  price: z.number().min(0).optional(),
  thumbnail: z.string().url().optional(),
  isPublished: z.boolean().optional(),
})

// GET /api/courses/[id] - Get course by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const course = await Course.findById(params.id)
      .populate('lecturer', 'name email')
      .populate('subCourses')
      .populate('lessons')
      .lean()

    if (!course) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      )
    }

    // Check access permissions
    const canAccess = 
      session.user.role === UserRole.BUSINESS_OWNER || // Business owners can see all
      course.lecturerId === session.user.id || // Lecturers can see their own
      (session.user.role === UserRole.STUDENT && course.isPublished) // Students can see published

    if (!canAccess) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    // For students, also check if they're enrolled
    let enrollment = null
    if (session.user.role === UserRole.STUDENT) {
      enrollment = await Enrollment.findOne({
        studentId: session.user.id,
        courseId: params.id
      }).lean()
    }

    return NextResponse.json({
      success: true,
      data: {
        ...course,
        enrollment
      }
    })

  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch course' 
        } 
      },
      { status: 500 }
    )
  }
}

// PUT /api/courses/[id] - Update course
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const course = await Course.findById(params.id)
    if (!course) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      )
    }

    // Check permissions - only course owner or business owner can update
    const canUpdate = 
      session.user.role === UserRole.BUSINESS_OWNER ||
      course.lecturerId === session.user.id

    if (!canUpdate) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updateData = updateCourseSchema.parse(body)

    // Update course
    const updatedCourse = await Course.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('lecturer', 'name email')

    return NextResponse.json({
      success: true,
      data: updatedCourse,
      message: 'Course updated successfully'
    })

  } catch (error) {
    console.error('Error updating course:', error)
    
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
          message: 'Failed to update course' 
        } 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/courses/[id] - Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const course = await Course.findById(params.id)
    if (!course) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      )
    }

    // Check permissions - only course owner or business owner can delete
    const canDelete = 
      session.user.role === UserRole.BUSINESS_OWNER ||
      course.lecturerId === session.user.id

    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    // Check if course has enrollments
    const enrollmentCount = await Enrollment.countDocuments({ courseId: params.id })
    if (enrollmentCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'CONFLICT', 
            message: 'Cannot delete course with active enrollments' 
          } 
        },
        { status: 409 }
      )
    }

    // Delete the course
    await Course.findByIdAndDelete(params.id)

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to delete course' 
        } 
      },
      { status: 500 }
    )
  }
}