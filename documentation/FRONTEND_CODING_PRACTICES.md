# Frontend Coding Practices

Opinionated rules for building UI in this LMS platform. This is the single source of truth for frontend patterns.

---

## 1. Architecture Overview

Every feature page follows a **Server-First with Client Interactivity** pattern:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Page (Server)                           │
│  src/app/{role}/{feature}/page.tsx                              │
│  - Only contains the page component                             │
│  - Imports from components folder                               │
│  - Passes URL params to data fetching                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Components Folder                            │
│  src/components/{role}/{feature}/                               │
│  - index.ts (barrel exports)                                    │
│  - types.ts (TypeScript interfaces)                             │
│  - actions.ts (server actions for API calls)                    │
│  - {feature}-client.tsx (main client component)                 │
│  - {feature}-columns.tsx, filters, stats, modals                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Routes                              │
│  src/app/api/{role}/{resource}/route.ts                         │
│  - RESTful endpoints                                            │
│  - Prisma database operations                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Folder Structure

### Feature Page Structure

```
src/
├── app/{role}/{feature}/
│   └── page.tsx                    # Server component ONLY
│
└── components/{role}/{feature}/
    ├── index.ts                    # Barrel exports (components, types, actions)
    ├── types.ts                    # TypeScript interfaces
    ├── actions.ts                  # Server actions ("use server")
    ├── {feature}-client.tsx        # Main client component
    ├── {feature}-columns.tsx       # TanStack Table columns
    ├── {feature}-filters.tsx       # Search/filter controls
    ├── {feature}-stats.tsx         # Statistics cards
    ├── {feature}-create-modal.tsx  # Create modal
    ├── {feature}-edit-modal.tsx    # Edit modal
    └── {feature}-delete-modal.tsx  # Delete confirmation
```

### Example: Courses Feature

```
src/app/business-owner/courses/
└── page.tsx                        # Imports from components

src/components/business-owner/courses/
├── index.ts                        # export { CoursesClient, getCourses, ... }
├── types.ts                        # CourseListItem, CoursesResponse, etc.
├── actions.ts                      # getCourses(), createCourse(), etc.
├── courses-client.tsx
├── course-columns.tsx
├── course-filters.tsx
├── course-stats.tsx
├── course-create-modal.tsx
├── course-edit-modal.tsx
└── course-delete-modal.tsx
```

### Why This Structure?

- **Clean `app/` directory**: Only route files, no business logic
- **Colocation**: Types, actions, and components live together
- **Single import**: `import { CoursesClient, getCourses } from "@/components/business-owner/courses"`
- **Reusability**: Components can be imported by other features

---

## 3. Component Hierarchy

1. **Server Components by default** - Pages render on the server
2. **Client Components when needed** - Mark with `"use client"` for interactivity
3. **Role-based organization** - `src/components/{role}/{feature}/`

### Shared Components

```
src/components/
├── ui/                 # shadcn/ui primitives (Button, Input, Dialog)
└── shared/             # Cross-role reusable components
    ├── page-layout.tsx # PageLayout, PageSection, PageCard, PageGrid
    ├── data-table.tsx  # TanStack Table wrapper
    ├── sidebar.tsx
    └── navbar.tsx
```

---

## 4. Implementation Pattern

### Step 1: Create Types (`types.ts`)

```typescript
import { CourseStatus, CourseLevel } from "@/types";

export interface CourseListItem {
  id: string;
  title: string;
  status: CourseStatus;
  // ...
}

export interface CoursesResponse {
  courses: CourseListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  stats: { totalCourses: number; activeCourses: number /* ... */ };
}

export interface GetCoursesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}
```

### Step 2: Create Server Actions (`actions.ts`)

```typescript
"use server";

import { cookies, headers } from "next/headers";
import type { CoursesResponse, GetCoursesParams } from "./types";

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}`;
}

async function getAuthHeaders() {
  const cookieStore = await cookies();
  return { "Content-Type": "application/json", Cookie: cookieStore.toString() };
}

export async function getCourses(
  params: GetCoursesParams = {}
): Promise<CoursesResponse> {
  const baseUrl = await getBaseUrl();
  const authHeaders = await getAuthHeaders();

  const response = await fetch(`${baseUrl}/api/business-owner/courses?...`, {
    headers: authHeaders,
    cache: "no-store",
  });
  // Transform and return
}

