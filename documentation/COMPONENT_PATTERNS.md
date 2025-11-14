# Component Patterns

## Component Types

### Server Components (Default)
- No `'use client'` directive
- Can use `async/await`
- Direct database access
- SEO-friendly
- No client-side interactivity

### Client Components
- Must have `'use client'` directive
- Can use React hooks
- Can handle user interactions
- Fetch data from API routes
- Can use browser APIs

## Server Component Pattern

### Basic Server Component
```typescript
// src/app/dashboard/courses/page.tsx
import { auth } from '@/lib/auth'
import { Course } from '@/lib/models/Course'
import connectDB from '@/lib/mongodb'
import { UserRole } from '@/types'
import { redirect } from 'next/navigation'
import CourseList from '@/components/dashboard/CourseList'

export default async function CoursesPage() {
  // 1. Check authentication
  const session = await auth.api.getSession({ headers: new Headers() })
  if (!session) {
    redirect('/auth/login')
  }
  
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
  
  // 5. Serialize data
  const serializedCourses = courses.map(course => ({
    ...course,
    id: course._id.toString(),
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
  }))
  
  // 6. Render
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Courses</h1>
      <CourseList initialCourses={serializedCourses} />
    </div>
  )
}
```

### Server Component Best Practices
- Always check authentication first
- Use `.lean()` for read-only queries
- Serialize dates and ObjectIds
- Pass data as props to client components
- Use `redirect()` for navigation

## Client Component Pattern

### Basic Client Component
```typescript
// src/components/dashboard/UserManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { User } from '@/types'
import { UserTable } from './UserTable'
import toast from 'react-hot-toast'

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    fetchUsers()
  }, [])
  
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/users')
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.data.users)
      } else {
        setError(data.error?.message || 'Failed to fetch users')
        toast.error(data.error?.message || 'Failed to fetch users')
      }
    } catch (error) {
      setError('Failed to fetch users')
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  if (error) {
    return <div className="text-red-500">{error}</div>
  }
  
  return <UserTable users={users} />
}
```

### Client Component with Filters
```typescript
'use client'

import { useState, useEffect } from 'react'
import { User, UserFilters } from '@/types'
import { UserTable } from './UserTable'
import { UserFiltersComponent } from './UserFilters'
import toast from 'react-hot-toast'

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<UserFilters>({})
  const [currentPage, setCurrentPage] = useState(1)
  
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(filters.role && { role: filters.role }),
        ...(filters.isActive !== undefined && { isActive: filters.isActive.toString() }),
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
  }, [currentPage, searchTerm, filters])
  
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page
  }
  
  const handleFiltersChange = (newFilters: UserFilters) => {
    setFilters(newFilters)
    setCurrentPage(1) // Reset to first page
  }
  
  return (
    <div>
      <UserFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onSearch={handleSearch}
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

## Form Component Pattern

### Using Server Actions
```typescript
// src/components/dashboard/CourseForm.tsx
'use client'

import { createCourse } from '@/lib/actions/courses'
import { useFormState } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function CourseForm() {
  const [state, formAction] = useFormState(createCourse, null)
  
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="title">Title</label>
        <Input
          id="title"
          name="title"
          required
          maxLength={200}
        />
      </div>
      
      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          required
          maxLength={2000}
          className="w-full"
        />
      </div>
      
      {state?.error && (
        <div className="text-red-500">
          {state.error}
        </div>
      )}
      
      {state?.success && (
        <div className="text-green-500">
          Course created successfully!
        </div>
      )}
      
      <Button type="submit">Create Course</Button>
    </form>
  )
}
```

### Using API Routes
```typescript
'use client'

import { useState } from 'react'
import { createCourse } from '@/lib/api/courses' // API client function
import toast from 'react-hot-toast'

export function CourseForm() {
  const [loading, setLoading] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      const data = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
      }
      
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (result.success) {
        toast.success('Course created successfully!')
        // Reset form or redirect
      } else {
        toast.error(result.error?.message || 'Failed to create course')
      }
    } catch (error) {
      toast.error('Failed to create course')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input name="title" required />
      <textarea name="description" required />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Course'}
      </button>
    </form>
  )
}
```

## Modal/Dialog Pattern

```typescript
'use client'

