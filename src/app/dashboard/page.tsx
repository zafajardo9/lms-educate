import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { auth } from '@/lib/auth'
import { UserRole } from '@/types'

const ROLE_ROUTES: Record<UserRole, string> = {
  [UserRole.BUSINESS_OWNER]: '/business-owner/dashboard',
  [UserRole.LECTURER]: '/lecturer/dashboard',
  [UserRole.STUDENT]: '/student/dashboard',
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: headers() })

  if (!session) {
    redirect('/auth/login')
  }

  const role = session.user.role as UserRole
  const targetRoute = ROLE_ROUTES[role]

  if (!targetRoute) {
    console.warn('Unhandled user role detected in dashboard router', role)
    redirect('/auth/login')
  }

  redirect(targetRoute)
}