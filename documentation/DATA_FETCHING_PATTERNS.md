# Data Fetching Patterns

## Decision Tree

```
Need to fetch data?
│
├─ Is it for initial page render?
│  ├─ Yes → Use Server Component
│  └─ No → Continue
│
├─ Is it a mutation (create/update/delete)?
│  ├─ Yes → Use Server Action
│  └─ No → Continue
│
├─ Is it for client-side interactivity?
│  ├─ Yes → Use Client Component + API Route
│  └─ No → Use Server Component
│
└─ Is it for external integration/webhook?
   └─ Yes → Use API Route
```

## Pattern 1: Server Component (Default)

### When to Use
- ✅ Initial page data
- ✅ SEO-critical content
- ✅ No client-side interactivity needed
- ✅ Direct database access

### Example
```typescript
// src/app/dashboard/courses/page.tsx
import { auth } from '@/lib/auth'
import { Course } from '@/lib/models/Course'
import connectDB from '@/lib/mongodb'
import { UserRole } from '@/types'
import { redirect } from 'next/navigation'

export default async function CoursesPage() {
  // 1. Check authentication
  const session = await auth.api.getSession({ headers: new Headers() })
  if (!session) redirect('/auth/login')
  
  // 2. Connect to database
  await connectDB()
  
  // 3. Build query based on role
  let query: any = {}
  if (session.user.role === UserRole.LECTURER) {
    query.lecturerId = session.user.id
  } else if (session.user.role === UserRole.STUDENT) {
    query.isPublished = true
  }
  
  // 4. Fetch data
  const courses = await Course.find(query)
    .populate('lecturer', 'name email')
    .sort({ createdAt: -1 })
    .lean()
  
  // 5. Serialize data (convert dates, ObjectIds)
  const serializedCourses = courses.map(course => ({
    ...course,
    id: course._id.toString(),
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
  }))
  
  // 6. Render
  return <CourseList courses={serializedCourses} />
}
```

### Best Practices
- Always check authentication first
- Use `.lean()` for read-only queries
- Serialize dates and ObjectIds
- Use `.populate()` for relationships
- Apply role-based filtering

## Pattern 2: Server Action

### When to Use
- ✅ Form submissions
- ✅ Data mutations (create, update, delete)
- ✅ Need to revalidate cache
- ✅ Direct database writes

### Example
```typescript
// src/lib/actions/courses.ts
'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { Course } from '@/lib/models/Course'
import connectDB from '@/lib/mongodb'
import { z } from 'zod'

const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
})

export async function createCourse(formData: FormData) {
  try {
    // 1. Connect to database
    await connectDB()
    
    // 2. Check authentication
    const session = await auth.api.getSession({ headers: new Headers() })
    if (!session) {
      throw new Error('Authentication required')
    }
    
    // 3. Check authorization
    if (![UserRole.LECTURER, UserRole.BUSINESS_OWNER].includes(session.user.role)) {
      throw new Error('Insufficient permissions')
    }
    
    // 4. Parse and validate input
    const rawData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      level: formData.get('level') as string,
    }
    const courseData = createCourseSchema.parse(rawData)
    
    // 5. Perform mutation
    const course = await Course.create({
      ...courseData,
      lecturerId: session.user.id,
      isPublished: false,
    })
    
    // 6. Revalidate cache
    revalidatePath('/dashboard/courses')
    
    // 7. Return result
    return { success: true, data: course }
  } catch (error) {
    // 8. Handle errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.errors
      }
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create course'
    }
  }
}
```

### Using in Client Component
```typescript
// src/components/dashboard/CourseForm.tsx
'use client'

import { createCourse } from '@/lib/actions/courses'
import { useFormState } from 'react-dom'

export function CourseForm() {
  const [state, formAction] = useFormState(createCourse, null)
  
  return (
    <form action={formAction}>
      <input name="title" />
      <input name="description" />
      <button type="submit">Create</button>
      {state?.error && <p>{state.error}</p>}
    </form>
  )
}
```

### Best Practices
- Always validate with Zod
- Always check auth and authorization
- Always revalidate paths after mutations
- Return consistent error format
- Use try/catch for error handling

## Pattern 3: API Route

### When to Use
- ✅ Client components need to fetch data
- ✅ External API integrations
- ✅ Webhooks
- ✅ Real-time data updates
- ✅ Pagination, filtering, search

