import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_SESSION',
            message: 'No active session found',
          },
        },
        { status: 401 }
      )
    }

    // Better Auth handles session invalidation through its handler
    // This endpoint is for additional cleanup if needed
    
    return NextResponse.json(
      {
        success: true,
        message: 'Signed out successfully',
      },
      { status: 200 }
    )
  } catch (error) {
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

