import { NextRequest } from 'next/server'

import { auth } from '@/lib/auth'
import { UserRole } from '@/types'

import { ServiceError } from './errors'
import { SessionUser } from './types'

/**
 * Requires an authenticated session. Use for shared endpoints (e.g., /api/users/*).
 */
export async function requireSessionUser(request: NextRequest): Promise<SessionUser> {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) {
    throw new ServiceError('UNAUTHORIZED', 'Authentication required', 401)
  }

  return {
    id: session.user.id,
    role: session.user.role as UserRole,
    email: session.user.email,
    name: session.user.name,
  }
}

/**
 * Requires an authenticated session with a specific role.
 * Use for role-specific API namespaces:
 * - /api/business-owner/* → requireRole(request, 'BUSINESS_OWNER')
 * - /api/lecturer/* → requireRole(request, 'LECTURER')
 * - /api/student/* → requireRole(request, 'STUDENT')
 */
export async function requireRole(
  request: NextRequest,
  role: UserRole
): Promise<SessionUser> {
  const user = await requireSessionUser(request)

  if (user.role !== role) {
    throw new ServiceError(
      'FORBIDDEN',
      `Access denied. This endpoint requires ${role} role.`,
      403
    )
  }

  return user
}
