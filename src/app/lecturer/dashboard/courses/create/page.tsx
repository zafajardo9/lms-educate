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

  if (session.user.role !== UserRole.LECTURER) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create New Course</h1>
        <p className="text-muted-foreground mt-2">
          Fill in the details below to create a new course
        </p>
      </div>

      <CourseForm mode="create" />
    </div>
  )
}
