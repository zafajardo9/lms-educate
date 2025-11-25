# Frontend Coding Practices

Opinionated rules for building UI inside `src/app` and `src/components`. These guidelines keep the experience consistent, accessible, and easy to maintain.

---

## 1. Component Hierarchy

1. **Server Components by default**
   - Pages and layouts render on the server.
   - Fetch data (Prisma) directly inside the server component or call server actions.
2. **Client Components only when necessary**
   - Mark with `"use client"`.
   - Limit concerns to interactivity (forms, modals, drag/drop, rich inputs).
   - Keep business logic in actions/services; the client should orchestrate UI only.
3. **Directory structure**
   - `src/components/ui/` → atoms/molecules (buttons, badges, cards).
   - `src/components/dashboard/` & `src/components/courses/` → feature-specific assemblies.
   - Complex components can expose a barrel (`index.ts`) to simplify imports: `export { Card } from './Card'`.
4. **Role-based routing**
   - Pages are organized by user role: `src/app/{role}/dashboard/`
   - Roles: `business-owner`, `lecturer`, `student`
   - Each role has its own dashboard and feature pages
   - Middleware enforces role-based access control
   - Students always land in the `src/app/student` namespace after login; every page under that tree must expose only student-allowed functionality

### Page-component mirroring

- Every page under `src/app` must have a matching folder under `src/components` that mirrors the path segments and keeps role-specific UI isolated.
- Example: `src/app/student/dashboard/page.tsx` renders from `src/components/student/dashboard/`.
  - Keep reusable widgets for that page inside `src/components/student/dashboard/components/`.
  - Add an `index.ts` at the folder root to re-export page-scoped components: `export { StudentDashboardOverview } from './components/StudentDashboardOverview'`.
- This mirroring keeps student, lecturer, and business-owner components separated, avoiding accidental cross-role imports.

---

## 2. Data Flow & Fetching

- **Server-first fetching**: call Prisma or service helpers inside server components. Return plain objects to the UI.
- **Client data**: when a client component needs data, pass it via props or fetch from `/api/*` endpoints (already following the API practices guide).
- **Suspense**: prefer streaming with `<Suspense>` + loading skeleton components stored in the same folder.
- **Error handling**: server components should throw (Next.js error boundary). Client components should render inline error UI.
- **Standard data clients**:
  - Use **Axios** for any HTTP request from the frontend. It gives us typed request/response helpers, interceptors for auth headers, and consistent error objects.
  - Wrap remote state with **@tanstack/react-query** to manage caching, retries, and background refresh. Co-locate hooks (e.g., `useStudentCoursesQuery`) beside the page’s component folder.
  - Model interactive data grids with **@tanstack/react-table** so column logic, sorting, and pagination stay declarative and testable.
  - Enable **@tanstack/react-query-devtools** in local development to inspect cache keys, mutation status, and stale data at runtime.

---

## 3. Forms & Mutations

- Use server actions (`"use server"` functions in `src/lib/actions/*`) for mutations triggered from forms.
- Client forms import `useFormState` or `useTransition` to call these actions.
- Validate again in the server action/service (Zod). Client-side validation is optional but never authoritative.

---

## 4. Styling & UX

- Tailwind CSS + shadcn/ui primitives only—no custom CSS frameworks. Compose shadcn building blocks and Tailwind utilities for every surface.
- When the team provides a bespoke component (e.g., a card, form, or layout shell), treat it as the source of truth: reuse it instead of reimplementing, and proactively suggest improvements or refactors if a senior-level review would catch issues.
- Follow the design tokens already present (colors, spacing). Avoid introducing new utility classes unless necessary.
- Keep layouts responsive by default (flex/grid). Test on mobile breakpoints.
- Accessible defaults: buttons are `<button>`, links are `<Link>`, aria labels on icons, focus-visible states.
- **Theme system**
  - We ship with light and dark modes. Define semantic CSS variables in `:root` and `.dark` (e.g., `--foreground`, `--background`, `--card`) so swapping themes is a token change, not a refactor.
  - Tailwind recommends mapping these variables inside `tailwind.config.ts` via the `extend.colors` block. Prefer semantic names like `primary`, `muted`, `accent` instead of raw hex values in components.
  - For light mode, keep neutral surfaces near `#f8fafc` and foreground text near `#0f172a`. In dark mode, invert the contrast: backgrounds near `#0f172a`, text near `#f8fafc`, while reusing the same semantic tokens.
  - Use the `dark:` variant utilities to handle one-off adjustments, but default to CSS variables to keep overrides minimal.
  - When proposing new colors, update the token table first so designers/developers can locate and adjust them in a single place.

