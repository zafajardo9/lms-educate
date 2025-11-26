import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { APIError } from 'better-auth/api'

import { auth } from '@/lib/auth'

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const data = changePasswordSchema.parse(payload)

    const { headers } = await auth.api.changePassword({
      headers: request.headers,
      body: {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true,
      },
      returnHeaders: true,
    })

    const response = NextResponse.json(
      {
        success: true,
        message: 'Password changed successfully',
      },
      { status: 200 }
    )

    headers.forEach((value, key) => {
      response.headers.append(key, value)
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        },
        { status: 400 }
      )
    }

    if (error instanceof APIError) {
      const status = error.status ?? 400
      return NextResponse.json(
        {
          success: false,
          error: {
            code: (error as any).code ?? 'AUTH_ERROR',
            message: error.message ?? 'Failed to change password',
          },
        },
        { status: status as any }
      )
    }

    console.error('Change password error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to change password. Please try again.',
        },
      },
      { status: 500 }
    )
  }
}

