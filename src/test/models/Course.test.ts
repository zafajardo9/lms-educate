import { describe, it, expect, beforeEach } from 'vitest'
import mongoose from 'mongoose'
import { Course, SubCourse, Lesson } from '@/lib/models/Course'
import { User } from '@/lib/models/User'
import { CourseLevel, UserRole } from '@/types'

describe('Course Models', () => {
  let testUser: any

  beforeEach(async () => {
    // Create a test lecturer user with unique email
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    testUser = await User.create({
      email: `lecturer-${uniqueId}@test.com`,
      password: 'password123',
      name: 'Test Lecturer',
      role: UserRole.LECTURER,
    })
  })

  describe('Course Model', () => {
    it('should create a valid course', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'A test course description',
        lecturerId: testUser._id,
        level: CourseLevel.BEGINNER,
        category: 'Programming',
        tags: ['javascript', 'web development'],
        price: 99.99,
        duration: 120,
      }

      const course = await Course.create(courseData)

      expect(course.title).toBe(courseData.title)
      expect(course.description).toBe(courseData.description)
      expect(course.lecturerId.toString()).toBe(testUser._id.toString())
      expect(course.level).toBe(CourseLevel.BEGINNER)
      expect(course.category).toBe(courseData.category)
      expect(course.tags).toEqual(courseData.tags)
      expect(course.price).toBe(courseData.price)
      expect(course.duration).toBe(courseData.duration)
      expect(course.isPublished).toBe(false) // default value
      expect(course.createdAt).toBeDefined()
      expect(course.updatedAt).toBeDefined()
    })

    it('should require title, description, lecturerId, and level', async () => {
      const invalidCourse = new Course({})
      
      await expect(invalidCourse.save()).rejects.toThrow()
    })

    it('should validate course level enum', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'A test course description',
        lecturerId: testUser._id,
        level: 'INVALID_LEVEL',
      }

      await expect(Course.create(courseData)).rejects.toThrow()
    })

    it('should validate price is non-negative', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'A test course description',
        lecturerId: testUser._id,
        level: CourseLevel.BEGINNER,
        price: -10,
      }

      await expect(Course.create(courseData)).rejects.toThrow()
    })

    it('should validate duration is non-negative', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'A test course description',
        lecturerId: testUser._id,
        level: CourseLevel.BEGINNER,
        duration: -5,
      }

      await expect(Course.create(courseData)).rejects.toThrow()
    })

    it('should validate thumbnail URL format', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'A test course description',
        lecturerId: testUser._id,
        level: CourseLevel.BEGINNER,
        thumbnail: 'invalid-url',
      }

      await expect(Course.create(courseData)).rejects.toThrow()
    })

    it('should accept valid thumbnail URL', async () => {
      const courseData = {
        title: 'Test Course',
        description: 'A test course description',
        lecturerId: testUser._id,
        level: CourseLevel.BEGINNER,
        thumbnail: 'https://example.com/image.jpg',
      }

      const course = await Course.create(courseData)
      expect(course.thumbnail).toBe(courseData.thumbnail)
    })

    it('should trim and validate title length', async () => {
      const longTitle = 'a'.repeat(201)
      const courseData = {
        title: longTitle,
        description: 'A test course description',
        lecturerId: testUser._id,
        level: CourseLevel.BEGINNER,
      }

      await expect(Course.create(courseData)).rejects.toThrow()
    })

    it('should validate description length', async () => {
      const longDescription = 'a'.repeat(2001)
      const courseData = {
        title: 'Test Course',
        description: longDescription,
        lecturerId: testUser._id,
        level: CourseLevel.BEGINNER,
      }

      await expect(Course.create(courseData)).rejects.toThrow()
    })
  })

  describe('SubCourse Model', () => {
    let testCourse: any

    beforeEach(async () => {
      testCourse = await Course.create({
        title: 'Parent Course',
        description: 'Parent course description',
        lecturerId: testUser._id,
        level: CourseLevel.BEGINNER,
      })
    })

    it('should create a valid subcourse', async () => {
      const subCourseData = {
        title: 'Test SubCourse',
        description: 'A test subcourse description',
        courseId: testCourse._id,
        order: 1,
      }

      const subCourse = await SubCourse.create(subCourseData)

      expect(subCourse.title).toBe(subCourseData.title)
      expect(subCourse.description).toBe(subCourseData.description)
      expect(subCourse.courseId.toString()).toBe(testCourse._id.toString())
      expect(subCourse.order).toBe(subCourseData.order)
      expect(subCourse.isPublished).toBe(false) // default value
      expect(subCourse.createdAt).toBeDefined()
      expect(subCourse.updatedAt).toBeDefined()
    })

    it('should require title, description, courseId, and order', async () => {
      const invalidSubCourse = new SubCourse({})
      
      await expect(invalidSubCourse.save()).rejects.toThrow()
    })

    it('should validate order is non-negative', async () => {
      const subCourseData = {
        title: 'Test SubCourse',
        description: 'A test subcourse description',
        courseId: testCourse._id,
        order: -1,
      }

      await expect(SubCourse.create(subCourseData)).rejects.toThrow()
    })

    it('should validate title length', async () => {
      const longTitle = 'a'.repeat(201)
      const subCourseData = {
        title: longTitle,
        description: 'A test subcourse description',
        courseId: testCourse._id,
        order: 1,
      }

      await expect(SubCourse.create(subCourseData)).rejects.toThrow()
    })

    it('should validate description length', async () => {
      const longDescription = 'a'.repeat(2001)
      const subCourseData = {
        title: 'Test SubCourse',
        description: longDescription,
        courseId: testCourse._id,
        order: 1,
      }

      await expect(SubCourse.create(subCourseData)).rejects.toThrow()
    })
  })

  describe('Lesson Model', () => {
    let testCourse: any
    let testSubCourse: any

    beforeEach(async () => {
      testCourse = await Course.create({
        title: 'Parent Course',
        description: 'Parent course description',
        lecturerId: testUser._id,
        level: CourseLevel.BEGINNER,
      })

      testSubCourse = await SubCourse.create({
        title: 'Test SubCourse',
        description: 'A test subcourse description',
        courseId: testCourse._id,
        order: 1,
      })
    })

    it('should create a valid lesson with courseId', async () => {
      const lessonData = {
        title: 'Test Lesson',
        content: 'This is the lesson content',
        courseId: testCourse._id,
        order: 1,
        duration: 30,
        videoUrl: 'https://example.com/video.mp4',
        attachments: ['https://example.com/file1.pdf', 'https://example.com/file2.pdf'],
      }

      const lesson = await Lesson.create(lessonData)

      expect(lesson.title).toBe(lessonData.title)
      expect(lesson.content).toBe(lessonData.content)
      expect(lesson.courseId?.toString()).toBe(testCourse._id.toString())
      expect(lesson.subCourseId).toBeUndefined()
      expect(lesson.order).toBe(lessonData.order)
      expect(lesson.duration).toBe(lessonData.duration)
      expect(lesson.videoUrl).toBe(lessonData.videoUrl)
      expect(lesson.attachments).toEqual(lessonData.attachments)
      expect(lesson.isPublished).toBe(false) // default value
    })

    it('should create a valid lesson with subCourseId', async () => {
      const lessonData = {
        title: 'Test Lesson',
        content: 'This is the lesson content',
        subCourseId: testSubCourse._id,
        order: 1,
      }

      const lesson = await Lesson.create(lessonData)

      expect(lesson.title).toBe(lessonData.title)
      expect(lesson.content).toBe(lessonData.content)
      expect(lesson.courseId).toBeUndefined()
      expect(lesson.subCourseId?.toString()).toBe(testSubCourse._id.toString())
      expect(lesson.order).toBe(lessonData.order)
    })

    it('should require either courseId or subCourseId, but not both', async () => {
      // Test with both courseId and subCourseId
      const lessonWithBoth = {
        title: 'Test Lesson',
        content: 'This is the lesson content',
        courseId: testCourse._id,
        subCourseId: testSubCourse._id,
        order: 1,
      }

      await expect(Lesson.create(lessonWithBoth)).rejects.toThrow()

      // Test with neither courseId nor subCourseId
      const lessonWithNeither = {
        title: 'Test Lesson',
        content: 'This is the lesson content',
        order: 1,
      }

      await expect(Lesson.create(lessonWithNeither)).rejects.toThrow()
    })

    it('should require title, content, and order', async () => {
      const invalidLesson = new Lesson({
        courseId: testCourse._id,
      })
      
      await expect(invalidLesson.save()).rejects.toThrow()
    })

    it('should validate order is non-negative', async () => {
      const lessonData = {
        title: 'Test Lesson',
        content: 'This is the lesson content',
        courseId: testCourse._id,
        order: -1,
      }

      await expect(Lesson.create(lessonData)).rejects.toThrow()
    })

    it('should validate duration is non-negative', async () => {
      const lessonData = {
        title: 'Test Lesson',
        content: 'This is the lesson content',
        courseId: testCourse._id,
        order: 1,
        duration: -5,
      }

      await expect(Lesson.create(lessonData)).rejects.toThrow()
    })

    it('should validate video URL format', async () => {
      const lessonData = {
        title: 'Test Lesson',
        content: 'This is the lesson content',
        courseId: testCourse._id,
        order: 1,
        videoUrl: 'invalid-url',
      }

      await expect(Lesson.create(lessonData)).rejects.toThrow()
    })

    it('should validate attachment URL formats', async () => {
      const lessonData = {
        title: 'Test Lesson',
        content: 'This is the lesson content',
        courseId: testCourse._id,
        order: 1,
        attachments: ['https://valid.com/file.pdf', 'invalid-url'],
      }

      await expect(Lesson.create(lessonData)).rejects.toThrow()
    })

    it('should validate title length', async () => {
      const longTitle = 'a'.repeat(201)
      const lessonData = {
        title: longTitle,
        content: 'This is the lesson content',
        courseId: testCourse._id,
        order: 1,
      }

      await expect(Lesson.create(lessonData)).rejects.toThrow()
    })
  })
})