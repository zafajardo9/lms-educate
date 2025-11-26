# API Coding Practices

Design principles for every endpoint and service in this codebase. Treat this as the checklist you review before shipping a route, whether it lives under `src/app/api/*` or inside `src/lib/actions/api/*`.

## Available API Endpoints

### Public Endpoints (No Authentication Required)

- **Authentication**: `/api/auth/*` - Sign up, sign in, session management ([Full Documentation](./api/AUTH_API.md))

### Role-Based Endpoints (Authentication Required)

Each role has its own API namespace. Users can **only** access endpoints under their role's namespace.

| Role             | API Namespace           | Access Level                                 |
| ---------------- | ----------------------- | -------------------------------------------- |
| `BUSINESS_OWNER` | `/api/business-owner/*` | Full organization management, users, courses |
| `LECTURER`       | `/api/lecturer/*`       | Own courses, assigned students, content      |
| `STUDENT`        | `/api/student/*`        | Enrolled courses, submissions, progress      |

### Shared Endpoints (Any Authenticated User)

- **Users**: `/api/users/*` - Profile management (own profile only)
- **Organizations**: `/api/organizations/*` - View organization info

---

## 1. Layering & File Placement

1. **Routes stay thin**
   - Located in `src/app/api/**/route.ts`
   - Responsibilities: parse request, call service, map the response, handle `ServiceError`
2. **Services own business logic**
   - Located in `src/lib/actions/api/*.ts`
   - Must be pure Prisma/PostgreSQL code—no `connectDB`, no Mongoose imports
3. **Types close to services**
   - DTOs (`SessionUser`, `PaginationMetadata`, request/response types) live inside `src/lib/actions/api/types/`
   - Always expose them through the local `index.ts` (barrel) and import via `@/lib/actions/api/types`
4. **Global/domain types**
   - If a type is shared between UI and API, move it to `src/types/` and also export via `src/types/index.ts`

---

## 2. Role-Based API Structure

### Directory Layout

```
src/app/api/
├── auth/                    # Public - no auth required
│   ├── signin/
│   ├── signup/
│   ├── signout/
│   ├── session/
│   └── change-password/
├── business-owner/          # BUSINESS_OWNER role only
│   ├── dashboard/
│   ├── courses/
│   ├── lecturers/
│   ├── students/
│   └── analytics/
├── lecturer/                # LECTURER role only
│   ├── courses/
│   ├── students/
│   ├── assignments/
│   └── grades/
├── student/                 # STUDENT role only
│   ├── courses/
│   ├── enrollments/
│   ├── submissions/
│   └── progress/
└── users/                   # Any authenticated user (own profile)
```

---

## 3. Route Template (Controller Responsibilities)

### Standard Authenticated Route

```ts
import { NextRequest } from "next/server";
import { handleErrorResponse, jsonSuccess } from "@/lib/actions/api/response";
import { requireSessionUser } from "@/lib/actions/api/session";
import { listCourses } from "@/lib/actions/api/courses";

export async function GET(request: NextRequest) {
  try {
    const user = await requireSessionUser(request);
    const { courses, pagination } = await listCourses(
      user,
      new URL(request.url).searchParams
    );

    return jsonSuccess({ success: true, data: courses, pagination });
  } catch (error) {
    return handleErrorResponse(error, "Failed to fetch courses");
  }
}
```

### Role-Restricted Route (e.g., `/api/business-owner/*`)

```ts
import { NextRequest } from "next/server";
import { handleErrorResponse, jsonSuccess } from "@/lib/actions/api/response";
import { requireRole } from "@/lib/actions/api/session";
import { getDashboardStats } from "@/lib/actions/api/business-owner/dashboard";

export async function GET(request: NextRequest) {
  try {
    // Ensures user is authenticated AND has BUSINESS_OWNER role
    const user = await requireRole(request, "BUSINESS_OWNER");
    const stats = await getDashboardStats(user);

    return jsonSuccess({ success: true, data: stats });
  } catch (error) {
    return handleErrorResponse(error, "Failed to fetch dashboard");
  }
}
```

**Key points:**

- `requireSessionUser` - authenticates any user
- `requireRole(request, role)` - authenticates AND enforces specific role
- Never import Prisma or better-auth directly in the controller
- Always pass `URLSearchParams` / parsed payload into the service instead of re-validating in the controller

---

## 4. Service Checklist

