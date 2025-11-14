import prisma from '@/lib/prisma'

export class EnrollmentService {
  /**
   * Calculate enrollment progress based on completed lessons
   */
  static async calculateProgress(enrollmentId: string): Promise<number> {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            lessons: true,
            subCourses: {
              include: {
                lessons: true,
              },
            },
          },
        },
        progressTracking: {
          where: { isCompleted: true },
        },
      },
    })

    if (!enrollment) return 0

    // Get all lessons for the course (both direct lessons and subcourse lessons)
    const directLessons = enrollment.course.lessons || []
    const subCourseLessons = enrollment.course.subCourses?.flatMap((sc: any) => sc.lessons) || []
    const allLessons = [...directLessons, ...subCourseLessons]

    if (allLessons.length === 0) return 0

    // Calculate progress percentage
    const completedCount = enrollment.progressTracking.length
    const progress = Math.round((completedCount / allLessons.length) * 100)

    // Update the enrollment progress
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        progress,
        completedAt: progress === 100 && !enrollment.completedAt ? new Date() : enrollment.completedAt,
        lastAccessedAt: new Date(),
      },
    })

    return progress
  }

  /**
   * Mark a lesson as completed and update enrollment progress
   */
  static async markLessonComplete(enrollmentId: string, lessonId: string, timeSpent: number = 0) {
    // Create or update lesson progress
    const lessonProgress = await prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId,
          lessonId,
        },
      },
      create: {
        enrollmentId,
        lessonId,
        isCompleted: true,
        timeSpent,
        completedAt: new Date(),
        organizationId: (await prisma.enrollment.findUnique({ where: { id: enrollmentId } }))!.organizationId,
      },
      update: {
        isCompleted: true,
        timeSpent,
        completedAt: new Date(),
      },
    })

    // Recalculate and update enrollment progress
    await this.calculateProgress(enrollmentId)

    return lessonProgress
  }

  /**
   * Update last accessed time for an enrollment
   */
  static async updateLastAccessed(enrollmentId: string) {
    return prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { lastAccessedAt: new Date() },
    })
  }

  /**
   * Get enrollment with full progress details
   */
  static async getEnrollmentWithProgress(enrollmentId: string) {
    return prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            lessons: true,
            subCourses: {
              include: {
                lessons: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: true,
          },
        },
        progressTracking: {
          include: {
            lesson: true,
          },
        },
      },
    })
  }
}
