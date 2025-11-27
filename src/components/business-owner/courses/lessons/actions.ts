'use server'

import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'

interface CreateLessonInput {
  title: string
  content: string
  videoUrl?: string | null
  attachments?: string[]
  duration?: number | null
  isPublished?: boolean
  order?: number
}

async function getBaseUrl() {
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  return `${protocol}://${host}`
}

async function getAuthHeaders() {
  const cookieStore = await cookies()
  return {
    'Content-Type': 'application/json',
    Cookie: cookieStore.toString(),
  }
}

export async function createLesson(
  courseId: string,
  subCourseId: string,
  data: CreateLessonInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = await getBaseUrl()
    const authHeaders = await getAuthHeaders()

    const response = await fetch(
      `${baseUrl}/api/business-owner/courses/${courseId}/subcourses/${subCourseId}/lessons`,
      {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(data),
      }
    )

    const result = await response.json()

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error?.message || 'Failed to create lesson',
      }
    }

    revalidatePath(`/business-owner/courses/${courseId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to create lesson' }
  }
}