| Concern              | Rule                                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Validation           | Use `zod` at the top of the service file. Parse input before touching Prisma.                                                       |
| Authorization        | Accept `SessionUser` and enforce role/ownership rules inside the service, not in the route.                                         |
| Organization scoping | Every query that reads/writes tenant data must filter by `organizationId` derived from the user or payload.                         |
| Prisma usage         | Prefer `findUnique`, `findMany`, `count`, `create`, etc. Avoid raw SQL unless documented.                                           |
| Error handling       | Throw `ServiceError(code, message, status, details?)` for user-facing issues. Anything else becomes a 500 in `handleErrorResponse`. |
| Type exports         | Export DTOs (e.g., `CourseFilters`, `CreateCoursePayload`) from the `types/` folder and import from the barrel.                     |
| Pagination           | Use `buildPagination(page, limit, total)` to return consistent metadata.                                                            |

---

## 5. Security Practices Per Endpoint

1. **Authentication** – `requireSessionUser` must run before any logic. No anonymous routes unless explicitly required.
2. **Role enforcement at route level** – Use `requireRole` for role-specific API namespaces:
   - `/api/business-owner/*` → `requireRole(request, "BUSINESS_OWNER")`
   - `/api/lecturer/*` → `requireRole(request, "LECTURER")`
   - `/api/student/*` → `requireRole(request, "STUDENT")`
3. **Role capabilities**:
   - `BUSINESS_OWNER`: full organization access, manage lecturers/students, all courses
   - `LECTURER`: own courses, assigned students, grades, content management
   - `STUDENT`: enrolled courses, submissions, view grades, track progress
4. **Organization scoping** – whenever a row belongs to an org, confirm the requester is part of it (either owner or accepted member). Use Prisma relations (e.g., `memberships.some(...)`).
5. **Resource ownership** – for actions on specific IDs (course, user, quiz) verify the `SessionUser` is allowed to touch that resource even if they are part of the org.
6. **Validation & normalization**
   - `zod` schemas with explicit `.trim()`, `.toLowerCase()`, or custom helpers (e.g., `normalizeEmail`)
   - Reject data earlier rather than later; surface `VALIDATION_ERROR`
7. **Auditing/logging**
   - Log fatal errors with enough context (`console.error('Error deleting course', error)`).
   - Do not log secrets or PII.

---

## 6. Response Format

Use the helpers:

```ts
return jsonSuccess(
  { success: true, data, message: "Created" },
  { status: 201 }
);
return handleErrorResponse(error, "Failed to create course");
```

`ServiceError` instances map to deterministic HTTP codes:

| Code               | HTTP Status |
| ------------------ | ----------- |
| `UNAUTHORIZED`     | 401         |
| `FORBIDDEN`        | 403         |
| `NOT_FOUND`        | 404         |
| `VALIDATION_ERROR` | 400         |
| `CONFLICT`         | 409         |
| `INTERNAL_ERROR`   | 500         |

---

## 7. Naming & File Conventions

- Role routes: `src/app/api/business-owner/courses/route.ts`
- Role services: `src/lib/actions/api/business-owner/courses.ts`
- Shared routes: `src/app/api/users/[id]/route.ts`
- Shared services: `src/lib/actions/api/users.ts`
- Helpers: `src/lib/actions/api/utils.ts`
- Types: `src/lib/actions/api/types/session.ts`, `types/pagination.ts`, etc. (re-exported)
- Use descriptive function names (`listCourses`, `createOrganization`, `inviteOrganizationMember`)

---

## 8. Example Workflow (New Endpoint)

1. **Plan** – define what data the endpoint needs and which Prisma models are involved.
2. **Add Service Types** – create DTOs under `src/lib/actions/api/types/` and export them.
3. **Implement Service** – parse input (zod), enforce auth/role/org, call Prisma, return typed data.
4. **Add Controller** – minimal wrapper that calls the service.
5. **Test** – unit test the service (Vitest) and, if applicable, API integration tests.
6. **Docs** – update API reference if a public endpoint changed.

---

## 9. Common Pitfalls to Avoid

- ❌ Importing Prisma directly from `/app/api/*`
- ❌ Touching MongoDB/Mongoose (legacy)
- ❌ Skipping organization scoping or role checks
- ❌ Returning inconsistent response shapes
- ❌ Forgetting to export new types via `index.ts`
- ❌ Using `requireSessionUser` instead of `requireRole` in role-specific routes
- ❌ Allowing cross-role API access (e.g., student accessing `/api/business-owner/*`)

Follow this guide and every endpoint will be production-ready, secure, and maintainable. Keep it concise—if a new practice emerges, update this file alongside the code change.
