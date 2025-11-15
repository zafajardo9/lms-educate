import { auth } from '@/lib/auth'
import { UserRole } from '@/types'
import { redirect } from 'next/navigation'
import CourseList from '@/components/dashboard/CourseList'
import prisma from '@/lib/prisma'

export default async function CoursesPage() {
  const session = await auth.api.getSession({
    headers: new Headers()
  })

  if (!session) {
    redirect('/auth/login')
  }

  if (session.user.role !== UserRole.STUDENT) {
    redirect('/dashboard')
  }

  // Get user's organization
  const userOrg = await prisma.organizationMembership.findFirst({
    where: { userId: session.user.id },
    select: { organizationId: true },
  })

  if (!userOrg) {
    return <div>No organization found</div>
  }

  // Students can only see published courses
  const courses = await prisma.course.findMany({
    where: {
      organizationId: userOrg.organizationId,
      isPublished: true,
    },
    include: {
      lecturer: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold">Browse Courses</h1>
          <p className="text-gray-600 mt-2">
            Explore and enroll in available courses
          </p>
        </div>
      </div>

      <CourseList 
        initialCourses={courses}
        userRole={session.user.role as UserRole}
        userId={session.user.id}
      />
    </div>
  )
}