export async function createCourse(data) {
  /* ... */
}
export async function updateCourse(data) {
  /* ... */
}
export async function deleteCourse(id) {
  /* ... */
}
```

### Step 3: Create Barrel Export (`index.ts`)

```typescript
// Components
export { CoursesClient } from "./courses-client";
export { CourseStats } from "./course-stats";
export { CourseFilters } from "./course-filters";
export { getCourseColumns } from "./course-columns";
export { CourseCreateModal } from "./course-create-modal";
export { CourseEditModal } from "./course-edit-modal";
export { CourseDeleteModal } from "./course-delete-modal";

// Types
export type {
  CourseListItem,
  CoursesResponse,
  GetCoursesParams,
} from "./types";

// Actions
export {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "./actions";
```

### Step 4: Create Page (`page.tsx`)

```typescript
import { Suspense } from "react";
import { CoursesClient, getCourses } from "@/components/business-owner/courses";
import { Spinner } from "@/components/ui/spinner";

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}

export default async function CoursesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await getCourses({
    page: params.page ? parseInt(params.page) : 1,
    search: params.search ?? "",
    status: params.status ?? "all",
  });

  return (
    <Suspense fallback={<Spinner />}>
      <CoursesClient initialData={data} />
    </Suspense>
  );
}
```

### Step 5: Create Client Component (`{feature}-client.tsx`)

```typescript
"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  PageLayout,
  PageSection,
  PageCard,
} from "@/components/shared/page-layout";
import { DataTable } from "@/components/shared/data-table";

export function CoursesClient({ initialData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // URL-based state for shareable links
  const updateUrl = useCallback(
    (params) => {
      const newParams = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value === "" || value === "all") newParams.delete(key);
        else newParams.set(key, String(value));
      });
      startTransition(() =>
        router.push(`?${newParams.toString()}`, { scroll: false })
      );
    },
    [router, searchParams]
  );

  const handleSuccess = () => {
    toast.success("Success");
    router.refresh();
  };

  return (
    <PageLayout title="Courses" actions={/* buttons */}>
      {/* Stats, Filters, DataTable, Modals */}
    </PageLayout>
  );
}
```

---

## 5. Data Flow

### URL-Based State Management

Filters and pagination stored in URL for shareable/bookmarkable links:

```typescript
const currentPage = Number(searchParams.get("page") ?? "1");
const currentSearch = searchParams.get("search") ?? "";

const updateUrl = (params) => {
  const newParams = new URLSearchParams(searchParams.toString());
  // ... update
  router.push(`?${newParams.toString()}`, { scroll: false });
};
```

### Refresh After Mutations

```typescript
const handleSuccess = () => {
  toast.success("Success");
  router.refresh(); // Re-fetches server component data
};
```

---

## 6. Styling & UX

- **Tailwind CSS + shadcn/ui** only
- **Theme system**: Light/dark modes via CSS variables
- **Responsive**: flex/grid layouts, test on mobile
- **Accessible**: proper elements, aria labels, focus states

---

## 7. Naming Conventions

| Item               | Convention                     | Example                   |
| ------------------ | ------------------------------ | ------------------------- |
| Page folder        | kebab-case                     | `courses/`                |
| Component folder   | kebab-case                     | `courses/`                |
| Client component   | `{feature}-client.tsx`         | `courses-client.tsx`      |
| Column definitions | `{feature}-columns.tsx`        | `course-columns.tsx`      |
| Modals             | `{feature}-{action}-modal.tsx` | `course-create-modal.tsx` |
| Types file         | `types.ts`                     | `types.ts`                |
| Actions file       | `actions.ts`                   | `actions.ts`              |

---

## 8. Checklist

### Structure

- [ ] Page only imports from components folder
- [ ] Types, actions, components in `src/components/{role}/{feature}/`
- [ ] Barrel export (`index.ts`) exists

### Components

- [ ] Uses `PageLayout` for consistent structure
- [ ] Uses `DataTable` for tabular data
- [ ] Filters update URL params
- [ ] Modals use Zod validation

### Code Quality

- [ ] TypeScript types for all props
- [ ] No `any` types
- [ ] Server Components by default
- [ ] Client components marked with `"use client"`

---

## Reference Implementation

See the Courses implementation:

- **Page**: `src/app/business-owner/courses/page.tsx`
- **Components**: `src/components/business-owner/courses/`