---

## 5. State Management

- Prefer localized React state (`useState`, `useReducer`).
- Use `useContext` only when several sibling components truly share state.
- Avoid external state libraries unless the team agrees (document rationale if introduced).

---

## 6. File Naming & Imports

- Component files: `PascalCase.tsx` (e.g., `CourseCard.tsx`).
- Hooks: `useXxx.ts` inside `src/hooks/` (barrel export via `index.ts`).
- If a folder exports more than one item, add an `index.ts` to re-export them. Example:
  ```ts
  export * from "./CourseFilters";
  export { type CourseFilterProps } from "./types";
  ```
- Import order: external libs first, then aliased modules (`@/components/...`, `@/lib/...`), then relative paths.

---

## 7. Testing & Verification

- Use Vitest + React Testing Library for critical client components or hooks.
- Snapshot tests for static UI, interaction tests for forms.
- For server components, prefer integration tests (render via `@testing-library/react` + `next/navigation` mocks) when logic is non-trivial.

---

## 8. Common Patterns

### Skeleton Pattern

```tsx
export function CoursesSkeleton() {
  return (
    <div className="grid gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}
```

### Client Wrapper

```tsx
"use client";

import { useTransition } from "react";
import { enrollInCourse } from "@/lib/actions/courses";

export function EnrollButton({ courseId }: { courseId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="btn btn-primary"
      disabled={pending}
      onClick={() => startTransition(() => enrollInCourse(courseId))}
    >
      {pending ? "Enrolling…" : "Enroll"}
    </button>
  );
}
```

---

## 9. Review Checklist

- [ ] Is the component a Server Component by default?
- [ ] Are client-specific files marked with `"use client"`?
- [ ] Is data fetched on the server or through approved APIs?
- [ ] Are styles using Tailwind/shadcn tokens only?
- [ ] Are props and state typed?
- [ ] Did we add/update `index.ts` when exporting multiple items from a folder?
- [ ] Are we reusing shared components instead of duplicating markup?

Adhering to this guide keeps the frontend cohesive, accessible, and maintainable. Update the file whenever a new pattern becomes standard.

---

## 10. Page Development Pattern

For feature pages (e.g., User Management, Course Management), follow the established pattern documented in [PAGE_DEVELOPMENT_GUIDE.md](./PAGE_DEVELOPMENT_GUIDE.md).

### Quick Reference

**Folder Structure:**

```
src/app/{role}/{feature}/
├── page.tsx           # Server component (fetches data)
└── actions.ts         # Server actions (API calls)

src/components/{role}/{feature}/
├── index.ts           # Barrel exports
├── {feature}-client.tsx
├── {feature}-columns.tsx
├── {feature}-filters.tsx
├── {feature}-stats.tsx
└── {feature}-*-modal.tsx
```

**Key Patterns:**

1. **Server-first data fetching**: Page component fetches initial data
2. **URL-based state**: Filters/pagination stored in URL params
3. **Client interactivity**: Modals, filters, actions in client component
4. **Shared components**: Use `PageLayout`, `DataTable` from `@/components/shared`
5. **TanStack Table**: Column definitions in separate file
6. **Modals**: Create, Edit, Delete modals with Zod validation

**Shared Components:**

- `PageLayout` - Consistent page wrapper with title, description, actions
- `PageSection` - Section grouping with optional title
- `PageCard` - Card wrapper for content blocks
- `PageGrid` - Responsive grid layout
- `DataTable` - TanStack Table with pagination, sorting, filtering

See the User Management implementation at `src/app/business-owner/users/` as the reference.
