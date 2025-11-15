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

---

## 2. Data Flow & Fetching

- **Server-first fetching**: call Prisma or service helpers inside server components. Return plain objects to the UI.
- **Client data**: when a client component needs data, pass it via props or fetch from `/api/*` endpoints (already following the API practices guide).
- **Suspense**: prefer streaming with `<Suspense>` + loading skeleton components stored in the same folder.
- **Error handling**: server components should throw (Next.js error boundary). Client components should render inline error UI.

---

## 3. Forms & Mutations

- Use server actions (`"use server"` functions in `src/lib/actions/*`) for mutations triggered from forms.
- Client forms import `useFormState` or `useTransition` to call these actions.
- Validate again in the server action/service (Zod). Client-side validation is optional but never authoritative.

---

## 4. Styling & UX

- Tailwind CSS + shadcn/ui primitives only—no custom CSS frameworks.
- Follow the design tokens already present (colors, spacing). Avoid introducing new utility classes unless necessary.
- Keep layouts responsive by default (flex/grid). Test on mobile breakpoints.
- Accessible defaults: buttons are `<button>`, links are `<Link>`, aria labels on icons, focus-visible states.

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
