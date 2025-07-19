'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Course, CourseFilters, UserRole, CourseLevel } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { deleteCourse, enrollInCourse } from '@/lib/actions/courses'
import toast from 'react-hot-toast'

interface CourseListProps {
  initialCourses: Course[]
  userRole: UserRole
  userId: string
}

export default function CourseList({ initialCourses, userRole, userId }: CourseListProps) {
  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<CourseFilters>({
    search: '',
    category: '',
    level: undefined,
    isPublished: undefined,
  })

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      if (filters.search) params.append('search', filters.search)
      if (filters.category) params.append('category', filters.category)
      if (filters.level) params.append('level', filters.level)
      if (filters.isPublished !== undefined) params.append('isPublished', filters.isPublished.toString())

      const response = await fetch(`/api/courses?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setCourses(data.data)
      } else {
        toast.error('Failed to fetch courses')
      }
    } catch (error) {
      toast.error('Error fetching courses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchCourses()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [filters])

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return

    const result = await deleteCourse(courseId)
    if (result.success) {
      toast.success('Course deleted successfully')
      setCourses(courses.filter(course => course.id !== courseId))
    } else {
      toast.error(result.error || 'Failed to delete course')
    }
  }

  const handleEnroll = async (courseId: string) => {
    const result = await enrollInCourse(courseId)
    if (result.success) {
      toast.success('Successfully enrolled in course!')
      fetchCourses() // Refresh to update enrollment status
    } else {
      toast.error(result.error || 'Failed to enroll in course')
    }
  }

  const canManageCourse = (course: Course) => {
    return userRole === UserRole.BUSINESS_OWNER || course.lecturerId === userId
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search courses..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Input
                placeholder="Filter by category"
                value={filters.category || ''}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Level</label>
              <select
                value={filters.level || ''}
                onChange={(e) => setFilters({ ...filters, level: e.target.value as CourseLevel || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Levels</option>
                <option value={CourseLevel.BEGINNER}>Beginner</option>
                <option value={CourseLevel.INTERMEDIATE}>Intermediate</option>
                <option value={CourseLevel.ADVANCED}>Advanced</option>
              </select>
            </div>
            
            {userRole !== UserRole.STUDENT && (
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <select
                  value={filters.isPublished === undefined ? '' : filters.isPublished.toString()}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    isPublished: e.target.value === '' ? undefined : e.target.value === 'true' 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Courses</option>
                  <option value="true">Published</option>
                  <option value="false">Draft</option>
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Course List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-600">No courses found</p>
          </div>
        ) : (
          courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                  <div className="flex gap-1">
                    <Badge variant={course.isPublished ? "default" : "secondary"}>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                    <Badge variant="outline">{course.level}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {course.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  {course.category && (
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Category:</span> {course.category}
                    </p>
                  )}
                  
                  {course.price && (
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Price:</span> ${course.price}
                    </p>
                  )}
                  
                  {course.lecturer && (
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Instructor:</span> {course.lecturer.name}
                    </p>
                  )}
                  
                  {course.tags && course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {course.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {userRole === UserRole.STUDENT && course.isPublished && (
                    <Button
                      onClick={() => handleEnroll(course.id)}
                      className="flex-1"
                      size="sm"
                    >
                      Enroll
                    </Button>
                  )}
                  
                  {canManageCourse(course) && (
                    <>
                      <Link href={`/dashboard/courses/${course.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(course.id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                  
                  <Link href={`/courses/${course.id}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}