### Example
```typescript
// src/app/api/courses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Course } from '@/lib/models/Course'
import connectDB from '@/lib/mongodb'
import { z } from 'zod'

const courseFiltersSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  category: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    // 1. Connect to database
    await connectDB()
    
    // 2. Check authentication
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    
    // 3. Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const filters = courseFiltersSchema.parse({
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
    })
    
    // 4. Build query with role-based filtering
    let query: any = {}
    if (session.user.role === UserRole.LECTURER) {
      query.lecturerId = session.user.id
    } else if (session.user.role === UserRole.STUDENT) {
      query.isPublished = true
    }
    
    // Apply additional filters
    if (filters.search) {
      query.$text = { $search: filters.search }
    }
    if (filters.category) {
      query.category = filters.category
    }
    
    // 5. Execute query with pagination
    const skip = (filters.page - 1) * filters.limit
    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('lecturer', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit)
        .lean(),
      Course.countDocuments(query)
    ])
    
    // 6. Return response
    return NextResponse.json({
      success: true,
      data: courses,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
        hasNext: filters.page < Math.ceil(total / filters.limit),
        hasPrev: filters.page > 1,
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }
}
```

### Best Practices
- Always check authentication
- Validate query parameters
- Implement pagination for list endpoints
- Return consistent response format
- Use appropriate HTTP status codes
- Handle errors gracefully

## Pattern 4: Client Component + API

### When to Use
- ✅ Interactive UI (filters, search, pagination)
- ✅ Real-time updates
- ✅ User interactions
- ✅ Modals, dialogs, forms with client-side state

### Example
```typescript
// src/components/dashboard/UserManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { User } from '@/types'
import toast from 'react-hot-toast'

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
      })
      
      const response = await fetch(`/api/users?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.data.users)
      } else {
        toast.error(data.error?.message || 'Failed to fetch users')
      }
    } catch (error) {
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchTerm])
  
  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search users..."
      />
      {loading ? (
        <div>Loading...</div>
      ) : (
        <UserTable users={users} />
      )}
    </div>
  )
}
```

### Best Practices
- Show loading states
- Handle errors with user feedback
- Use `useEffect` for data fetching
- Clean up subscriptions if needed
- Debounce search inputs
- Use optimistic updates when appropriate

## Hybrid Pattern: Server Component + Client Component

### When to Use
- ✅ Initial data from Server Component
- ✅ Client-side interactivity needed
- ✅ Best of both worlds

### Example
```typescript
// Server Component (page.tsx)
export default async function CoursesPage() {
  await connectDB()
  const courses = await Course.find({ isPublished: true }).lean()
  return <CourseList initialCourses={courses} />
}

// Client Component (CourseList.tsx)
'use client'

export function CourseList({ initialCourses }: { initialCourses: Course[] }) {
  const [courses, setCourses] = useState(initialCourses)
  const [filters, setFilters] = useState({})
  
  // Client-side filtering, search, etc.
  useEffect(() => {
    // Apply filters, fetch more data, etc.
  }, [filters])
  
  return <div>{/* Render courses */}</div>
}
```

## Data Serialization

### MongoDB to JSON
```typescript
// Always serialize dates and ObjectIds
const serialized = {
  ...document,
  id: document._id.toString(),
  createdAt: document.createdAt.toISOString(),
  updatedAt: document.updatedAt.toISOString(),
  // For populated fields
  lecturer: document.lecturer ? {
    ...document.lecturer,
    id: document.lecturer._id.toString(),
  } : null,
}
```

## Caching Strategy

### Server Components
- Cached by default
- Use `revalidatePath()` after mutations
- Use `revalidateTag()` for tag-based revalidation

### API Routes
- Not cached by default
- Can use `export const revalidate = 60` for time-based revalidation
- Use `cache: 'no-store'` for dynamic data

### Server Actions
- Always call `revalidatePath()` after mutations
- Can use `revalidateTag()` for more granular control

## Performance Tips

1. **Use `.lean()`** for read-only queries (returns plain objects, faster)
2. **Use indexes** for frequently queried fields
3. **Limit pagination** (default: 10-50 items per page)
4. **Use `.select()`** to limit fields returned
5. **Use `.populate()`** efficiently (only populate what you need)
6. **Batch operations** when possible
7. **Use `Promise.all()`** for parallel queries

