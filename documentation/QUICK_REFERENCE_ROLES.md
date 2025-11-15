# Role-Based Routing - Quick Reference

## 🎯 Quick Start

### User Roles
```
BUSINESS_OWNER → /business-owner/dashboard
LECTURER       → /lecturer/dashboard
STUDENT        → /student/dashboard
```

### Demo Credentials
```
Business Owner: admin@lms.com / admin123
Lecturer:       lecturer@lms.com / lecturer123
Student:        student@lms.com / student123
```

---

## 📁 Where to Put New Pages

```
Business Owner only → src/app/business-owner/dashboard/[feature]/
Lecturer only      → src/app/lecturer/dashboard/[feature]/
Student only       → src/app/student/dashboard/[feature]/
All roles          → src/components/[feature]/
```

---

## 🔒 Page Template (Server Component)

```typescript
import { auth } from '@/lib/auth'
import { UserRole } from '@/types'
import { redirect } from 'next/navigation'

export default async function YourPage() {
  const session = await auth.api.getSession({
    headers: new Headers()
  })

  if (!session) {
    redirect('/auth/login')
  }

  if (session.user.role !== UserRole.YOUR_ROLE) {
    redirect('/dashboard')
  }

  // Your page content
  return <div>Your Content</div>
}
```

---

## 🎨 Page Template (Client Component)

```typescript
'use client'

import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { UserRole } from '@/types'

export default function YourPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/login')
    }
    if (session?.user?.role !== UserRole.YOUR_ROLE) {
      router.push('/dashboard')
    }
  }, [session, isPending, router])

  if (isPending) {
    return <div>Loading...</div>
  }

  if (!session || session.user.role !== UserRole.YOUR_ROLE) {
    return null
  }

  // Your page content
  return <div>Your Content</div>
}
```

---

## 🔗 Creating Links

```typescript
// Static links
<Link href="/business-owner/dashboard/courses">Courses</Link>

// Dynamic role-based links
const role = session?.user?.role?.toLowerCase().replace('_', '-')
<Link href={`/${role}/dashboard`}>Dashboard</Link>
```

---

## ✅ What Each Role Can Do

| Action | Business Owner | Lecturer | Student |
|--------|---------------|----------|---------|
| Create courses | ✅ | ✅ | ❌ |
| Edit any course | ✅ | ❌ | ❌ |
| Edit own course | ✅ | ✅ | ❌ |
| View all courses | ✅ | ❌ | ✅ |
| Manage users | ✅ | ❌ | ❌ |
| Enroll in courses | ✅ | ✅ | ✅ |

---

## 🛡️ Security Checklist

- [ ] Page checks user role
- [ ] Redirects if unauthorized
- [ ] Uses Prisma for data (not MongoDB)
- [ ] Filters by organizationId
- [ ] Validates ownership (for edit pages)
- [ ] Returns proper error states

---

## 🚨 Common Mistakes

### ❌ Wrong
```typescript
// No role check
export default function Page() {
  return <div>Anyone can see this</div>
}
```

### ✅ Correct
```typescript
export default async function Page() {
  const session = await auth.api.getSession({ headers: new Headers() })
  if (!session || session.user.role !== UserRole.BUSINESS_OWNER) {
    redirect('/dashboard')
  }
  return <div>Only business owners see this</div>
}
```

---

## 📝 Adding a New Feature

1. **Decide which roles need it**
2. **Create page in role folder(s)**:
   ```
   src/app/{role}/dashboard/{feature}/page.tsx
   ```
3. **Add role check** (use template above)
4. **Create shared components** (if needed):
   ```
   src/components/dashboard/{Feature}.tsx
   ```
5. **Test with each role**

---

## 🔍 Debugging

### Check current user role:
```typescript
console.log('Role:', session?.user?.role)
```

### Check if middleware is running:
```typescript
// Add to src/middleware.ts
console.log('Middleware checking:', pathname, 'for role:', userRole)
```

### Verify route protection:
1. Login as Student
2. Try to access `/business-owner/dashboard/users`
3. Should redirect to `/student/dashboard`

---

## 📚 More Info

- Full guide: `documentation/ROLE_BASED_ROUTING.md`
- Architecture: `documentation/CONSOLIDATED_GUIDE.md`
- Frontend patterns: `documentation/FRONTEND_CODING_PRACTICES.md`

