import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/courses/route'
import { GET as getCourse, PUT, DELETE } from '@/app/api/courses/[id]/route'
import { POST as enrollCourse, DELETE as unenrollCourse } from '@/app/api/courses/[id]/enroll/route'
import { Course } from '@/lib/models/Course'
import { Enrollment } from '@/lib/models/Enrollment'
import { User } from '@/lib/models/User'
import { UserRole, CourseLevel } from '@/types'
import connectDB from '@/lib/mongodb'

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn()
    }
  }
}))

// Mock database connection
vi.mock('@/lib/mongodb', () => ({
  default: vi.fn()
}))

// Mock models
vi.mock('@/lib/models/Course')
vi.mock('@/lib/models/Enrollment')
vi.mock('@/lib/models/User')

const mockAuth = vi.mocked(await import('@/lib/auth')).auth
const mockConnectDB = vi.mocked(connectDB)
const mockCourse = vi.mocked(Course)
const mockEnrollment = vi.mocked(Enrollment)

describe('Course API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConnectDB.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GET /api/courses', () => {
    it('should return courses for authenticated user', async () => {
      const mockSession = {
        user: { id: 'user1', role: UserRole.LECTURER }
      }
      
      mockAuth.api.getSession.mockResolvedValue(mockSession)
      
      const mockCourses = [
        {
          _id: 'course1',
          title: 'Test Course',
          description: 'Test Description',
          lecturerId: 'user1',
          level: CourseLevel.BEGINNER,
          isPublished: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ]

      mockCourse.find.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            skip: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue(mockCourses)
              })
            })
          })
        })
      })

      mockCourse.countDocuments.mockResolvedValue(1)

      const request = new NextRequest('http://localhost/api/courses')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.pagination).toBeDefined()
    })

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.api.getSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/courses')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('UNAUTHORIZED')
    })

    it('should filter courses for students (published only)', async () => {
      const mockSession = {
        user: { id: 'student1', role: UserRole.STUDENT }
      }
      
      mockAuth.api.getSession.mockResolvedValue(mockSession)
      
      mockCourse.find.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            skip: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                lean: vi.fn().mockResolvedValue([])
              })
            })
          })
        })
      })

      mockCourse.countDocuments.mockResolvedValue(0)

      const request = new NextRequest('http://localhost/api/courses')
      await GET(request)

      expect(mockCourse.find).toHaveBeenCalledWith({ isPublished: true })
    })
  })

  describe('POST /api/courses', () => {
    it('should create course for lecturer', async () => {
      const mockSession = {
        user: { id: 'lecturer1', role: UserRole.LECTURER }
      }
      
      mockAuth.api.getSession.mockResolvedValue(mockSession)

      const mockCourseData = {
        _id: 'course1',
        title: 'New Course',
        description: 'Course Description',
        level: CourseLevel.BEGINNER,
        lecturerId: 'lecturer1',
        isPublished: false,
        populate: vi.fn().mockResolvedValue({
          _id: 'course1',
          title: 'New Course',
          lecturer: { name: 'John Doe', email: 'john@example.com' }
        })
      }

      mockCourse.create.mockResolvedValue(mockCourseData)

      const courseData = {
        title: 'New Course',
        description: 'Course Description',
        level: CourseLevel.BEGINNER,
        tags: []
      }

      const request = new NextRequest('http://localhost/api/courses', {
        method: 'POST',
        body: JSON.stringify(courseData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Course created successfully')
    })

    it('should return 403 for students', async () => {
      const mockSession = {
        user: { id: 'student1', role: UserRole.STUDENT }
      }
      
      mockAuth.api.getSession.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost/api/courses', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })

    it('should validate course data', async () => {
      const mockSession = {
        user: { id: 'lecturer1', role: UserRole.LECTURER }
      }
      
      mockAuth.api.getSession.mockResolvedValue(mockSession)

      const invalidData = {
        title: '', // Invalid: empty title
        description: 'Valid description',
        level: 'INVALID_LEVEL' // Invalid level
      }

      const request = new NextRequest('http://localhost/api/courses', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /api/courses/[id]', () => {
    it('should return course for authorized user', async () => {
      const mockSession = {
        user: { id: 'lecturer1', role: UserRole.LECTURER }
      }
      
      mockAuth.api.getSession.mockResolvedValue(mockSession)

      const mockCourseData = {
        _id: 'course1',
        title: 'Test Course',
        lecturerId: 'lecturer1',
        isPublished: true
      }

      mockCourse.findById.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue(mockCourseData)
            })
          })
        })
      })

      const request = new NextRequest('http://localhost/api/courses/course1')
      const response = await getCourse(request, { params: { id: 'course1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
    })

    it('should return 404 for non-existent course', async () => {
      const mockSession = {
        user: { id: 'lecturer1', role: UserRole.LECTURER }
      }
      
      mockAuth.api.getSession.mockResolvedValue(mockSession)

      mockCourse.findById.mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue(null)
            })
          })
        })
      })

      const request = new NextRequest('http://localhost/api/courses/nonexistent')
      const response = await getCourse(request, { params: { id: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
    })
  })

  describe('PUT /api/courses/[id]', () => {
    it('should update course for owner', async () => {
      const mockSession = {
        user: { id: 'lecturer1', role: UserRole.LECTURER }
      }
      
      mockAuth.api.getSession.mockResolvedValue(mockSession)

      const mockCourseData = {
        _id: 'course1',
        lecturerId: 'lecturer1'
      }

      mockCourse.findById.mockResolvedValue(mockCourseData)
      mockCourse.findByIdAndUpdate.mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          _id: 'course1',
          title: 'Updated Course'
        })
      })

      const updateData = {
        title: 'Updated Course',
        description: 'Updated Description',
        level: CourseLevel.INTERMEDIATE
      }

      const request = new NextRequest('http://localhost/api/courses/course1', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: { id: 'course1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Course updated successfully')
    })

    it('should return 403 for unauthorized user', async () => {
      const mockSession = {
        user: { id: 'other-user', role: UserRole.LECTURER }
      }
      
      mockAuth.api.getSession.mockResolvedValue(mockSession)

      const mockCourseData = {
        _id: 'course1',
        lecturerId: 'lecturer1' // Different lecturer
      }

      mockCourse.findById.mockResolvedValue(mockCourseData)

      const request = new NextRequest('http://localhost/api/courses/course1', {
        method: 'PUT',
        body: JSON.stringify({})
      })

      const response = await PUT(request, { params: { id: 'course1' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })
  })

  describe('DELETE /api/courses/[id]', () => {
    it('should delete course without enrollments', async () => {
      const mockSession = {
        user: { id: 'lecturer1', role: UserRole.LECTURER }
      }
      
      mockAuth.api.getSession.mockResolvedValue(mockSession)

      const mockCourseData = {
        _id: 'course1',
        lecturerId: 'lecturer1'
      }

      mockCourse.findById.mockResolvedValue(mockCourseData)
      mockEnrollment.countDocuments.mockResolvedValue(0)
      mockCourse.findByIdAndDelete.mockResolvedValue(mockCourseData)

      const request = new NextRequest('http://localhost/api/courses/course1')
      const response = await DELETE(request, { params: { id: 'course1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Course deleted successfully')
    })

    it('should not delete course with enrollments', async () => {
      const mockSession = {
        user: { id: 'lecturer1', role: UserRole.LECTURER }
      }
      
      mockAuth.api.getSession.mockResolvedValue(mockSession)

      const mockCourseData = {
        _id: 'course1',
        lecturerId: 'lecturer1'
      }

      mockCourse.findById.mockResolvedValue(mockCourseData)
      mockEnrollment.countDocuments.mockResolvedValue(5) // Has enrollments

      const request = new NextRequest('http://localhost/api/courses/course1')
      const response = await DELETE(request, { params: { id: 'course1' } })
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('CONFLICT')
    })
  })

  describe('POST /api/courses/[id]/enroll', () => {
    it('should enroll student in published course', async () => {
      const mockSession = {
        user: { id: 'student1', role: UserRole.STUDENT }
      }
      
      mockAuth.api.getSession.mockResolvedValue(mockSession)

      const mockCourseData = {
        _id: 'course1',
        isPublished: true
      }

      mockCourse.findById.mockResolvedValue(mockCourseData)
      mockEnrollment.findOne.mockResolvedValue(null) // Not enrolled yet

      const mockEnrollmentData = {
        _id: 'enrollment1',
        studentId: 'student1',
        courseId: 'course1',
        populate: vi.fn().mockResolvedValue({
          _id: 'enrollment1',
          student: { name: 'John Student' },
          course: { title: 'Test Course' }
        })
      }

      mockEnrollment.create.mockResolvedValue(mockEnrollmentData)

      const request = new NextRequest('http://localhost/api/courses/course1/enroll', {
        method: 'POST'
      })

      const response = await enrollCourse(request, { params: { id: 'course1' } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Successfully enrolled in course')
    })

    it('should not enroll in unpublished course', async () => {
      const mockSession = {
        user: { id: 'student1', role: UserRole.STUDENT }
      }
      
      mockAuth.api.getSession.mockResolvedValue(mockSession)

      const mockCourseData = {
        _id: 'course1',
        isPublished: false // Not published
      }

      mockCourse.findById.mockResolvedValue(mockCourseData)

      const request = new NextRequest('http://localhost/api/courses/course1/enroll', {
        method: 'POST'
      })

      const response = await enrollCourse(request, { params: { id: 'course1' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })

    it('should not allow duplicate enrollment', async () => {
      const mockSession = {
        user: { id: 'student1', role: UserRole.STUDENT }
      }
      
      mockAuth.api.getSession.mockResolvedValue(mockSession)

      const mockCourseData = {
        _id: 'course1',
        isPublished: true
      }

      mockCourse.findById.mockResolvedValue(mockCourseData)
      mockEnrollment.findOne.mockResolvedValue({ _id: 'existing-enrollment' }) // Already enrolled

      const request = new NextRequest('http://localhost/api/courses/course1/enroll', {
        method: 'POST'
      })

      const response = await enrollCourse(request, { params: { id: 'course1' } })
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('CONFLICT')
    })

    it('should not allow non-students to enroll', async () => {
      const mockSession = {
        user: { id: 'lecturer1', role: UserRole.LECTURER }
      }
      
      mockAuth.api.getSession.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost/api/courses/course1/enroll', {
        method: 'POST'
      })

      const response = await enrollCourse(request, { params: { id: 'course1' } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('FORBIDDEN')
    })
  })

  describe('DELETE /api/courses/[id]/enroll', () => {
    it('should unenroll student from course', async () => {
      const mockSession = {
        user: { id: 'student1', role: UserRole.STUDENT }
      }
      
      mockAuth.api.getSession.mockResolvedValue(mockSession)

      const mockEnrollmentData = {
        _id: 'enrollment1',
        studentId: 'student1',
        courseId: 'course1'
      }

      mockEnrollment.findOneAndDelete.mockResolvedValue(mockEnrollmentData)

      const request = new NextRequest('http://localhost/api/courses/course1/enroll')
      const response = await unenrollCourse(request, { params: { id: 'course1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Successfully unenrolled from course')
    })

    it('should return 404 if not enrolled', async () => {
      const mockSession = {
        user: { id: 'student1', role: UserRole.STUDENT }
      }
      
      mockAuth.api.getSession.mockResolvedValue(mockSession)

      mockEnrollment.findOneAndDelete.mockResolvedValue(null) // Not enrolled

      const request = new NextRequest('http://localhost/api/courses/course1/enroll')
      const response = await unenrollCourse(request, { params: { id: 'course1' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.code).toBe('NOT_FOUND')
    })
  })
})