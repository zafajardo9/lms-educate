# Authentication & Authorization Patterns

## Authentication System

### Better Auth Configuration
- **Provider**: Better Auth
- **Session Storage**: HTTP-only cookies
- **Session Duration**: 7 days
- **Update Age**: 1 day

### Authentication Flow

1. User submits login form → `POST /api/auth/sign-in/email`
2. Better Auth validates credentials
3. Session created and stored in HTTP-only cookie
4. User redirected to dashboard
5. All subsequent requests include session cookie automatically

## Getting Session

### Server Components
```typescript
import { auth } from '@/lib/auth'

export default async function Page() {
  const session = await auth.api.getSession({
    headers: new Headers()
  })
  
  if (!session) {
    redirect('/auth/login')
  }
  
  // Use session.user.id, session.user.role, etc.
}
```

### Server Actions
```typescript
'use server'

import { auth } from '@/lib/auth'

export async function createCourse(formData: FormData) {
  const session = await auth.api.getSession({
    headers: new Headers()
  })
  
  if (!session) {
    throw new Error('Authentication required')
  }
  
  // Use session.user
}
```

### API Routes
```typescript
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers
  })
  
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    )
  }
  
  // Use session.user
}
```

## Authorization Layers

### 1. System-Level Roles

```typescript
enum UserRole {
  BUSINESS_OWNER = 'BUSINESS_OWNER',  // Full system access
  LECTURER = 'LECTURER',               // Can create/manage courses
  STUDENT = 'STUDENT'                  // Can enroll in courses
}
```

**Usage:**
- Checked first in all authorization flows
- Determines base permissions
- Stored in `session.user.role`

### 2. Organization-Level Roles

```typescript
enum OrganizationRole {
  OWNER = 'OWNER',           // Organization owner
  ADMIN = 'ADMIN',           // Organization administrator
  INSTRUCTOR = 'INSTRUCTOR', // Can teach courses
  REVIEWER = 'REVIEWER',      // Can review content
  LEARNER = 'LEARNER'        // Can enroll in courses
}
```

**Usage:**
- Checked via `OrganizationMembership` model
- Scoped to specific organization
- Determines organization-level permissions

### 3. Course-Level Roles

```typescript
enum CourseInstructorRole {
  OWNER = 'OWNER',              // Course owner
  LEAD_INSTRUCTOR = 'LEAD_INSTRUCTOR', // Lead instructor
  INSTRUCTOR = 'INSTRUCTOR',    // Regular instructor
  TA = 'TA',                    // Teaching assistant
  REVIEWER = 'REVIEWER'         // Content reviewer
}
```

**Usage:**
- Checked via `CourseInstructor` model
- Scoped to specific course
- Determines course-level permissions

## Authorization Patterns

### Pattern 1: Role-Based Authorization

```typescript
// ✅ Good: Check role before operation
const session = await auth.api.getSession({ headers: request.headers })
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

if (![UserRole.LECTURER, UserRole.BUSINESS_OWNER].includes(session.user.role)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Proceed with operation
```

### Pattern 2: Resource Ownership

```typescript
// ✅ Good: Check resource ownership
const course = await Course.findById(courseId)
if (!course) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

const canAccess = 
  session.user.role === UserRole.BUSINESS_OWNER ||
  course.lecturerId === session.user.id

if (!canAccess) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Proceed with operation
```

### Pattern 3: Organization Scoping

```typescript
// ✅ Good: Always scope by organization
const session = await auth.api.getSession({ headers: request.headers })
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Get user's organization memberships
const membership = await OrganizationMembership.findOne({
  userId: session.user.id,
  organizationId: organizationId,
})

if (!membership) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Query with organization scope
const courses = await Course.find({
  organizationId: organizationId,
  // ... other filters
})
```

### Pattern 4: Multi-Layer Authorization

```typescript
// ✅ Good: Check multiple authorization layers
async function canEditCourse(userId: string, courseId: string): Promise<boolean> {
  const course = await Course.findById(courseId).populate('organizationId')
  if (!course) return false
  
  // System-level: Business owner can edit any course
  const user = await User.findById(userId)
  if (user.role === UserRole.BUSINESS_OWNER) return true
  
  // Organization-level: Check organization role
  const orgMembership = await OrganizationMembership.findOne({
    userId,
    organizationId: course.organizationId,
    role: { $in: [OrganizationRole.OWNER, OrganizationRole.ADMIN] }
  })
  if (orgMembership) return true
  
  // Course-level: Check course instructor role
  const courseInstructor = await CourseInstructor.findOne({
    userId,
    courseId,
    role: { $in: [CourseInstructorRole.OWNER, CourseInstructorRole.LEAD_INSTRUCTOR] }
  })
  if (courseInstructor) return true
  
  return false
}
```

## Authorization Middleware

### Using Auth Middleware

