import '@testing-library/jest-dom'
import { beforeAll, afterAll, afterEach } from 'vitest'
import prisma from '@/lib/prisma'

// Mock environment variables for testing
process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/lms-platform-test'

beforeAll(async () => {
  // Connect to test database
  await prisma.$connect()
})

afterEach(async () => {
  // Clean up database after each test
  // Delete in reverse order of dependencies to avoid foreign key constraints
  await prisma.lessonProgress.deleteMany({})
  await prisma.quizSubmission.deleteMany({})
  await prisma.question.deleteMany({})
  await prisma.quiz.deleteMany({})
  await prisma.courseGroupMembership.deleteMany({})
  await prisma.courseGroup.deleteMany({})
  await prisma.cohortEnrollment.deleteMany({})
  await prisma.enrollment.deleteMany({})
  await prisma.cohort.deleteMany({})
  await prisma.lesson.deleteMany({})
  await prisma.subCourse.deleteMany({})
  await prisma.coursePlanCourse.deleteMany({})
  await prisma.coursePlan.deleteMany({})
  await prisma.courseInstructor.deleteMany({})
  await prisma.course.deleteMany({})
  await prisma.organizationMembership.deleteMany({})
  await prisma.organization.deleteMany({})
  await prisma.userProfile.deleteMany({})
  await prisma.user.deleteMany({})
})

afterAll(async () => {
  // Close database connection after all tests
  await prisma.$disconnect()
})