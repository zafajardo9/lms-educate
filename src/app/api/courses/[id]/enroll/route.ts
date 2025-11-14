import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { UserRole } from '@/types'

// POST /api/courses/[id]/enroll - Enroll student in course
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await context.params

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
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })
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
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: session.user.id,
          courseId: courseId
        }
      }
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Already enrolled in this course' } },
        { status: 409 }
      )
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: session.user.id,
        courseId: courseId,
        organizationId: course.organizationId,
        enrolledAt: new Date(),
        progress: 0
      },
      include: {
        student: {
          select: { id: true, name: true, email: true }
        },
        course: {
          select: { id: true, title: true, description: true }
        }
      }
    })

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
    const enrollment = await prisma.enrollment.deleteMany({
      where: {
        studentId: session.user.id,
        courseId: courseId
      }
    })

    if (!enrollment.count) {
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