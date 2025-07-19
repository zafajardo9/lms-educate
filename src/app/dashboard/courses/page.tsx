import { auth } from '@/lib/auth'
import { Course } from '@/lib/models/Course'
import connectDB from '@/lib/mongodb'
import { UserRole } from '@/types'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import CourseList from '@/components/dashboard/CourseList'

export default async function CoursesPage() {
  const session = await auth.api.getSession({
    headers: new Headers()
  })

  if (!session) {
    redirect('/auth/login')
  }

  await connectDB()

  // Build query based on user role
  let query: any = {}
  
  if (session.user.role === UserRole.LECTURER) {
    // Lecturers can only see their own courses
    query.lecturerId = session.user.id
  } else if (session.user.role === UserRole.STUDENT) {
    // Students can only see published courses
    query.isPublished = true
  }
  // Business owners can see all courses

  const courses = await Course.find(query)
    .populate('lecturer', 'name email')
    .sort({ createdAt: -1 })
    .lean()

  // Convert MongoDB documents to plain objects
  const serializedCourses = courses.map(course => ({
    ...course,
    id: course._id.toString(),
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    lecturer: course.lecturer ? {
      ...course.lecturer,
      id: course.lecturer._id.toString(),
    } : undefined,
  }))

  const canCreateCourse = [UserRole.LECTURER, UserRole.BUSINESS_OWNER].includes(session.user.role as UserRole)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-gray-600 mt-2">
            {session.user.role === UserRole.STUDENT 
              ? 'Browse and enroll in available courses'
              : 'Manage your courses and content'
            }
          </p>
        </div>
        
        {canCreateCourse && (
          <Link href="/dashboard/courses/create">
            <Button>Create Course</Button>
          </Link>
        )}
      </div>

      <CourseList 
        initialCourses={serializedCourses}
        userRole={session.user.role as UserRole}
        userId={session.user.id}
      />
    </div>
  )
}