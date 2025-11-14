# API Patterns (Prisma + PostgreSQL)

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

## Basic API Route Pattern with Prisma

### GET Endpoint (List with Filtering)

```typescript
// src/app/api/courses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@/types";
import { z } from "zod";

// Validation schema
const courseFiltersSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  isPublished: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    // 2. Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const filters = courseFiltersSchema.parse({
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      level: searchParams.get("level") || undefined,
      isPublished:
        searchParams.get("isPublished") === "true"
          ? true
          : searchParams.get("isPublished") === "false"
          ? false
          : undefined,
    });

    // 3. Build Prisma where clause with role-based filtering
    let where: any = {};

    if (session.user.role === UserRole.LECTURER) {
      where.lecturerId = session.user.id;
    } else if (session.user.role === UserRole.STUDENT) {
      where.isPublished = true;
    }

    // Apply additional filters
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.level) {
      where.level = filters.level;
    }

    if (filters.isPublished !== undefined) {
      where.isPublished = filters.isPublished;
    }

    // 4. Execute query with pagination
    const skip = (filters.page - 1) * filters.limit;
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          lecturer: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: filters.limit,
      }),
      prisma.course.count({ where }),
    ]);

    // 5. Return response
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
      },
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch courses" },
      },
      { status: 500 }
    );
  }
}
```

### POST Endpoint (Create)

```typescript
// src/app/api/courses/route.ts
const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  price: z.number().min(0).optional(),
  thumbnail: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    // 2. Check permissions
    if (
      ![UserRole.LECTURER, UserRole.BUSINESS_OWNER].includes(
        session.user.role as UserRole
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Insufficient permissions" },
        },
        { status: 403 }
      );
    }

    // 3. Parse and validate body
    const body = await request.json();
    const courseData = createCourseSchema.parse(body);

    // 4. Get user's organization (required for course creation)
    const userOrg = await prisma.organizationMembership.findFirst({
      where: { userId: session.user.id },
      select: { organizationId: true },
    });

    if (!userOrg) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_ORGANIZATION",
            message: "User must belong to an organization",
          },
        },
        { status: 400 }
      );
    }

    // 5. Create course
    const course = await prisma.course.create({
      data: {
        ...courseData,
        lecturerId: session.user.id,
        organizationId: userOrg.organizationId,
        isPublished: false,
      },
      include: {
        lecturer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // 6. Return response
    return NextResponse.json(
      {
        success: true,
        data: course,
        message: "Course created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating course:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid data",
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to create course" },
      },
      { status: 500 }
    );
  }
}
```

### GET by ID Endpoint

```typescript
// src/app/api/courses/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        lecturer: {
          select: { id: true, name: true, email: true },
        },
        subCourses: true,
        lessons: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Course not found" },
        },
        { status: 404 }
      );
    }

    // Check access permissions
    const canAccess =
      session.user.role === UserRole.BUSINESS_OWNER ||
      course.lecturerId === session.user.id ||
      (session.user.role === UserRole.STUDENT && course.isPublished);

    if (!canAccess) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Access denied" },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: course });
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch course" },
      },
      { status: 500 }
    );
  }
}
```

### PUT Endpoint (Update)

```typescript
// src/app/api/courses/[id]/route.ts
const updateCourseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  category: z.string().max(100).optional(),
  tags: z.array(z.string()).optional(),
  price: z.number().min(0).optional(),
  thumbnail: z.string().url().optional(),
  isPublished: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: params.id },
    });

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Course not found" },
        },
        { status: 404 }
      );
    }

    // Check permissions
    const canUpdate =
      session.user.role === UserRole.BUSINESS_OWNER ||
      course.lecturerId === session.user.id;

    if (!canUpdate) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Insufficient permissions" },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updateData = updateCourseSchema.parse(body);

    const updatedCourse = await prisma.course.update({
      where: { id: params.id },
      data: updateData,
      include: {
        lecturer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedCourse,
      message: "Course updated successfully",
    });
  } catch (error) {
    console.error("Error updating course:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid data",
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to update course" },
      },
      { status: 500 }
    );
  }
}
```

### DELETE Endpoint

