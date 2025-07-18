import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { UserRole } from '@/types'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    name: string
    role: UserRole
    isActive: boolean
  }
}

export async function requireAuth(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      }, { status: 401 })
    }

    if (!session.user.isActive) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Your account has been disabled',
        },
      }, { status: 401 })
    }

    return session.user
  } catch (error) {
    console.error('Auth middleware error:', error)
    return NextResponse.json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
      },
    }, { status: 401 })
  }
}

export async function requireRole(request: NextRequest, allowedRoles: UserRole[]) {
  const user = await requireAuth(request)
  
  if (user instanceof NextResponse) {
    return user // Return error response
  }

  if (!allowedRoles.includes(user.role as UserRole)) {
    return NextResponse.json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      },
    }, { status: 403 })
  }

  return user
}

export function withAuth(handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = await requireAuth(request)
    
    if (user instanceof NextResponse) {
      return user // Return error response
    }

    // Add user to request object
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      isActive: user.isActive,
    }

    return handler(authenticatedRequest)
  }
}

export function withRole(allowedRoles: UserRole[], handler: (request: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const user = await requireRole(request, allowedRoles)
    
    if (user instanceof NextResponse) {
      return user // Return error response
    }

    // Add user to request object
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      isActive: user.isActive,
    }

    return handler(authenticatedRequest)
  }
}