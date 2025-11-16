import { auth } from '@/lib/auth'
import { UserRole } from '@/types'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import CourseList from '@/components/dashboard/CourseList'
import prisma from '@/lib/prisma'

export default async function CoursesPage() {
  const session = await auth.api.getSession({
    headers: new Headers()
  })

  if (!session) {
    redirect('/auth/login')
  }

  if (session.user.role !== UserRole.BUSINESS_OWNER) {
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

  // Business owners can see all courses in their organization
  const courses = await prisma.course.findMany({
    where: {
      organizationId: userOrg.organizationId,
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">All Courses</h1>
          <p className="text-muted-foreground mt-2">
            Manage all courses across your organization
          </p>
        </div>
        
        <Link href="/business-owner/dashboard/courses/create">
          <Button>Create Course</Button>
        </Link>
      </div>

      <CourseList 
        initialCourses={courses}
        userRole={session.user.role as UserRole}
        userId={session.user.id}
      />
    </div>
  )
}
