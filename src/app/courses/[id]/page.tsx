import { auth } from '@/lib/auth'
import { Course } from '@/lib/models/Course'
import { Enrollment } from '@/lib/models/Enrollment'
import connectDB from '@/lib/mongodb'
import { UserRole } from '@/types'
import { redirect, notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { enrollInCourse } from '@/lib/actions/courses'
import EnrollButton from '@/components/courses/EnrollButton'

interface CourseDetailPageProps {
  params: {
    id: string
  }
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const session = await auth.api.getSession({
    headers: new Headers()
  })

  if (!session) {
    redirect('/auth/login')
  }

  await connectDB()

  const course = await Course.findById(params.id)
    .populate('lecturer', 'name email')
    .populate('subCourses')
    .populate('lessons')
    .lean()

  if (!course) {
    notFound()
  }

  // Check access permissions
  const canAccess = 
    session.user.role === UserRole.BUSINESS_OWNER || // Business owners can see all
    course.lecturerId === session.user.id || // Lecturers can see their own
    (session.user.role === UserRole.STUDENT && course.isPublished) // Students can see published

  if (!canAccess) {
    redirect('/dashboard')
  }

  // Check enrollment status for students
  let enrollment = null
  if (session.user.role === UserRole.STUDENT) {
    enrollment = await Enrollment.findOne({
      studentId: session.user.id,
      courseId: params.id
    }).lean()
  }

  // Convert MongoDB documents to plain objects
  const serializedCourse = {
    ...course,
    id: course._id.toString(),
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    lecturer: course.lecturer ? {
      ...course.lecturer,
      id: course.lecturer._id.toString(),
    } : undefined,
    subCourses: course.subCourses?.map((sc: any) => ({
      ...sc,
      id: sc._id.toString(),
      createdAt: sc.createdAt.toISOString(),
      updatedAt: sc.updatedAt.toISOString(),
    })) || [],
    lessons: course.lessons?.map((lesson: any) => ({
      ...lesson,
      id: lesson._id.toString(),
      createdAt: lesson.createdAt.toISOString(),
      updatedAt: lesson.updatedAt.toISOString(),
    })) || [],
  }

  const serializedEnrollment = enrollment ? {
    ...enrollment,
    id: enrollment._id.toString(),
    enrolledAt: enrollment.enrolledAt.toISOString(),
    completedAt: enrollment.completedAt?.toISOString(),
    lastAccessedAt: enrollment.lastAccessedAt?.toISOString(),
  } : null

  const isEnrolled = !!enrollment
  const canEnroll = session.user.role === UserRole.STUDENT && course.isPublished && !isEnrolled

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Course Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{course.title}</h1>
              <p className="text-xl text-gray-600 mb-4">{course.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant={course.isPublished ? "default" : "secondary"}>
                  {course.isPublished ? 'Published' : 'Draft'}
                </Badge>
                <Badge variant="outline">{course.level}</Badge>
                {course.category && (
                  <Badge variant="outline">{course.category}</Badge>
                )}
              </div>
            </div>
            
            {course.thumbnail && (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-48 h-32 object-cover rounded-lg ml-6"
              />
            )}
          </div>

          {/* Course Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">Instructor</div>
                <div className="font-medium">{course.lecturer?.name}</div>
              </CardContent>
            </Card>
            
            {course.price && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500">Price</div>
                  <div className="font-medium">${course.price}</div>
                </CardContent>
              </Card>
            )}
            
            {course.duration && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-gray-500">Duration</div>
                  <div className="font-medium">{course.duration} minutes</div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Enrollment Status & Actions */}
          {session.user.role === UserRole.STUDENT && (
            <Card className="mb-6">
              <CardContent className="p-4">
                {isEnrolled ? (
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-green-600">Enrolled</div>
                      <div className="text-sm text-gray-500">
                        Progress: {serializedEnrollment?.progress || 0}%
                      </div>
                      {serializedEnrollment?.completedAt && (
                        <div className="text-sm text-gray-500">
                          Completed on {new Date(serializedEnrollment.completedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <Button>Continue Learning</Button>
                  </div>
                ) : canEnroll ? (
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">Ready to start learning?</div>
                      <div className="text-sm text-gray-500">
                        Enroll now to access all course materials
                      </div>
                    </div>
                    <EnrollButton courseId={course._id.toString()} />
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="font-medium text-gray-500">
                      {!course.isPublished 
                        ? 'This course is not yet available for enrollment'
                        : 'Course enrollment not available'
                      }
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Course Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tags */}
            {course.tags && course.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Course Structure */}
            {(course.subCourses?.length > 0 || course.lessons?.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Course Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Direct Lessons */}
                    {course.lessons?.filter((lesson: any) => !lesson.subCourseId).map((lesson: any) => (
                      <div key={lesson._id} className="border-l-2 border-blue-200 pl-4">
                        <div className="font-medium">{lesson.title}</div>
                        {lesson.duration && (
                          <div className="text-sm text-gray-500">{lesson.duration} minutes</div>
                        )}
                      </div>
                    ))}

                    {/* Sub-courses with their lessons */}
                    {course.subCourses?.map((subCourse: any) => (
                      <div key={subCourse._id} className="border rounded-lg p-4">
                        <div className="font-medium text-lg mb-2">{subCourse.title}</div>
                        <div className="text-gray-600 mb-3">{subCourse.description}</div>
                        
                        {/* Sub-course lessons */}
                        <div className="space-y-2 ml-4">
                          {course.lessons?.filter((lesson: any) => lesson.subCourseId === subCourse._id.toString()).map((lesson: any) => (
                            <div key={lesson._id} className="border-l-2 border-green-200 pl-4">
                              <div className="font-medium">{lesson.title}</div>
                              {lesson.duration && (
                                <div className="text-sm text-gray-500">{lesson.duration} minutes</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Level</div>
                  <div className="font-medium">{course.level}</div>
                </div>
                
                {course.category && (
                  <div>
                    <div className="text-sm text-gray-500">Category</div>
                    <div className="font-medium">{course.category}</div>
                  </div>
                )}
                
                <div>
                  <div className="text-sm text-gray-500">Created</div>
                  <div className="font-medium">
                    {new Date(course.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Last Updated</div>
                  <div className="font-medium">
                    {new Date(course.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}