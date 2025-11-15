import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

// Define role-based route patterns
const ROLE_ROUTES = {
  'business-owner': /^\/business-owner/,
  'lecturer': /^\/lecturer/,
  'student': /^\/student/,
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/auth/login', '/auth/register', '/api/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow API routes (they handle their own auth)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  // Redirect to login if not authenticated
  if (!session && !pathname.startsWith('/auth')) {
    const loginUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Check role-based access
  if (session) {
    const userRole = session.user.role?.toLowerCase().replace('_', '-')
    
    // Check if user is trying to access a role-specific route
    for (const [role, pattern] of Object.entries(ROLE_ROUTES)) {
      if (pattern.test(pathname)) {
        // If user's role doesn't match the route, redirect to their dashboard
        if (role !== userRole) {
          const dashboardUrl = new URL(`/${userRole}/dashboard`, request.url)
          return NextResponse.redirect(dashboardUrl)
        }
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}

