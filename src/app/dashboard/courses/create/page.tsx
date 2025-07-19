import { auth } from '@/lib/auth'
import { UserRole } from '@/types'
import { redirect } from 'next/navigation'
import CourseForm from '@/components/dashboard/CourseForm'

export default async function CreateCoursePage() {
  const session = await auth.api.getSession({
    headers: new Headers()
  })

  if (!session) {
    redirect('/auth/login')
  }

  // Only lecturers and business owners can create courses
  if (![UserRole.LECTURER, UserRole.BUSINESS_OWNER].includes(session.user.role as UserRole)) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Course</h1>
        <p className="text-gray-600 mt-2">
          Fill in the details below to create a new course
        </p>
      </div>

      <CourseForm mode="create" />
    </div>
  )
}