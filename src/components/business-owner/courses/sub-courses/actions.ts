'use server'

import { cookies, headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { SubCourse, CreateSubCourseInput, UpdateSubCourseInput, ReorderSubCourseInput } from './types'

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

export async function createSubCourse(courseId: string, data: CreateSubCourseInput): Promise<{ success: boolean; data?: SubCourse; error?: string }> {
    try {
        const baseUrl = await getBaseUrl()
        const authHeaders = await getAuthHeaders()

        const response = await fetch(`${baseUrl}/api/business-owner/courses/${courseId}/subcourses`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!response.ok) {
            return { success: false, error: result.error?.message || 'Failed to create subcourse' }
        }

        revalidatePath(`/business-owner/courses/${courseId}`)
        return { success: true, data: result.data }
    } catch (error) {
        return { success: false, error: 'Failed to create subcourse' }
    }
}

export async function updateSubCourse(courseId: string, subCourseId: string, data: UpdateSubCourseInput): Promise<{ success: boolean; data?: SubCourse; error?: string }> {
    try {
        const baseUrl = await getBaseUrl()
        const authHeaders = await getAuthHeaders()

        const response = await fetch(`${baseUrl}/api/business-owner/courses/${courseId}/subcourses/${subCourseId}`, {
            method: 'PUT',
            headers: authHeaders,
            body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!response.ok) {
            return { success: false, error: result.error?.message || 'Failed to update subcourse' }
        }

        revalidatePath(`/business-owner/courses/${courseId}`)
        return { success: true, data: result.data }
    } catch (error) {
        return { success: false, error: 'Failed to update subcourse' }
    }
}

export async function deleteSubCourse(courseId: string, subCourseId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const baseUrl = await getBaseUrl()
        const authHeaders = await getAuthHeaders()

        const response = await fetch(`${baseUrl}/api/business-owner/courses/${courseId}/subcourses/${subCourseId}`, {
            method: 'DELETE',
            headers: authHeaders,
        })

        const result = await response.json()

        if (!response.ok) {
            return { success: false, error: result.error?.message || 'Failed to delete subcourse' }
        }

        revalidatePath(`/business-owner/courses/${courseId}`)
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to delete subcourse' }
    }
}

export async function reorderSubCourses(courseId: string, data: ReorderSubCourseInput): Promise<{ success: boolean; data?: SubCourse[]; error?: string }> {
    try {
        const baseUrl = await getBaseUrl()
        const authHeaders = await getAuthHeaders()

        const response = await fetch(`${baseUrl}/api/business-owner/courses/${courseId}/subcourses`, {
            method: 'PUT',
            headers: authHeaders,
            body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!response.ok) {
            return { success: false, error: result.error?.message || 'Failed to reorder subcourses' }
        }

        revalidatePath(`/business-owner/courses/${courseId}`)
        return { success: true, data: result.data }
    } catch (error) {
        return { success: false, error: 'Failed to reorder subcourses' }
    }
}
