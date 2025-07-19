'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Course } from '@/lib/models/Course'
import { Enrollment } from '@/lib/models/Enrollment'
import connectDB from '@/lib/mongodb'
import { CreateCourseData, UserRole, CourseLevel } from '@/types'
import { z } from 'zod'

// Validation schemas
const createCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  level: z.nativeEnum(CourseLevel),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).default([]),
  price: z.number().min(0).optional(),
  thumbnail: z.string().url().optional(),
})

const updateCourseSchema = createCourseSchema.extend({
  isPublished: z.boolean().optional(),
})

export async function createCourse(formData: FormData) {
  try {
    await connectDB()
    
    const session = await auth.api.getSession({
      headers: new Headers()
    })

    if (!session) {
      throw new Error('Authentication required')
    }

    // Only lecturers and business owners can create courses
    if (![UserRole.LECTURER, UserRole.BUSINESS_OWNER].includes(session.user.role as UserRole)) {
      throw new Error('Insufficient permissions')
    }

    // Parse form data
    const rawData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      level: formData.get('level') as CourseLevel,
      category: formData.get('category') as string || undefined,
      tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(tag => tag.trim()) : [],
      price: formData.get('price') ? parseFloat(formData.get('price') as string) : undefined,
      thumbnail: formData.get('thumbnail') as string || undefined,
    }

    const courseData = createCourseSchema.parse(rawData)

    // Create course
    const course = await Course.create({
      ...courseData,
      lecturerId: session.user.id,
      isPublished: false,
    })

    revalidatePath('/dashboard/courses')
    return { success: true, data: course }

  } catch (error) {
    console.error('Error creating course:', error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Validation failed',
        details: error.errors 
      }
    }

    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create course' 
    }
  }
}

export async function updateCourse(courseId: string, formData: FormData) {
  try {
    await connectDB()
    
    const session = await auth.api.getSession({
      headers: new Headers()
    })

    if (!session) {
      throw new Error('Authentication required')
    }

    const course = await Course.findById(courseId)
    if (!course) {
      throw new Error('Course not found')
    }

    // Check permissions
    const canUpdate = 
      session.user.role === UserRole.BUSINESS_OWNER ||
      course.lecturerId === session.user.id

    if (!canUpdate) {
      throw new Error('Insufficient permissions')
    }

    // Parse form data
    const rawData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      level: formData.get('level') as CourseLevel,
      category: formData.get('category') as string || undefined,
      tags: formData.get('tags') ? (formData.get('tags') as string).split(',').map(tag => tag.trim()) : [],
      price: formData.get('price') ? parseFloat(formData.get('price') as string) : undefined,
      thumbnail: formData.get('thumbnail') as string || undefined,
      isPublished: formData.get('isPublished') === 'true',
    }

    const updateData = updateCourseSchema.parse(rawData)

    // Update course
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      updateData,
      { new: true, runValidators: true }
    )

    revalidatePath('/dashboard/courses')
    revalidatePath(`/dashboard/courses/${courseId}`)
    
    return { success: true, data: updatedCourse }

  } catch (error) {
    console.error('Error updating course:', error)
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Validation failed',
        details: error.errors 
      }
    }

    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update course' 
    }
  }
}

export async function deleteCourse(courseId: string) {
  try {
    await connectDB()
    
    const session = await auth.api.getSession({
      headers: new Headers()
    })

    if (!session) {
      throw new Error('Authentication required')
    }

    const course = await Course.findById(courseId)
    if (!course) {
      throw new Error('Course not found')
    }

    // Check permissions
    const canDelete = 
      session.user.role === UserRole.BUSINESS_OWNER ||
      course.lecturerId === session.user.id

    if (!canDelete) {
      throw new Error('Insufficient permissions')
    }

    // Check if course has enrollments
    const enrollmentCount = await Enrollment.countDocuments({ courseId })
    if (enrollmentCount > 0) {
      throw new Error('Cannot delete course with active enrollments')
    }

    // Delete course
    await Course.findByIdAndDelete(courseId)

    revalidatePath('/dashboard/courses')
    return { success: true }

  } catch (error) {
    console.error('Error deleting course:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete course' 
    }
  }
}

export async function enrollInCourse(courseId: string) {
  try {
    await connectDB()
    
    const session = await auth.api.getSession({
      headers: new Headers()
    })

    if (!session) {
      throw new Error('Authentication required')
    }

    // Only students can enroll
    if (session.user.role !== UserRole.STUDENT) {
      throw new Error('Only students can enroll in courses')
    }

    // Check if course exists and is published
    const course = await Course.findById(courseId)
    if (!course) {
      throw new Error('Course not found')
    }

    if (!course.isPublished) {
      throw new Error('Course is not available for enrollment')
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      studentId: session.user.id,
      courseId
    })

    if (existingEnrollment) {
      throw new Error('Already enrolled in this course')
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      studentId: session.user.id,
      courseId,
      enrolledAt: new Date(),
      progress: 0
    })

    revalidatePath('/dashboard')
    revalidatePath('/courses')
    revalidatePath(`/courses/${courseId}`)
    
    return { success: true, data: enrollment }

  } catch (error) {
    console.error('Error enrolling in course:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to enroll in course' 
    }
  }
}