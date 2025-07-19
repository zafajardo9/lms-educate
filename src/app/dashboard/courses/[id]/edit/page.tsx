import { auth } from '@/lib/auth'
import { Course } from '@/lib/models/Course'
import connectDB from '@/lib/mongodb'
import { UserRole } from '@/types'
import { redirect, notFound } from 'next/navigation'
import CourseForm from '@/components/dashboard/CourseForm'

interface EditCoursePageProps {
  params: {
    id: string
  }
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const session = await auth.api.getSession({
    headers: new Headers()
  })

  if (!session) {
    redirect('/auth/login')
  }

  await connectDB()

  const course = await Course.findById(params.id)
    .populate('lecturer', 'name email')
    .lean()

  if (!course) {
    notFound()
  }

  // Check permissions - only course owner or business owner can edit
  const canEdit = 
    session.user.role === UserRole.BUSINESS_OWNER ||
    course.lecturerId === session.user.id

  if (!canEdit) {
    redirect('/dashboard/courses')
  }

  // Convert MongoDB document to plain object
  const serializedCourse = {
    ...course,
    id: course._id.toString(),
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    lecturer: course.lecturer ? {
      ...course.lecturer,
      id: course.lecturer._id.toString(),
    } : undefined,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Course</h1>
        <p className="text-gray-600 mt-2">
          Update the course details below
        </p>
      </div>

      <CourseForm mode="edit" course={serializedCourse} />
    </div>
  )
}