import { useState } from 'react'
import { User } from '@/types'
import { Button } from '@/components/ui/button'
import { CreateUserDialog } from './CreateUserDialog'
import toast from 'react-hot-toast'

export function UserManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  
  const handleUserCreated = () => {
    setShowCreateDialog(false)
    fetchUsers() // Refresh list
    toast.success('User created successfully')
  }
  
  return (
    <div>
      <Button onClick={() => setShowCreateDialog(true)}>
        Create User
      </Button>
      
      {showCreateDialog && (
        <CreateUserDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={handleUserCreated}
        />
      )}
      
      <UserTable users={users} />
    </div>
  )
}
```

## Table Component Pattern

```typescript
'use client'

import { User } from '@/types'
import { Button } from '@/components/ui/button'

interface UserTableProps {
  users: User[]
  onEdit?: (user: User) => void
  onDelete?: (user: User) => void
}

export function UserTable({ users, onEdit, onDelete }: UserTableProps) {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
            <td>{user.isActive ? 'Active' : 'Inactive'}</td>
            <td>
              {onEdit && (
                <Button onClick={() => onEdit(user)}>Edit</Button>
              )}
              {onDelete && (
                <Button onClick={() => onDelete(user)}>Delete</Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

## Loading States

### Loading Component
```typescript
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  )
}

// Usage
{loading ? <LoadingSpinner /> : <Content />}
```

### Skeleton Loading
```typescript
export function CourseCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  )
}
```

## Error States

### Error Component
```typescript
interface ErrorMessageProps {
  error: string
  onRetry?: () => void
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  return (
    <div className="text-red-500 p-4 border border-red-200 rounded">
      <p>{error}</p>
      {onRetry && (
        <Button onClick={onRetry}>Retry</Button>
      )}
    </div>
  )
}
```

## Empty States

### Empty State Component
```typescript
interface EmptyStateProps {
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-gray-600 mt-2">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  )
}

// Usage
{users.length === 0 ? (
  <EmptyState
    title="No users found"
    description="Get started by creating a new user"
    action={{
      label: "Create User",
      onClick: () => setShowCreateDialog(true)
    }}
  />
) : (
  <UserTable users={users} />
)}
```

## Component Organization

### File Structure
```
src/components/
├── ui/                    # Reusable UI components
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── badge.tsx
├── dashboard/             # Dashboard-specific components
│   ├── UserManagement.tsx
│   ├── UserTable.tsx
│   ├── CourseForm.tsx
│   └── CourseList.tsx
└── courses/              # Course-specific components
    ├── EnrollButton.tsx
    └── CourseCard.tsx
```

### Component Naming
- **PascalCase** for component files: `UserManagement.tsx`
- **PascalCase** for component names: `export function UserManagement()`
- **Descriptive names**: `CreateUserDialog`, `EditUserDialog`, `DeleteUserDialog`

## Props Pattern

### Type Props
```typescript
interface ComponentProps {
  // Required props
  title: string
  users: User[]
  
  // Optional props
  onEdit?: (user: User) => void
  loading?: boolean
  
  // Default props
  pageSize?: number
}

export function Component({ 
  title, 
  users, 
  onEdit, 
  loading = false,
  pageSize = 10 
}: ComponentProps) {
  // ...
}
```

## Best Practices

1. **Keep components focused**: One responsibility per component
2. **Use TypeScript**: Type all props and state
3. **Handle loading states**: Show loading indicators
4. **Handle error states**: Show error messages
5. **Handle empty states**: Show helpful empty state messages
6. **Use consistent styling**: Use Tailwind CSS classes
7. **Extract reusable logic**: Use custom hooks for shared logic
8. **Optimize re-renders**: Use `useMemo` and `useCallback` when needed
9. **Accessibility**: Use semantic HTML, ARIA labels
10. **Performance**: Lazy load heavy components

