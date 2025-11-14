# Coding Standards

## TypeScript

### Type Definitions
- All types defined in `src/types/index.ts`
- Use interfaces for object shapes
- Use enums for fixed sets of values
- Export types for reuse across the codebase

```typescript
// ✅ Good
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
}

export enum UserRole {
  BUSINESS_OWNER = 'BUSINESS_OWNER',
  LECTURER = 'LECTURER',
  STUDENT = 'STUDENT',
}
```

### Type Safety
- Always type function parameters and return values
- Use `as` sparingly, prefer type guards
- Use `unknown` instead of `any` when type is truly unknown

```typescript
// ✅ Good
function getUser(id: string): Promise<User | null> {
  return User.findById(id)
}

// ❌ Bad
function getUser(id: any): any {
  return User.findById(id)
}
```

## Naming Conventions

### Files and Directories
- **Components**: PascalCase (`UserManagement.tsx`)
- **Utilities**: camelCase (`utils.ts`, `mongodb.ts`)
- **API Routes**: lowercase (`route.ts`)
- **Server Actions**: camelCase (`createCourse.ts` or in `courses.ts`)
- **Models**: PascalCase (`User.ts`, `Course.ts`)
- **Types**: camelCase (`index.ts`)

### Variables and Functions
- **Variables**: camelCase (`userName`, `courseList`)
- **Functions**: camelCase (`getUser`, `createCourse`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `DEFAULT_PAGE_SIZE`)
- **Components**: PascalCase (`UserTable`, `CourseCard`)
- **Types/Interfaces**: PascalCase (`User`, `CourseData`)

### Database
- **Collections**: lowercase, plural (`users`, `courses`)
- **Fields**: camelCase (`userId`, `createdAt`)
- **Indexes**: descriptive names (`idx_user_email`, `idx_course_org_published`)

## Code Organization

### Imports Order
1. React/Next.js imports
2. Third-party libraries
3. Internal components
4. Internal utilities/types
5. Relative imports

```typescript
// ✅ Good
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { Course } from '@/lib/models/Course'
import connectDB from '@/lib/mongodb'
import { UserRole } from '@/types'
```

### File Structure
- One component per file
- Related functions grouped in same file (e.g., all course actions in `courses.ts`)
- Export at the end for default exports
- Named exports preferred over default exports (except for pages/components)

## Server Components

### Pattern
```typescript
// ✅ Good: Server Component
import { auth } from '@/lib/auth'
import { Course } from '@/lib/models/Course'
import connectDB from '@/lib/mongodb'
import { redirect } from 'next/navigation'

export default async function CoursesPage() {
  const session = await auth.api.getSession({ headers: new Headers() })
  if (!session) redirect('/auth/login')
  
  await connectDB()
  const courses = await Course.find({}).lean()
  
  return <CourseList courses={courses} />
}
```

### Rules
- No `'use client'` directive
- Can use `async/await` directly
- Can access database directly
- Must serialize dates/objects for client components
- Use `redirect()` for navigation

## Server Actions

### Pattern
```typescript
// ✅ Good: Server Action
'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { Course } from '@/lib/models/Course'
import connectDB from '@/lib/mongodb'
import { z } from 'zod'

const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
})

export async function createCourse(formData: FormData) {
  try {
    await connectDB()
    const session = await auth.api.getSession({ headers: new Headers() })
    if (!session) throw new Error('Unauthorized')
    
    const data = createCourseSchema.parse({
      title: formData.get('title'),
      description: formData.get('description'),
    })
    
    const course = await Course.create({ ...data, lecturerId: session.user.id })
    revalidatePath('/dashboard/courses')
    
    return { success: true, data: course }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation failed', details: error.errors }
    }
    return { success: false, error: error.message }
  }
}
```

### Rules
- Must have `'use server'` directive
- Always validate input with Zod
- Always check authentication
- Always revalidate paths after mutations
- Return consistent error format
- Use try/catch for error handling

## API Routes

### Pattern
```typescript
// ✅ Good: API Route
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Course } from '@/lib/models/Course'
import connectDB from '@/lib/mongodb'
import { z } from 'zod'

const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
})

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    
    const courses = await Course.find({}).lean()
    return NextResponse.json({ success: true, data: courses })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const data = createCourseSchema.parse(body)
    
    const course = await Course.create({ ...data, lecturerId: session.user.id })
    return NextResponse.json({ success: true, data: course }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: error.errors } },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }
}
```

### Rules
- Export named functions: `GET`, `POST`, `PUT`, `DELETE`, `PATCH`
- Always check authentication first
- Always validate input with Zod
- Return consistent response format
- Use appropriate HTTP status codes
- Handle errors gracefully

## Client Components

### Pattern
```typescript
// ✅ Good: Client Component
'use client'

import { useState, useEffect } from 'react'
import { User } from '@/types'
import toast from 'react-hot-toast'

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchUsers()
  }, [])
  
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      const data = await response.json()
      if (data.success) {
        setUsers(data.data)
      } else {
        toast.error(data.error?.message || 'Failed to fetch users')
      }
    } catch (error) {
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }
  
  return <UserTable users={users} loading={loading} />
}
```

### Rules
- Must have `'use client'` directive
- Use hooks for state management
- Handle loading and error states
- Show user feedback (toast notifications)
- Fetch data in `useEffect` or event handlers

## Database Models

### Pattern
```typescript
// ✅ Good: Mongoose Model
import mongoose, { Schema, Document } from 'mongoose'
import { Course as ICourse, CourseLevel } from '@/types'

const courseSchema = new Schema<ICourse & Document>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  level: {
    type: String,
    enum: Object.values(CourseLevel),
    required: true,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
})

// Indexes
courseSchema.index({ lecturerId: 1 })
courseSchema.index({ isPublished: 1 })
courseSchema.index({ organizationId: 1, isPublished: 1 }) // Compound index

export const Course = mongoose.models.Course || mongoose.model<ICourse & Document>('Course', courseSchema)
```

### Rules
- Define schema with TypeScript types
- Add validation in schema
- Add indexes for frequently queried fields
- Use compound indexes for multi-field queries
- Export model with check for existing model

## Error Handling

### Consistent Error Format
```typescript
// Server Actions
return { success: false, error: 'Error message' }

// API Routes
return NextResponse.json(
  { success: false, error: { code: 'ERROR_CODE', message: 'Error message' } },
  { status: 400 }
)
```

### Validation Errors
```typescript
if (error instanceof z.ZodError) {
  return {
    success: false,
    error: 'Validation failed',
    details: error.errors
  }
}
```

## Comments and Documentation

### When to Comment
- Complex business logic
- Non-obvious code decisions
- Workarounds or temporary solutions
- Public API functions

### Comment Style
```typescript
// ✅ Good: Explain why, not what
// Filter courses by organization to ensure data isolation
const courses = await Course.find({ organizationId })

/**
 * Creates a new course with validation and authorization checks.
 * Only lecturers and business owners can create courses.
 */
export async function createCourse(formData: FormData) {
  // ...
}
```

## Testing

### Test File Naming
- `*.test.ts` for unit tests
- `*.spec.ts` for integration tests
- Co-locate with source files or in `src/test/`

### Test Structure
```typescript
describe('Course Model', () => {
  it('should create a course with valid data', async () => {
    // Arrange
    const courseData = { title: 'Test', description: 'Test desc' }
    
    // Act
    const course = await Course.create(courseData)
    
    // Assert
    expect(course.title).toBe('Test')
  })
})
```

## Git Commit Messages

- Use present tense: "Add user management" not "Added user management"
- Be descriptive but concise
- Reference issues when applicable: "Fix #123: User login issue"

