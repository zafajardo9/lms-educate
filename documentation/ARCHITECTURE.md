# System Architecture

## Overview

This LMS platform is built with **Next.js 15** using the **App Router**, following a hybrid data fetching strategy that combines Server Components, Server Actions, API Routes, and Client Components for optimal performance and developer experience.

## Core Principles

1. **Server-First**: Prefer Server Components and Server Actions for data operations
2. **Type Safety**: Use TypeScript throughout with shared type definitions
3. **Role-Based Access Control**: Multi-layered authorization (System, Organization, Course)
4. **Data Isolation**: Organization-scoped data with proper filtering
5. **Progressive Enhancement**: Client components only when interactivity is needed

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Better Auth
- **Validation**: Zod
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form
- **UI Components**: Custom components (shadcn/ui style)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (REST endpoints)
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages (Server Components)
│   ├── courses/           # Course pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── dashboard/        # Dashboard-specific components
│   └── courses/          # Course-specific components
├── lib/                   # Core libraries
│   ├── actions/          # Server Actions
│   ├── models/           # Mongoose models
│   ├── auth.ts           # Better Auth configuration
│   ├── mongodb.ts        # Database connection
│   └── middleware/       # Auth middleware
├── types/                 # TypeScript type definitions
└── test/                  # Test files
```

## Data Fetching Strategy

### 1. Server Components (Default)
**Use for**: Initial page data, SEO-friendly content, direct database access

```typescript
// ✅ Good: Server Component fetching data
export default async function CoursesPage() {
  await connectDB()
  const courses = await Course.find({ isPublished: true })
  return <CourseList courses={courses} />
}
```

**When to use:**
- Page components that need data
- No client-side interactivity required
- SEO is important
- Direct database queries

### 2. Server Actions
**Use for**: Mutations (create, update, delete), form submissions

```typescript
// ✅ Good: Server Action for mutations
'use server'
export async function createCourse(formData: FormData) {
  await connectDB()
  const session = await auth.api.getSession({ headers: new Headers() })
  // ... validation and creation
  revalidatePath('/dashboard/courses')
  return { success: true, data: course }
}
```

**When to use:**
- Form submissions
- Data mutations
- Need to revalidate cache
- Direct database writes

### 3. API Routes
**Use for**: Client-side data fetching, external integrations, webhooks

```typescript
// ✅ Good: API Route for client-side fetching
export async function GET(request: NextRequest) {
  await connectDB()
  const session = await auth.api.getSession({ headers: request.headers })
  // ... fetch and return data
  return NextResponse.json({ success: true, data })
}
```

**When to use:**
- Client components need to fetch data
- External API integrations
- Webhooks
- Real-time data updates

### 4. Client Components + API
**Use for**: Interactive UI, real-time updates, user interactions

```typescript
// ✅ Good: Client component fetching from API
'use client'
export function UserManagement() {
  const [users, setUsers] = useState([])
  useEffect(() => {
    fetch('/api/users').then(res => res.json()).then(setUsers)
  }, [])
  return <UserTable users={users} />
}
```

**When to use:**
- Interactive components (forms, modals, filters)
- Real-time data updates
- Client-side state management
- User interactions

## Authentication & Authorization

### Authentication Flow
1. User logs in via Better Auth (`/api/auth/sign-in/email`)
2. Session stored in HTTP-only cookie
3. All protected routes check session via `auth.api.getSession()`

### Authorization Layers

1. **System-Level Roles**: `BUSINESS_OWNER`, `LECTURER`, `STUDENT`
2. **Organization-Level Roles**: `OWNER`, `ADMIN`, `INSTRUCTOR`, `REVIEWER`, `LEARNER`
3. **Course-Level Roles**: `OWNER`, `LEAD_INSTRUCTOR`, `INSTRUCTOR`, `TA`, `REVIEWER`

### Authorization Pattern

```typescript
// Always check authentication first
const session = await auth.api.getSession({ headers: request.headers })
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Then check role/permissions
if (!allowedRoles.includes(session.user.role)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Then check resource ownership/organization access
const resource = await Resource.findById(id)
if (resource.organizationId !== session.user.organizationId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

## Database Patterns

### Connection
- Always call `await connectDB()` before database operations
- Connection is cached, safe to call multiple times
- Use Mongoose models from `@/lib/models/`

### Queries
- Use `.lean()` for read-only queries (faster, returns plain objects)
- Use `.populate()` for relationships
- Always serialize dates: `createdAt.toISOString()`
- Use indexes for frequently queried fields

### Data Isolation
- Always filter by `organizationId` when querying
- Never expose data from other organizations
- Use compound indexes: `{ organizationId: 1, isPublished: 1 }`

## Error Handling

### Server Actions
```typescript
try {
  // ... operation
  return { success: true, data }
} catch (error) {
  if (error instanceof z.ZodError) {
    return { success: false, error: 'Validation failed', details: error.errors }
  }
  return { success: false, error: error.message }
}
```

### API Routes
```typescript
try {
  // ... operation
  return NextResponse.json({ success: true, data })
} catch (error) {
  return NextResponse.json(
    { success: false, error: { code: 'ERROR_CODE', message: error.message } },
    { status: 500 }
  )
}
```

## Validation

- Always validate input with Zod schemas
- Define schemas at the top of files
- Return validation errors in consistent format
- Validate both in Server Actions and API Routes

## Caching & Revalidation

- Use `revalidatePath()` after mutations in Server Actions
- Use `revalidateTag()` for tag-based revalidation
- Server Components are cached by default
- API Routes are not cached (unless using `export const revalidate`)

## File Organization Rules

1. **Pages**: `src/app/**/page.tsx` (Server Components by default)
2. **API Routes**: `src/app/api/**/route.ts`
3. **Server Actions**: `src/lib/actions/*.ts` (one file per resource)
4. **Models**: `src/lib/models/*.ts` (one file per model)
5. **Components**: `src/components/**/*.tsx` (Client Components marked with `'use client'`)
6. **Types**: `src/types/index.ts` (shared types)
7. **Utils**: `src/lib/utils.ts` (shared utilities)

## Multi-Tenancy

- Every resource belongs to an `organizationId`
- Users belong to organizations via `OrganizationMembership`
- Always scope queries by organization
- Organization branding (colors, logo) applied per organization
- Data isolation is critical for security

## Performance Considerations

1. **Database**: Use indexes, `.lean()` for reads, limit pagination
2. **Server Components**: Fetch data directly, no unnecessary client components
3. **API Routes**: Add pagination, filtering, search
4. **Client Components**: Use `useEffect` efficiently, avoid unnecessary re-renders
5. **Images**: Use Next.js Image component with optimization

## Security Best Practices

1. **Authentication**: Always check session before operations
2. **Authorization**: Verify role and resource ownership
3. **Input Validation**: Validate all inputs with Zod
4. **SQL Injection**: Use Mongoose (parameterized queries)
5. **XSS**: Sanitize user input, use React's built-in escaping
6. **CSRF**: Better Auth handles this
7. **Data Isolation**: Never expose cross-organization data

