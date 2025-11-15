import { NextRequest, NextResponse } from 'next/server'
import { APIError } from 'better-auth/api'

import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { headers } = await auth.api.signOut({
      headers: request.headers,
      returnHeaders: true,
    })

    const response = NextResponse.json(
      {
        success: true,
        message: 'Signed out successfully',
      },
      { status: 200 }
    )

    headers.forEach((value, key) => {
      response.headers.append(key, value)
    })

    return response
  } catch (error) {
    if (error instanceof APIError) {
      const status = error.status ?? 401
      return NextResponse.json(
        {
          success: false,
          error: {
            code: (error as APIError).code ?? 'AUTH_ERROR',
            message: error.message ?? 'Failed to sign out',
          },
        },
        { status }
      )
    }

    console.error('Sign-out error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to sign out. Please try again.',
        },
      },
      { status: 500 }
    )
  }
}