```typescript
// src/app/api/courses/[id]/route.ts
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: params.id },
    });

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Course not found" },
        },
        { status: 404 }
      );
    }

    // Check permissions
    const canDelete =
      session.user.role === UserRole.BUSINESS_OWNER ||
      course.lecturerId === session.user.id;

    if (!canDelete) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Insufficient permissions" },
        },
        { status: 403 }
      );
    }

    // Check if course has enrollments
    const enrollmentCount = await prisma.enrollment.count({
      where: { courseId: params.id },
    });

    if (enrollmentCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "Cannot delete course with active enrollments",
          },
        },
        { status: 409 }
      );
    }

    // Delete course (cascading deletes handled by Prisma schema)
    await prisma.course.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to delete course" },
      },
      { status: 500 }
    );
  }
}
```

## Common Prisma Query Patterns

### Find One by ID

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
});
```

### Find One by Unique Field

```typescript
const user = await prisma.user.findUnique({
  where: { email: "user@example.com" },
});
```

### Find One by Composite Unique Key

```typescript
const enrollment = await prisma.enrollment.findUnique({
  where: {
    studentId_courseId: {
      studentId: userId,
      courseId: courseId,
    },
  },
});
```

### Find Many with Filters

```typescript
const courses = await prisma.course.findMany({
  where: {
    isPublished: true,
    level: "BEGINNER",
    category: "Programming",
  },
  include: {
    lecturer: true,
  },
  orderBy: {
    createdAt: "desc",
  },
  take: 10,
  skip: 0,
});
```

### Text Search (Case Insensitive)

```typescript
const courses = await prisma.course.findMany({
  where: {
    OR: [
      { title: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
    ],
  },
});
```

### Array Operations

```typescript
// Check if array contains any of these values
const courses = await prisma.course.findMany({
  where: {
    tags: { hasSome: ["javascript", "typescript"] },
  },
});

// Check if array contains all of these values
const courses = await prisma.course.findMany({
  where: {
    tags: { hasEvery: ["javascript", "typescript"] },
  },
});
```

### Count

```typescript
const count = await prisma.course.count({
  where: { isPublished: true },
});
```

### Create

```typescript
const course = await prisma.course.create({
  data: {
    title: "New Course",
    description: "Description",
    level: "BEGINNER",
    lecturerId: userId,
    organizationId: orgId,
  },
  include: {
    lecturer: true,
  },
});
```

### Update

```typescript
const updated = await prisma.course.update({
  where: { id: courseId },
  data: {
    title: "Updated Title",
    isPublished: true,
  },
});
```

### Upsert (Create or Update)

```typescript
const profile = await prisma.userProfile.upsert({
  where: { userId: userId },
  create: {
    userId: userId,
    bio: "New bio",
  },
  update: {
    bio: "Updated bio",
  },
});
```

### Delete

```typescript
await prisma.course.delete({
  where: { id: courseId },
});
```

### Transactions

```typescript
const result = await prisma.$transaction([
  prisma.course.create({ data: courseData }),
  prisma.enrollment.create({ data: enrollmentData }),
]);
```

## Response Format Standards

### Success Response

```typescript
{
  success: true,
  data: {...},
  message: 'Optional success message'
}
```

### Error Response

```typescript
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Human-readable error message',
    details: {...} // Optional, for validation errors
  }
}
```

### Pagination Response

```typescript
{
  success: true,
  data: [...],
  pagination: {
    page: 1,
    limit: 10,
    total: 100,
    totalPages: 10,
    hasNext: true,
    hasPrev: false
  }
}
```

## Error Codes

- `UNAUTHORIZED` - 401: Not authenticated
- `FORBIDDEN` - 403: Authenticated but insufficient permissions
- `NOT_FOUND` - 404: Resource not found
- `VALIDATION_ERROR` - 400: Invalid input data
- `CONFLICT` - 409: Resource conflict (e.g., duplicate, has dependencies)
- `INTERNAL_ERROR` - 500: Server error

## Best Practices

1. **Always check authentication first**
2. **Validate input with Zod schemas**
3. **Use role-based access control**
4. **Include related data with `include`**
5. **Use transactions for multi-step operations**
6. **Handle errors gracefully with proper status codes**
7. **Return consistent response formats**
8. **Use TypeScript for type safety**
9. **Log errors for debugging**
10. **Never expose sensitive data in responses**
