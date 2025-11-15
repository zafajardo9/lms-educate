# API Coding Practices

Design principles for every endpoint and service in this codebase. Treat this as the checklist you review before shipping a route, whether it lives under `src/app/api/*` or inside `src/lib/actions/api/*`.

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

## 2. Route Template (Controller Responsibilities)

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

**Key points:**

- `requireSessionUser` is the only way to grab auth info in routes
- Never import Prisma or better-auth directly in the controller
- Always pass `URLSearchParams` / parsed payload into the service instead of re-validating in the controller

---

## 3. Service Checklist

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

## 4. Security Practices Per Endpoint

1. **Authentication** – `requireSessionUser` must run before any logic. No anonymous routes unless explicitly required.
2. **Role enforcement** – Services decide what roles can act:
   - `BUSINESS_OWNER`: full access
   - `LECTURER`: limited to their own courses
   - `STUDENT`: read-only + their enrollments
3. **Organization scoping** – whenever a row belongs to an org, confirm the requester is part of it (either owner or accepted member). Use Prisma relations (e.g., `memberships.some(...)`).
4. **Resource ownership** – for actions on specific IDs (course, user, quiz) verify the `SessionUser` is allowed to touch that resource even if they are part of the org.
5. **Validation & normalization**
   - `zod` schemas with explicit `.trim()`, `.toLowerCase()`, or custom helpers (e.g., `normalizeEmail`)
   - Reject data earlier rather than later; surface `VALIDATION_ERROR`
6. **Auditing/logging**
   - Log fatal errors with enough context (`console.error('Error deleting course', error)`).
   - Do not log secrets or PII.

---

## 5. Response Format

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

## 6. Naming & File Conventions

- Routes: `src/app/api/courses/[id]/route.ts`
- Services: `src/lib/actions/api/courses.ts`
- Helpers: `src/lib/actions/api/utils.ts`
- Types: `src/lib/actions/api/types/session.ts`, `types/pagination.ts`, etc. (re-exported)
- Use descriptive function names (`listCourses`, `createOrganization`, `inviteOrganizationMember`)

---

## 7. Example Workflow (New Endpoint)

1. **Plan** – define what data the endpoint needs and which Prisma models are involved.
2. **Add Service Types** – create DTOs under `src/lib/actions/api/types/` and export them.
3. **Implement Service** – parse input (zod), enforce auth/role/org, call Prisma, return typed data.
4. **Add Controller** – minimal wrapper that calls the service.
5. **Test** – unit test the service (Vitest) and, if applicable, API integration tests.
6. **Docs** – update API reference if a public endpoint changed.

---

## 8. Common Pitfalls to Avoid

- ❌ Importing Prisma directly from `/app/api/*`
- ❌ Touching MongoDB/Mongoose (legacy)
- ❌ Skipping organization scoping or role checks
- ❌ Returning inconsistent response shapes
- ❌ Forgetting to export new types via `index.ts`

Follow this guide and every endpoint will be production-ready, secure, and maintainable. Keep it concise—if a new practice emerges, update this file alongside the code change.
