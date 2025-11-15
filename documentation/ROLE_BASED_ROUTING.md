# Role-Based Routing Guide

## Overview

This LMS platform uses role-based routing to ensure users only access pages appropriate for their role. This guide explains how the system works and how to add new role-specific pages.

---

## User Roles

From `prisma/schema.prisma`:

```prisma
enum UserRole {
  BUSINESS_OWNER  // Full platform access
  LECTURER        // Course creation and management  
  STUDENT         // Course enrollment and learning
}
```

---

## Route Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    User Logs In                              │
│                  /auth/login                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────┐
        │  Check User Role in Session │
        └─────────────┬───────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│BUSINESS_OWNER│          │   LECTURER   │          │   STUDENT    │
└──────┬───────┘          └──────┬───────┘          └──────┬───────┘
       │                         │                         │
       ▼                         ▼                         ▼
/business-owner/        /lecturer/              /student/
    dashboard/             dashboard/              dashboard/
       │                         │                         │
       ├─ page.tsx              ├─ page.tsx              ├─ page.tsx
       │                         │                         │
       ├─ courses/               ├─ courses/               └─ courses/
       │  ├─ page.tsx           │  ├─ page.tsx               └─ page.tsx
       │  ├─ create/            │  ├─ create/                  (browse only)
       │  │  └─ page.tsx        │  │  └─ page.tsx
       │  └─ [id]/              │  └─ [id]/
       │     └─ edit/            │     └─ edit/
       │        └─ page.tsx      │        └─ page.tsx
       │                         │
       └─ users/                 └─ (no user management)
          └─ page.tsx
```

---

## Access Control Matrix

| Feature | Business Owner | Lecturer | Student |
|---------|---------------|----------|---------|
| View own dashboard | ✅ | ✅ | ✅ |
| View all courses | ✅ | ❌ (own only) | ✅ (published only) |
| Create courses | ✅ | ✅ | ❌ |
| Edit any course | ✅ | ❌ (own only) | ❌ |
| Delete courses | ✅ | ✅ (own only) | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| Manage organizations | ✅ | ❌ | ❌ |
| Enroll in courses | ✅ | ✅ | ✅ |
| View analytics | ✅ | ✅ (own courses) | ✅ (own progress) |

---

## Middleware Protection

The `src/middleware.ts` file enforces role-based access:

```typescript
// Automatic protection
User tries: /lecturer/dashboard
User role: STUDENT
Result: Redirects to /student/dashboard

User tries: /business-owner/dashboard/users
User role: LECTURER
Result: Redirects to /lecturer/dashboard
```

### How Middleware Works:

1. **Check Authentication**: Verify user has valid session
2. **Extract Role**: Get user's role from session
3. **Match Route Pattern**: Check if route matches a role-specific pattern
4. **Validate Access**: Ensure user's role matches the route
5. **Redirect if Needed**: Send user to their correct dashboard if unauthorized

---

## Adding New Role-Specific Pages

### Example: Adding a "Reports" page for Business Owners

1. **Create the file**:
   ```
   src/app/business-owner/dashboard/reports/page.tsx
   ```

2. **Add role check**:
   ```typescript
   import { auth } from '@/lib/auth'
   import { UserRole } from '@/types'
   import { redirect } from 'next/navigation'

   export default async function ReportsPage() {
     const session = await auth.api.getSession({
       headers: new Headers()
     })

     if (!session) {
       redirect('/auth/login')
     }

     if (session.user.role !== UserRole.BUSINESS_OWNER) {
       redirect('/dashboard')
     }

     // Your page content
     return <div>Reports Dashboard</div>
   }
   ```

3. **The middleware automatically protects it** - no additional configuration needed!

---

## Client-Side Navigation

When creating links in your components, use role-aware paths:

```typescript
// ❌ Don't use generic paths
<Link href="/dashboard/courses">Courses</Link>

// ✅ Use role-specific paths
<Link href="/business-owner/dashboard/courses">Courses</Link>
<Link href="/lecturer/dashboard/courses">My Courses</Link>
<Link href="/student/dashboard/courses">Browse Courses</Link>
```

### Dynamic Role-Based Links

If you need to create dynamic links based on the current user's role:

```typescript
'use client'

import { useSession } from '@/lib/auth-client'
import Link from 'next/link'

