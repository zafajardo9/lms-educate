import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define role-based route patterns
const ROLE_ROUTES = {
  'business-owner': /^\/business-owner/,
  'lecturer': /^\/lecturer/,
  'student': /^\/student/,
}

async function fetchSession(request: NextRequest) {
  const sessionEndpoint = new URL('/api/auth/session', request.url)
  try {
    const response = await fetch(sessionEndpoint, {
      headers: {
        cookie: request.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return null
    }

    const payload = await response.json()
    return payload?.data?.session ?? null
  } catch (error) {
    console.error('Middleware session fetch failed:', error)
    return null
  }
}

// Public routes that don't require authentication
const PUBLIC_EXACT = ['/', '/mission', '/timeline', '/pricing', '/contact', '/api/auth']
const PUBLIC_PREFIX = ['/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (PUBLIC_EXACT.includes(pathname) || PUBLIC_PREFIX.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow API routes (they handle their own auth)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  const session = await fetchSession(request)

  // Redirect to login if not authenticated
  if (!session && !pathname.startsWith('/auth')) {
    const loginUrl = new URL('/auth/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Check role-based access
  if (session?.user?.role) {
    const userRole = session.user.role.toLowerCase().replace(/_/g, '-')
    
    console.log('[Middleware] User role:', session.user.role, '-> Route:', userRole, 'Path:', pathname)
    
    // Check if user is trying to access a role-specific route
    for (const [role, pattern] of Object.entries(ROLE_ROUTES)) {
      if (pattern.test(pathname)) {
        // If user's role doesn't match the route, redirect to their dashboard
        if (role !== userRole) {
          console.log('[Middleware] Redirecting from', pathname, 'to', `/${userRole}/dashboard`)
          const dashboardUrl = new URL(`/${userRole}/dashboard`, request.url)
          return NextResponse.redirect(dashboardUrl)
        }
      }
    }
  } else if (session) {
    // If there's a session but no role, something is wrong
    console.error('[Middleware] Session exists but no role found:', session)
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

