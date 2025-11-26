# Project Structure Guide

Quick reference for locating code in the LMS platform.

---

## High-Level Structure

```
lms-platform/
├── src/
│   ├── app/              # Next.js App Router (pages & API routes only)
│   ├── components/       # All React components, types, and actions
│   ├── lib/              # Core utilities (auth, prisma, helpers)
│   └── types/            # Global TypeScript definitions
├── prisma/               # Database schema & migrations
└── documentation/        # Project docs
```

---

## `src/app/` (Routes Only)

Keep this directory **thin**. Only route files (`page.tsx`, `route.ts`, `layout.tsx`).

```
src/app/
├── api/                          # API route handlers
│   ├── auth/                     # Better Auth endpoints
│   └── business-owner/           # Role-scoped API routes
│       ├── courses/
│       └── users/
├── auth/                         # Public auth pages (login, register)
├── business-owner/               # Business owner pages
│   ├── courses/page.tsx
│   ├── users/page.tsx
│   └── dashboard/page.tsx
├── lecturer/                     # Lecturer pages
└── student/                      # Student pages
```

---

## `src/components/` (All Feature Code)

Components, types, actions, and modals live here—organized by role and feature.

```
src/components/
├── ui/                           # shadcn/ui primitives
├── shared/                       # Cross-role components
│   ├── page-layout.tsx           # PageLayout, PageSection, PageCard
│   ├── data-table.tsx            # TanStack Table wrapper
│   ├── sidebar.tsx
│   └── navbar.tsx
│
└── {role}/{feature}/             # Feature-specific code
    ├── index.ts                  # Barrel exports
    ├── types.ts                  # TypeScript interfaces
    ├── actions.ts                # Server actions ("use server")
    ├── {feature}-client.tsx      # Main client component
    ├── {feature}-columns.tsx     # Table columns
    ├── {feature}-filters.tsx     # Search/filter controls
    ├── {feature}-stats.tsx       # Stats cards
    └── {feature}-*-modal.tsx     # Create/Edit/Delete modals
```

### Example: Business Owner Courses

```
src/components/business-owner/courses/
├── index.ts                      # export { CoursesClient, getCourses, ... }
├── types.ts                      # CourseListItem, CoursesResponse
├── actions.ts                    # getCourses(), createCourse(), etc.
├── courses-client.tsx
├── course-columns.tsx
├── course-filters.tsx
├── course-stats.tsx
├── course-create-modal.tsx
├── course-edit-modal.tsx
└── course-delete-modal.tsx
```

---

## `src/lib/` (Utilities)

```
src/lib/
├── auth.ts                       # Better Auth configuration
├── prisma.ts                     # Prisma client singleton
├── utils.ts                      # Helper functions (cn, formatDate)
├── actions/api/                  # API service layer (Prisma operations)
└── middleware/                   # Auth helpers for routes
```

---

## `prisma/` (Database)

```
prisma/
├── schema.prisma                 # Data model (single source of truth)
├── migrations/                   # Migration history
└── seed.ts                       # Initial data script
```

---

## Key Principles

1. **`app/` is thin** - Only route files, no business logic
2. **Components folder has everything** - Types, actions, and UI together
3. **Single import** - `import { Client, getItems } from "@/components/{role}/{feature}"`
4. **Role-based organization** - Separate folders per role

---

## Documentation

| File                             | Purpose                                             |
| -------------------------------- | --------------------------------------------------- |
| **README.md**                    | Overview, setup, doc links                          |
| **API_CODING_PRACTICES.md**      | API patterns, security, Prisma rules                |
| **FRONTEND_CODING_PRACTICES.md** | UI patterns, folder structure, implementation guide |