```typescript
// src/lib/middleware/auth.ts
import { requireAuth, requireRole, withAuth, withRole } from '@/lib/middleware/auth'

// In API Route
export async function GET(request: NextRequest) {
  const user = await requireAuth(request)
  if (user instanceof NextResponse) return user // Error response
  
  // User is authenticated, proceed
}

// With role check
export async function POST(request: NextRequest) {
  const user = await requireRole(request, [UserRole.BUSINESS_OWNER])
  if (user instanceof NextResponse) return user // Error response
  
  // User has required role, proceed
}

// Using wrapper functions
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  // request.user is available
  const userId = request.user.id
  // ...
})

export const POST = withRole([UserRole.BUSINESS_OWNER], async (request: AuthenticatedRequest) => {
  // request.user is available and has required role
  // ...
})
```

## Common Authorization Checks

### Check if User is Active
```typescript
const session = await auth.api.getSession({ headers: request.headers })
if (!session?.user.isActive) {
  return NextResponse.json(
    { error: { code: 'ACCOUNT_DISABLED', message: 'Account is disabled' } },
    { status: 401 }
  )
}
```

### Check Organization Membership
```typescript
async function checkOrganizationAccess(userId: string, organizationId: string): Promise<boolean> {
  const membership = await OrganizationMembership.findOne({
    userId,
    organizationId,
    invitationStatus: InvitationStatus.ACCEPTED,
  })
  return !!membership
}
```

### Check Course Instructor
```typescript
async function checkCourseInstructor(userId: string, courseId: string): Promise<boolean> {
  const instructor = await CourseInstructor.findOne({
    userId,
    courseId,
    removedAt: null, // Not removed
  })
  return !!instructor
}
```

### Check Enrollment
```typescript
async function checkEnrollment(userId: string, courseId: string): Promise<boolean> {
  const enrollment = await Enrollment.findOne({
    studentId: userId,
    courseId,
  })
  return !!enrollment
}
```

## Role-Based Query Filtering

### Server Component Pattern
```typescript
export default async function CoursesPage() {
  const session = await auth.api.getSession({ headers: new Headers() })
  if (!session) redirect('/auth/login')
  
  await connectDB()
  
  // Build query based on role
  let query: any = {}
  
  if (session.user.role === UserRole.LECTURER) {
    // Lecturers see only their courses
    query.lecturerId = session.user.id
  } else if (session.user.role === UserRole.STUDENT) {
    // Students see only published courses
    query.isPublished = true
  }
  // Business owners see all courses (no filter)
  
  const courses = await Course.find(query).lean()
  return <CourseList courses={courses} />
}
```

### API Route Pattern
```typescript
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  let query: any = {}
  
  // Role-based filtering
  if (session.user.role === UserRole.LECTURER) {
    query.lecturerId = session.user.id
  } else if (session.user.role === UserRole.STUDENT) {
    query.isPublished = true
  }
  
  // Additional filters from query params
  const { searchParams } = new URL(request.url)
  if (searchParams.get('category')) {
    query.category = searchParams.get('category')
  }
  
  const courses = await Course.find(query).lean()
  return NextResponse.json({ success: true, data: courses })
}
```

## Security Best Practices

### 1. Always Check Authentication First
```typescript
// ✅ Good
const session = await auth.api.getSession({ headers: request.headers })
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
// Then check authorization
```

### 2. Never Trust Client-Side Role
```typescript
// ❌ Bad: Don't trust client-provided role
const userRole = request.body.role

// ✅ Good: Get role from session
const session = await auth.api.getSession({ headers: request.headers })
const userRole = session.user.role
```

### 3. Always Verify Resource Ownership
```typescript
// ✅ Good: Verify ownership even if user has high role
const course = await Course.findById(courseId)
if (course.organizationId !== session.user.organizationId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### 4. Use Organization Scoping
```typescript
// ✅ Good: Always filter by organization
const courses = await Course.find({
  organizationId: session.user.organizationId,
  // ... other filters
})
```

### 5. Check Active Status
```typescript
// ✅ Good: Check if account is active
if (!session.user.isActive) {
  return NextResponse.json({ error: 'Account disabled' }, { status: 401 })
}
```

## Error Responses

### Consistent Error Format
```typescript
// Authentication errors
return NextResponse.json(
  {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    }
  },
  { status: 401 }
)

// Authorization errors
return NextResponse.json(
  {
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'Insufficient permissions'
    }
  },
  { status: 403 }
)

// Account disabled
return NextResponse.json(
  {
    success: false,
    error: {
      code: 'ACCOUNT_DISABLED',
      message: 'Your account has been disabled'
    }
  },
  { status: 401 }
)
```

## Testing Authorization

### Test Cases to Cover
1. ✅ Unauthenticated user → 401
2. ✅ Authenticated user without permission → 403
3. ✅ Authenticated user with permission → 200
4. ✅ User accessing other organization's data → 403
5. ✅ User accessing own data → 200
6. ✅ Disabled account → 401
7. ✅ Role-based filtering works correctly
8. ✅ Resource ownership checks work correctly

