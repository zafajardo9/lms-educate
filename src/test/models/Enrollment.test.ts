import { describe, it, expect, beforeEach } from 'vitest'
import mongoose from 'mongoose'
import { Enrollment, LessonProgress } from '@/lib/models/Enrollment'
import { Course, Lesson, SubCourse } from '@/lib/models/Course'
import { User } from '@/lib/models/User'
import { UserRole, CourseLevel } from '@/types'

describe('Enrollment Models', () => {
  let testLecturer: any
  let testStudent: any
  let testCourse: any
  let testLesson: any

  beforeEach(async () => {
    // Create test users with unique emails
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    testLecturer = await User.create({
      email: `lecturer-${uniqueId}@test.com`,
      password: 'password123',
      name: 'Test Lecturer',
      role: UserRole.LECTURER,
    })

    testStudent = await User.create({
      email: `student-${uniqueId}@test.com`,
      password: 'password123',
      name: 'Test Student',
      role: UserRole.STUDENT,
    })

    // Create test course
    testCourse = await Course.create({
      title: 'Test Course',
      description: 'A test course description',
      lecturerId: testLecturer._id,
      level: CourseLevel.BEGINNER,
    })

    // Create test lesson
    testLesson = await Lesson.create({
      title: 'Test Lesson',
      content: 'Test lesson content',
      courseId: testCourse._id,
      order: 1,
    })
  })

  describe('Enrollment Model', () => {
    it('should create a valid enrollment', async () => {
      const enrollmentData = {
        studentId: testStudent._id,
        courseId: testCourse._id,
        progress: 25,
      }

      const enrollment = await Enrollment.create(enrollmentData)

      expect(enrollment.studentId.toString()).toBe(testStudent._id.toString())
      expect(enrollment.courseId.toString()).toBe(testCourse._id.toString())
      expect(enrollment.progress).toBe(25)
      expect(enrollment.enrolledAt).toBeDefined()
      expect(enrollment.lastAccessedAt).toBeDefined()
      expect(enrollment.completedAt).toBeUndefined()
      expect(enrollment.createdAt).toBeDefined()
      expect(enrollment.updatedAt).toBeDefined()
    })

    it('should set default values correctly', async () => {
      const enrollmentData = {
        studentId: testStudent._id,
        courseId: testCourse._id,
      }

      const enrollment = await Enrollment.create(enrollmentData)

      expect(enrollment.progress).toBe(0) // default value
      expect(enrollment.enrolledAt).toBeDefined()
      expect(enrollment.lastAccessedAt).toBeDefined()
    })

    it('should require studentId and courseId', async () => {
      const invalidEnrollment = new Enrollment({})
      
      await expect(invalidEnrollment.save()).rejects.toThrow()
    })

    it('should validate progress range', async () => {
      const enrollmentWithNegativeProgress = {
        studentId: testStudent._id,
        courseId: testCourse._id,
        progress: -1, // Invalid: less than 0
      }

      await expect(Enrollment.create(enrollmentWithNegativeProgress)).rejects.toThrow()

      const enrollmentWithExcessiveProgress = {
        studentId: testStudent._id,
        courseId: testCourse._id,
        progress: 101, // Invalid: greater than 100
      }

      await expect(Enrollment.create(enrollmentWithExcessiveProgress)).rejects.toThrow()
    })

    it('should prevent duplicate enrollments', async () => {
      const enrollmentData = {
        studentId: testStudent._id,
        courseId: testCourse._id,
      }

      // Create first enrollment
      await Enrollment.create(enrollmentData)

      // Try to create duplicate enrollment
      await expect(Enrollment.create(enrollmentData)).rejects.toThrow()
    })

    it('should set completedAt when progress reaches 100%', async () => {
      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        progress: 100,
      })

      expect(enrollment.completedAt).toBeDefined()
    })

    it('should update lastAccessedAt when progress is modified', async () => {
      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
        progress: 0,
      })

      const originalLastAccessed = enrollment.lastAccessedAt

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10))

      // Update progress
      enrollment.progress = 50
      await enrollment.save()

      expect(enrollment.lastAccessedAt.getTime()).toBeGreaterThan(originalLastAccessed.getTime())
    })

    it('should calculate progress correctly', async () => {
      // Create additional lessons
      const lesson2 = await Lesson.create({
        title: 'Test Lesson 2',
        content: 'Test lesson content 2',
        courseId: testCourse._id,
        order: 2,
      })

      const lesson3 = await Lesson.create({
        title: 'Test Lesson 3',
        content: 'Test lesson content 3',
        courseId: testCourse._id,
        order: 3,
      })

      // Create enrollment
      const enrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
      })

      // Create lesson progress for 2 out of 3 lessons
      await LessonProgress.create({
        enrollmentId: enrollment._id,
        lessonId: testLesson._id,
        isCompleted: true,
        timeSpent: 30,
      })

      await LessonProgress.create({
        enrollmentId: enrollment._id,
        lessonId: lesson2._id,
        isCompleted: true,
        timeSpent: 25,
      })

      // Calculate progress using the static method
      const calculatedProgress = await Enrollment.calculateProgress(enrollment._id.toString())

      expect(calculatedProgress).toBe(67) // 2/3 * 100 = 66.67, rounded to 67
    })
  })

  describe('LessonProgress Model', () => {
    let testEnrollment: any

    beforeEach(async () => {
      testEnrollment = await Enrollment.create({
        studentId: testStudent._id,
        courseId: testCourse._id,
      })
    })

    it('should create a valid lesson progress', async () => {
      const progressData = {
        enrollmentId: testEnrollment._id,
        lessonId: testLesson._id,
        isCompleted: true,
        timeSpent: 30,
      }

      const progress = await LessonProgress.create(progressData)

      expect(progress.enrollmentId.toString()).toBe(testEnrollment._id.toString())
      expect(progress.lessonId.toString()).toBe(testLesson._id.toString())
      expect(progress.isCompleted).toBe(true)
      expect(progress.timeSpent).toBe(30)
      expect(progress.completedAt).toBeDefined()
      expect(progress.createdAt).toBeDefined()
      expect(progress.updatedAt).toBeDefined()
    })

    it('should set default values correctly', async () => {
      const progressData = {
        enrollmentId: testEnrollment._id,
        lessonId: testLesson._id,
      }

      const progress = await LessonProgress.create(progressData)

      expect(progress.isCompleted).toBe(false) // default value
      expect(progress.timeSpent).toBe(0) // default value
      expect(progress.completedAt).toBeUndefined()
    })

    it('should require enrollmentId and lessonId', async () => {
      const invalidProgress = new LessonProgress({})
      
      await expect(invalidProgress.save()).rejects.toThrow()
    })

    it('should validate timeSpent is non-negative', async () => {
      const progressData = {
        enrollmentId: testEnrollment._id,
        lessonId: testLesson._id,
        timeSpent: -1, // Invalid: negative
      }

      await expect(LessonProgress.create(progressData)).rejects.toThrow()
    })

    it('should prevent duplicate progress records', async () => {
      const progressData = {
        enrollmentId: testEnrollment._id,
        lessonId: testLesson._id,
        isCompleted: true,
        timeSpent: 30,
      }

      // Create first progress record
      await LessonProgress.create(progressData)

      // Try to create duplicate progress record
      await expect(LessonProgress.create(progressData)).rejects.toThrow()
    })

    it('should set completedAt when isCompleted is set to true', async () => {
      const progress = await LessonProgress.create({
        enrollmentId: testEnrollment._id,
        lessonId: testLesson._id,
        isCompleted: false,
        timeSpent: 15,
      })

      expect(progress.completedAt).toBeUndefined()

      // Update to completed
      progress.isCompleted = true
      await progress.save()

      expect(progress.completedAt).toBeDefined()
    })

    it('should set completedAt automatically when created as completed', async () => {
      const progress = await LessonProgress.create({
        enrollmentId: testEnrollment._id,
        lessonId: testLesson._id,
        isCompleted: true,
        timeSpent: 30,
      })

      expect(progress.completedAt).toBeDefined()
    })

    it('should handle progress calculation with subcourse lessons', async () => {
      // Create a subcourse
      const subCourse = await SubCourse.create({
        title: 'Test SubCourse',
        description: 'Test subcourse description',
        courseId: testCourse._id,
        order: 1,
      })

      // Create lesson in subcourse
      const subCourseLesson = await Lesson.create({
        title: 'SubCourse Lesson',
        content: 'SubCourse lesson content',
        subCourseId: subCourse._id,
        order: 1,
      })

      // Use the existing enrollment from beforeEach
      const enrollment = testEnrollment

      // Create progress for both direct course lesson and subcourse lesson
      await LessonProgress.create({
        enrollmentId: enrollment._id,
        lessonId: testLesson._id,
        isCompleted: true,
        timeSpent: 30,
      })

      await LessonProgress.create({
        enrollmentId: enrollment._id,
        lessonId: subCourseLesson._id,
        isCompleted: true,
        timeSpent: 25,
      })

      // Calculate progress - should include both direct and subcourse lessons
      const calculatedProgress = await Enrollment.calculateProgress(enrollment._id.toString())

      expect(calculatedProgress).toBe(100) // 2/2 lessons completed = 100%
    })
  })
})