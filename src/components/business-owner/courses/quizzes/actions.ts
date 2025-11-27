'use server'

import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'

interface CreateQuizInput {
  title: string
  description: string
  timeLimit?: number | null
  maxAttempts?: number
  passingScore?: number
  order?: number
  isPublished?: boolean
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

export async function createQuiz(
  courseId: string,
  subCourseId: string | null,
  data: CreateQuizInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = await getBaseUrl()
    const authHeaders = await getAuthHeaders()

    const endpoint = subCourseId
      ? `${baseUrl}/api/business-owner/courses/${courseId}/subcourses/${subCourseId}/quizzes`
      : `${baseUrl}/api/business-owner/courses/${courseId}/quizzes`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error?.message || 'Failed to create quiz',
      }
    }

    revalidatePath(`/business-owner/courses/${courseId}`)
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to create quiz' }
  }
}
