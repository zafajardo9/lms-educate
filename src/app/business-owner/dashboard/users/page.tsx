import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { UserRole } from '@/types'
import { redirect } from 'next/navigation'
import { UserManagement } from '@/components/dashboard/UserManagement'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function UsersPage() {
  const session = await auth.api.getSession({
    headers: new Headers()
  })

  if (!session) {
    redirect('/auth/login')
  }

  if (session.user.role !== UserRole.BUSINESS_OWNER) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Manage users, roles, and permissions across the platform
        </p>
      </div>

      <Suspense fallback={
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </CardContent>
        </Card>
      }>
        <UserManagement />
      </Suspense>
    </div>
  )
}