export function DashboardLink() {
  const { data: session } = useSession()
  const role = session?.user?.role?.toLowerCase().replace('_', '-')
  
  return (
    <Link href={`/${role}/dashboard`}>
      Go to Dashboard
    </Link>
  )
}
```

---

## Server Components vs Client Components

### Server Components (Recommended)
Use for pages that fetch data and render on the server:

```typescript
// src/app/lecturer/dashboard/courses/page.tsx
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export default async function CoursesPage() {
  const session = await auth.api.getSession({ headers: new Headers() })
  
  const courses = await prisma.course.findMany({
    where: { lecturerId: session.user.id }
  })
  
  return <CourseList courses={courses} />
}
```

### Client Components
Use for interactive dashboards:

```typescript
// src/app/student/dashboard/page.tsx
'use client'

import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export default function StudentDashboard() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  
  // Role check with redirect
  useEffect(() => {
    if (!isPending && session?.user?.role !== UserRole.STUDENT) {
      router.push('/dashboard')
    }
  }, [session, isPending])
  
  // Your dashboard UI
}
```

---

## Testing Role-Based Access

### Manual Testing Checklist

1. **Login as each role**:
   - Business Owner: `admin@lms.com` / `admin123`
   - Lecturer: `lecturer@lms.com` / `lecturer123`
   - Student: `student@lms.com` / `student123`

2. **Verify correct dashboard**:
   - Each role should land on their specific dashboard
   - Check URL matches: `/business-owner/dashboard`, `/lecturer/dashboard`, or `/student/dashboard`

3. **Test unauthorized access**:
   - Try manually navigating to another role's dashboard
   - Should automatically redirect to your role's dashboard

4. **Test feature access**:
   - Business Owner: Can access user management
   - Lecturer: Can create courses, cannot access user management
   - Student: Can browse courses, cannot create or edit

---

## Common Patterns

### Conditional Rendering Based on Role

```typescript
import { auth } from '@/lib/auth'
import { UserRole } from '@/types'

export default async function CoursePage() {
  const session = await auth.api.getSession({ headers: new Headers() })
  const isBusinessOwner = session.user.role === UserRole.BUSINESS_OWNER
  const isLecturer = session.user.role === UserRole.LECTURER
  const canEdit = isBusinessOwner || isLecturer
  
  return (
    <div>
      <h1>Course Details</h1>
      {canEdit && <EditButton />}
      {isBusinessOwner && <DeleteButton />}
    </div>
  )
}
```

### Shared Components Across Roles

If you have components used by multiple roles, place them in `src/components/`:

```
src/components/
├── dashboard/
│   ├── CourseList.tsx      # Used by all roles
│   ├── CourseForm.tsx      # Used by business-owner & lecturer
│   └── UserManagement.tsx  # Used by business-owner only
```

---

## Security Best Practices

1. **Always verify role on the server**: Never trust client-side role checks alone
2. **Use middleware for route protection**: Automatic and consistent
3. **Check ownership**: Lecturers should only edit their own courses
4. **Filter by organization**: Always scope data to user's organization
5. **Validate permissions**: Double-check permissions in API routes

### Example: Checking Course Ownership

```typescript
export default async function EditCoursePage({ params }: { params: { id: string } }) {
  const session = await auth.api.getSession({ headers: new Headers() })
  const course = await prisma.course.findUnique({ where: { id: params.id } })
  
  // Check ownership
  const canEdit = 
    session.user.role === UserRole.BUSINESS_OWNER ||
    course.lecturerId === session.user.id
  
  if (!canEdit) {
    redirect('/dashboard')
  }
  
  // Render edit form
}
```

---

## Troubleshooting

### Issue: Redirect loop
**Cause**: Role check logic conflicts with middleware  
**Solution**: Ensure role checks use exact role values from `UserRole` enum

### Issue: User can access wrong dashboard
**Cause**: Middleware not running or misconfigured  
**Solution**: Check `middleware.ts` matcher config includes the route

### Issue: Session not found
**Cause**: Headers not passed correctly  
**Solution**: Use `headers: new Headers()` for server components, `headers: request.headers` for API routes

---

## Summary

✅ **Three role-based folders**: `business-owner`, `lecturer`, `student`  
✅ **Middleware protection**: Automatic route guarding  
✅ **Role-specific features**: Each role sees only what they need  
✅ **Secure by default**: Server-side validation on every page  
✅ **Easy to extend**: Add new pages in role folders, automatically protected  

For more details, see:
- `documentation/CONSOLIDATED_GUIDE.md` - Complete developer guide
- `documentation/FRONTEND_CODING_PRACTICES.md` - UI patterns
- `src/middleware.ts` - Middleware implementation

