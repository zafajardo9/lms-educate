import { NextRequest } from 'next/server'

import { auth } from '@/lib/auth'
import { UserRole } from '@/types'

import { ServiceError } from './errors'
import { SessionUser } from './types'

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
