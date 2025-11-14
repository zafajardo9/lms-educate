# API Patterns

## API Route Structure

### File Location
```
src/app/api/
├── users/
│   ├── route.ts              # GET, POST /api/users
│   └── [id]/
│       ├── route.ts          # GET, PUT, DELETE /api/users/:id
│       └── profile/
│           └── route.ts      # GET, PUT /api/users/:id/profile
└── courses/
    ├── route.ts              # GET, POST /api/courses
    └── [id]/
        ├── route.ts          # GET, PUT, DELETE /api/courses/:id
        └── enroll/
            └── route.ts      # POST, DELETE /api/courses/:id/enroll
```

## Basic API Route Pattern

### GET Endpoint
```typescript
// src/app/api/courses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { Course } from '@/lib/models/Course'
import connectDB from '@/lib/mongodb'
import { z } from 'zod'

// Validation schema
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
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch courses' } },
      { status: 500 }
    )
  }
}
```

### POST Endpoint
```typescript
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
    
    // Check authorization
    if (![UserRole.LECTURER, UserRole.BUSINESS_OWNER].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }
    
    // Parse and validate request body
    const body = await request.json()
    const courseData = createCourseSchema.parse(body)
    
    // Create resource
    const course = await Course.create({
      ...courseData,
      lecturerId: session.user.id,
      organizationId: session.user.organizationId,
      isPublished: false,
    })
    
    await course.populate('lecturer', 'name email')
    
    return NextResponse.json({
      success: true,
      data: course,
      message: 'Course created successfully'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating course:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid course data',
            details: error.errors
          } 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create course' } },
      { status: 500 }
    )
  }
}
```

### GET by ID
```typescript
// src/app/api/courses/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    
    const course = await Course.findById(params.id)
      .populate('lecturer', 'name email')
      .populate('organization', 'name slug')
      .lean()
    
    if (!course) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      )
    }
    
    // Check authorization
    if (session.user.role === UserRole.STUDENT && !course.isPublished) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Course not available' } },
        { status: 403 }
      )
    }
    
    return NextResponse.json({ success: true, data: course })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }
}
```

### PUT Endpoint
```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    
    // Check resource exists
    const course = await Course.findById(params.id)
    if (!course) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      )
    }
    
    // Check authorization
    const canUpdate = 
      session.user.role === UserRole.BUSINESS_OWNER ||
      course.lecturerId === session.user.id
    
    if (!canUpdate) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }
    
    // Parse and validate
    const body = await request.json()
    const updateData = updateCourseSchema.parse(body)
    
    // Update
    const updatedCourse = await Course.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true, runValidators: true }
    )
    
    return NextResponse.json({ success: true, data: updatedCourse })
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

### DELETE Endpoint
```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }
    
    const course = await Course.findById(params.id)
    if (!course) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      )
    }
    
    // Check authorization
    const canDelete = 
      session.user.role === UserRole.BUSINESS_OWNER ||
      course.lecturerId === session.user.id
    
    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }
    
    // Check for dependencies
    const enrollmentCount = await Enrollment.countDocuments({ courseId: params.id })
    if (enrollmentCount > 0) {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'Cannot delete course with active enrollments' } },
        { status: 409 }
      )
    }
    
    await Course.findByIdAndDelete(params.id)
    
    return NextResponse.json({ success: true, message: 'Course deleted successfully' })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }
}
```

## Response Format

### Success Response
```typescript
// Single resource
return NextResponse.json({
  success: true,
  data: course
})

// List with pagination
return NextResponse.json({
  success: true,
  data: courses,
  pagination: {
    page: 1,
    limit: 10,
    total: 100,
    totalPages: 10,
    hasNext: true,
    hasPrev: false,
  }
})
```

### Error Response
```typescript
return NextResponse.json({
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Error message',
    details: [] // Optional, for validation errors
  }
}, { status: 400 })
```

## HTTP Status Codes

- `200` - Success (GET, PUT)
- `201` - Created (POST)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (e.g., duplicate enrollment)
- `500` - Internal Server Error

## Validation

### Zod Schema Pattern
```typescript
import { z } from 'zod'

const createCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  category: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).default([]),
  price: z.number().min(0).optional(),
  thumbnail: z.string().url().optional(),
})

// Usage
const body = await request.json()
const courseData = createCourseSchema.parse(body)
```

### Validation Error Response
```typescript
if (error instanceof z.ZodError) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid data',
        details: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }))
      }
    },
    { status: 400 }
  )
}
```

## Query Parameters

### Parsing Query Parameters
```typescript
const { searchParams } = new URL(request.url)

const filters = {
  page: parseInt(searchParams.get('page') || '1'),
  limit: parseInt(searchParams.get('limit') || '10'),
  search: searchParams.get('search') || undefined,
  category: searchParams.get('category') || undefined,
  isPublished: searchParams.get('isPublished') === 'true' ? true :
               searchParams.get('isPublished') === 'false' ? false : undefined,
  tags: searchParams.get('tags')?.split(',') || undefined,
}
```

### Validating Query Parameters
```typescript
const courseFiltersSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  isPublished: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
})

const filters = courseFiltersSchema.parse({
  page: parseInt(searchParams.get('page') || '1'),
  limit: parseInt(searchParams.get('limit') || '10'),
  // ... other params
})
```

## Pagination

### Pagination Pattern
```typescript
const page = filters.page
const limit = filters.limit
const skip = (page - 1) * limit

const [items, total] = await Promise.all([
  Model.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean(),
  Model.countDocuments(query)
])

const totalPages = Math.ceil(total / limit)

return NextResponse.json({
  success: true,
  data: items,
  pagination: {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
})
```

## Error Handling

### Try-Catch Pattern
```typescript
export async function GET(request: NextRequest) {
  try {
    // ... operation
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error:', error)
    
    // Handle specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid data' } },
        { status: 400 }
      )
    }
    
    // Generic error
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    )
  }
}
```

## Authorization Checks

### Standard Authorization Flow
```typescript
// 1. Check authentication
const session = await auth.api.getSession({ headers: request.headers })
if (!session) {
  return NextResponse.json(
    { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
    { status: 401 }
  )
}

// 2. Check role
if (!allowedRoles.includes(session.user.role)) {
  return NextResponse.json(
    { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
    { status: 403 }
  )
}

// 3. Check resource ownership/organization access
const resource = await Resource.findById(id)
if (resource.organizationId !== session.user.organizationId) {
  return NextResponse.json(
    { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
    { status: 403 }
  )
}
```

## Testing API Routes

### Test Structure
```typescript
import { describe, it, expect } from 'vitest'

describe('GET /api/courses', () => {
  it('should return 401 when not authenticated', async () => {
    const response = await fetch('/api/courses')
    expect(response.status).toBe(401)
  })
  
  it('should return courses when authenticated', async () => {
    // Mock session
    const response = await fetch('/api/courses', {
      headers: { Cookie: 'session=...' }
    })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
  })
})
```

