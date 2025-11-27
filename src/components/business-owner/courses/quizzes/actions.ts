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

export async function updateQuizQuestion(
  courseId: string,
  quizId: string,
  questionId: string,
  data: QuizQuestionInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = await getBaseUrl()
    const authHeaders = await getAuthHeaders()

    const response = await fetch(
      `${baseUrl}/api/business-owner/courses/${courseId}/quizzes/${quizId}/questions/${questionId}`,
      {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(data),
      }
    )

    const result = await response.json()

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error?.message || 'Failed to update question',
      }
    }

    revalidatePath(`/business-owner/courses/${courseId}`)
    revalidatePath(`/business-owner/courses/${courseId}/quizzes/${quizId}/questions`)

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to update question' }
  }
}

export async function deleteQuizQuestion(
  courseId: string,
  quizId: string,
  questionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = await getBaseUrl()
    const authHeaders = await getAuthHeaders()

    const response = await fetch(
      `${baseUrl}/api/business-owner/courses/${courseId}/quizzes/${quizId}/questions/${questionId}`,
      {
        method: 'DELETE',
        headers: authHeaders,
      }
    )

    const result = await response.json()

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error?.message || 'Failed to delete question',
      }
    }

    revalidatePath(`/business-owner/courses/${courseId}`)
    revalidatePath(`/business-owner/courses/${courseId}/quizzes/${quizId}/questions`)

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to delete question' }
  }
}

export type QuizQuestionType =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'ESSAY'

export interface QuizQuestionInput {
  type: QuizQuestionType
  question: string
  options?: string[]
  correctAnswer: string
  explanation?: string | null
  points?: number
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

export async function createQuizQuestions(
  courseId: string,
  quizId: string,
  questions: QuizQuestionInput[]
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!questions.length) {
      return { success: false, error: 'Add at least one question' }
    }

    const baseUrl = await getBaseUrl()
    const authHeaders = await getAuthHeaders()

    const response = await fetch(
      `${baseUrl}/api/business-owner/courses/${courseId}/quizzes/${quizId}/questions`,
      {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ questions }),
      }
    )

    const result = await response.json()

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error?.message || 'Failed to create questions',
      }
    }

    revalidatePath(`/business-owner/courses/${courseId}`)
    revalidatePath(`/business-owner/courses/${courseId}/quizzes/${quizId}/questions`)

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to create questions' }
  }
}
