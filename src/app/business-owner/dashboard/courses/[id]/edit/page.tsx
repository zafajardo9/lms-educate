import { auth } from '@/lib/auth'
import { UserRole } from '@/types'
import { redirect, notFound } from 'next/navigation'
import CourseForm from '@/components/dashboard/CourseForm'
import prisma from '@/lib/prisma'

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

  if (session.user.role !== UserRole.BUSINESS_OWNER) {
    redirect('/dashboard')
  }

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      lecturer: {
        select: { id: true, name: true, email: true },
      },
    },
  })

  if (!course) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Course</h1>
        <p className="text-gray-600 mt-2">
          Update the course details below
        </p>
      </div>

      <CourseForm mode="edit" course={course} />
    </div>
  )
}
