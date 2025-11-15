# LMS Platform - Complete Developer Guide

> **🎯 Single Source of Truth**: This consolidated guide replaces redundant documentation and provides everything you need to develop on this platform.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Database & Prisma](#database--prisma)
4. [API Development](#api-development)
5. [Authentication & Security](#authentication--security)
6. [Component Patterns](#component-patterns)
7. [Coding Standards](#coding-standards)
8. [Testing](#testing)

---

## Quick Start

### Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth
- **Validation**: Zod
- **Styling**: Tailwind CSS
- **Testing**: Vitest

### Setup

```bash
# Install dependencies
npm install

# Setup database
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL

# Run migrations
npx prisma migrate dev
npx prisma generate

# Seed database
npm run seed

# Start development
npm run dev
```

### Project Structure

```
src/
├── app/
│   ├── api/              # API Routes (REST endpoints)
│   ├── auth/             # Auth pages
│   ├── dashboard/        # Dashboard pages (Server Components)
│   └── courses/          # Course pages
├── components/
│   ├── ui/              # Reusable UI components
│   ├── dashboard/       # Dashboard components
│   └── courses/         # Course components
├── lib/
│   ├── actions/
│   │   ├── api/         # API service layer (Prisma-only logic)
│   │   │   └── types/   # Service-specific DTOs & helpers (barrel exported via index.ts)
│   │   └── ...          # Other server actions
│   ├── services/        # Reusable domain services
│   ├── auth.ts          # Better Auth config
│   ├── prisma.ts        # Prisma client
│   └── middleware/      # Auth middleware
├── types/               # TypeScript types
└── prisma/
    └── schema.prisma    # Database schema
```

---

## Architecture Overview

### Core Principles

1. **Server-First**: Prefer Server Components and Server Actions
2. **Type Safety**: TypeScript everywhere with Prisma types
3. **Security**: Multi-layer authentication and authorization
4. **Organization Scoping**: All data isolated by organization
5. **Progressive Enhancement**: Client components only when needed

### Data Fetching Strategy

#### 1. Server Components (Default)

**Use for**: Initial page data, SEO content

```typescript
export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
  });
  return <CourseList courses={courses} />;
}
```

#### 2. Server Actions

**Use for**: Mutations (create, update, delete)

```typescript
"use server";
export async function createCourse(formData: FormData) {
  const session = await auth.api.getSession({ headers: new Headers() });
  // ... validation
  const course = await prisma.course.create({ data: courseData });
  revalidatePath("/dashboard/courses");
  return { success: true, data: course };
}
```

#### 3. API Routes

**Use for**: Client-side fetching, external integrations

```typescript
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const data = await prisma.course.findMany({ where: filters });
  return NextResponse.json({ success: true, data });
}
```

---

## Database & Prisma

### Connection

Prisma Client is automatically connected via singleton pattern:

```typescript
import prisma from "@/lib/prisma";
// No need to connect/disconnect manually
```

### Common Query Patterns

#### Find One

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
});
```

#### Find Many with Filters

```typescript
const courses = await prisma.course.findMany({
  where: {
    isPublished: true,
    level: "BEGINNER",
    organizationId: orgId,
  },
  include: {
    lecturer: {
      select: { id: true, name: true, email: true },
    },
  },
  orderBy: { createdAt: "desc" },
  take: 10,
  skip: 0,
});
```

#### Text Search

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

#### Create

```typescript
const course = await prisma.course.create({
  data: {
    title: "New Course",
    description: "Description",
    level: "BEGINNER",
    lecturerId: userId,
    organizationId: orgId,
  },
  include: { lecturer: true },
});
```

#### Update

```typescript
const updated = await prisma.course.update({
  where: { id: courseId },
  data: { title: "Updated Title", isPublished: true },
});
```

#### Delete

```typescript
await prisma.course.delete({
  where: { id: courseId },
});
```

#### Composite Unique Keys

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

### Organization Scoping

**Always filter by organizationId:**

```typescript
const courses = await prisma.course.findMany({
  where: {
    organizationId: session.user.organizationId,
    // ... other filters
  },
});
```

---

## API Development

### Service Layer & Types

- **Routes stay thin**: API handlers in `src/app/api/*` should only parse requests, call the relevant service inside `src/lib/actions/api`, and shape the response.
- **Service folder layout**: each domain (courses, users, organizations, quizzes, etc.) owns a `*.ts` file plus any supporting helpers beneath `src/lib/actions/api`.
- **Typed DTOs**: shared service types (e.g., `SessionUser`, pagination metadata, response DTOs) live under `src/lib/actions/api/types/` and are re-exported through `src/lib/actions/api/types.ts`. This gives one import surface:

```ts
import { SessionUser, PaginationMetadata } from "@/lib/actions/api/types";
```

- **Barrel exports**: always add new type files inside the `types/` folder and export them via `types/index.ts` (or the existing `types.ts`) so consumers never reach into deep paths.

### Standard API Route Pattern

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@/types";
import { z } from "zod";

// 1. Define validation schema
const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
});

// 2. Implement endpoint
export async function POST(request: NextRequest) {
  try {
    // 3. Check authentication
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

    // 4. Check authorization
    if (
      ![UserRole.LECTURER, UserRole.BUSINESS_OWNER].includes(session.user.role)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Insufficient permissions" },
        },
        { status: 403 }
      );
    }

    // 5. Validate input
    const body = await request.json();
    const courseData = createCourseSchema.parse(body);

    // 6. Get user's organization
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

    // 7. Perform operation
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

    // 8. Return response
    return NextResponse.json(
      {
        success: true,
        data: course,
        message: "Course created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    // 9. Handle errors
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

    console.error("Error creating course:", error);
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

### Response Format Standards

**Success:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

**Error:**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { ... }
  }
}
```

### Error Codes

- `UNAUTHORIZED` (401): Not authenticated
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid input
- `CONFLICT` (409): Resource conflict
- `INTERNAL_ERROR` (500): Server error

---

## Authentication & Security

### Authentication Flow

1. **Better Auth** handles all auth logic automatically
2. Session stored in HTTP-only cookies
3. All protected routes check session

### Getting Session

**Server Components:**

```typescript
const session = await auth.api.getSession({ headers: new Headers() });
if (!session) redirect("/auth/login");
```

**API Routes:**

```typescript
const session = await auth.api.getSession({ headers: request.headers });
if (!session) {
  return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
}
```

### Authorization Layers

#### 1. System-Level Roles

- **BUSINESS_OWNER**: Full system access
- **LECTURER**: Can create/manage courses
- **STUDENT**: Can enroll in courses

#### 2. Resource Ownership

```typescript
const course = await prisma.course.findUnique({ where: { id } });
const canAccess =
  session.user.role === UserRole.BUSINESS_OWNER ||
  course.lecturerId === session.user.id;
```

#### 3. Organization Scoping

```typescript
// Always filter by organization
const courses = await prisma.course.findMany({
  where: { organizationId: session.user.organizationId },
});
```

### Security Checklist

✅ **Always check authentication first**  
✅ **Validate all inputs with Zod**  
✅ **Verify resource ownership**  
✅ **Filter by organizationId**  
✅ **Never expose passwords**  
✅ **Use Prisma (prevents SQL injection)**  
✅ **Check isActive status**  
✅ **Handle errors gracefully**

---

## Component Patterns

### Server Component

```typescript
// Default - no 'use client'
export default async function CoursesPage() {
  const session = await auth.api.getSession({ headers: new Headers() });
  if (!session) redirect("/auth/login");

  const courses = await prisma.course.findMany({
    where: { isPublished: true },
  });

  return <CourseList courses={courses} />;
}
```

### Client Component

```typescript
"use client";

import { useState, useEffect } from "react";

export function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUsers(data.data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  return <UserTable users={users} />;
}
```

### Form with Server Action

```typescript
"use client";

import { useFormState } from "react-dom";
import { createCourse } from "@/lib/actions/courses";

export function CourseForm() {
  const [state, formAction] = useFormState(createCourse, null);

  return (
    <form action={formAction}>
      <input name="title" required />
      <textarea name="description" required />
      <button type="submit">Create</button>
      {state?.error && <p className="text-red-500">{state.error}</p>}
    </form>
  );
}
```

---

## Coding Standards

### Naming Conventions

- **Files**: PascalCase for components (`UserManagement.tsx`), camelCase for utils (`utils.ts`)
- **Variables**: camelCase (`userName`, `courseList`)
- **Functions**: camelCase (`getUser`, `createCourse`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Components**: PascalCase (`UserTable`, `CourseCard`)
- **Types**: PascalCase (`User`, `CourseData`)

### Import Order

```typescript
// 1. React/Next.js
import { NextRequest, NextResponse } from "next/server";

// 2. Third-party
import { z } from "zod";

// 3. Internal
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@/types";
```

### Type Safety

```typescript
// ✅ Good: Always type parameters and returns
function getUser(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

// ❌ Bad: Using any
function getUser(id: any): any {
  return prisma.user.findUnique({ where: { id } });
}
```

### Error Handling

```typescript
// Server Actions
try {
  // ... operation
  return { success: true, data };
} catch (error) {
  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: "Validation failed",
      details: error.errors,
    };
  }
  return {
    success: false,
    error: error instanceof Error ? error.message : "Unknown error",
  };
}

// API Routes
try {
  // ... operation
  return NextResponse.json({ success: true, data });
} catch (error) {
  return NextResponse.json(
    { success: false, error: { code: "ERROR_CODE", message: "Error message" } },
    { status: 500 }
  );
}
```

---

## Testing

### Test Structure

```typescript
describe("Course API", () => {
  it("should create a course", async () => {
    // Arrange
    const courseData = { title: "Test", description: "Test desc" };

    // Act
    const course = await prisma.course.create({ data: courseData });

    // Assert
    expect(course.title).toBe("Test");
  });
});
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:run      # Run once
npm run test:ui       # UI mode
```

---

## Best Practices Summary

### Database

- ✅ Use Prisma for all database operations
- ✅ Always filter by organizationId
- ✅ Use `include` for relationships
- ✅ Use transactions for multi-step operations

### API Routes

- ✅ Check authentication first
- ✅ Validate input with Zod
- ✅ Return consistent response format
- ✅ Use appropriate HTTP status codes
- ✅ Handle errors gracefully

### Components

- ✅ Server Components by default
- ✅ Client Components only when needed
- ✅ Handle loading and error states
- ✅ Use TypeScript for all props

### Security

- ✅ Never trust client input
- ✅ Always verify ownership
- ✅ Check isActive status
- ✅ Never expose passwords
- ✅ Use organization scoping

---

## Quick Reference

### Common Commands

```bash
npm run dev           # Start development
npm run build         # Build for production
npm run lint          # Run linter
npm test              # Run tests
npx prisma studio     # Open Prisma Studio
npx prisma migrate dev # Run migrations
npm run seed          # Seed database
```

### Environment Variables

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/lms"
BETTER_AUTH_SECRET="your-secret"
BETTER_AUTH_URL="http://localhost:3000"
```

### Useful Links

- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Better Auth Docs](https://www.better-auth.com/docs)
- [Zod Docs](https://zod.dev)

---

## Getting Help

1. Check this guide first
2. Review existing code for examples
3. Check Prisma schema for data models
4. See `documentation/api/API_REFERENCE.md` for API details

---

**Last Updated**: This guide is maintained alongside the codebase. Always refer to the latest version.
