import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Course } from '@/lib/models/Course'
import { Enrollment } from '@/lib/models/Enrollment'
import connectDB from '@/lib/mongodb'
import { UserRole } from '@/types'

// POST /api/courses/[id]/enroll - Enroll student in course
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await context.params
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

    // Only students can enroll in courses
    if (session.user.role !== UserRole.STUDENT) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only students can enroll in courses' } },
        { status: 403 }
      )
    }

    // Check if course exists and is published
    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      )
    }

    if (!course.isPublished) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Course is not available for enrollment' } },
        { status: 403 }
      )
    }

    // Check if student is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      studentId: session.user.id,
      courseId: courseId
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Already enrolled in this course' } },
        { status: 409 }
      )
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      studentId: session.user.id,
      courseId: courseId,
      enrolledAt: new Date(),
      progress: 0
    })

    // Populate related data for response
    await enrollment.populate([
      { path: 'student', select: 'name email' },
      { path: 'course', select: 'title description' }
    ])

    return NextResponse.json({
      success: true,
      data: enrollment,
      message: 'Successfully enrolled in course'
    }, { status: 201 })

  } catch (error) {
    console.error('Error enrolling in course:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to enroll in course' 
        } 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/courses/[id]/enroll - Unenroll student from course
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await context.params
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

    // Only students can unenroll from courses
    if (session.user.role !== UserRole.STUDENT) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only students can unenroll from courses' } },
        { status: 403 }
      )
    }

    // Find and delete enrollment
    const enrollment = await Enrollment.findOneAndDelete({
      studentId: session.user.id,
      courseId: courseId
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Enrollment not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unenrolled from course'
    })

  } catch (error) {
    console.error('Error unenrolling from course:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to unenroll from course' 
        } 
      },
      { status: 500 }
    )
  }
}