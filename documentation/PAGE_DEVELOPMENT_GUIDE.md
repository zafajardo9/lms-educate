# Page Development Guide

This guide documents the standard pattern for building feature pages in the LMS platform. It's based on the implementation of the **User Management** page (`/business-owner/users`) and should be followed for all new pages.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Folder Structure](#folder-structure)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [Component Patterns](#component-patterns)
5. [Data Flow](#data-flow)
6. [Modal Patterns](#modal-patterns)
7. [Checklist](#checklist)

---

## Architecture Overview

Every feature page follows a **Server-First with Client Interactivity** pattern:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Page (Server)                           │
│  src/app/{role}/{feature}/page.tsx                              │
│  - Fetches initial data via server actions                      │
│  - Passes data to client component                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Client Component                           │
│  src/components/{role}/{feature}/{feature}-client.tsx           │
│  - Handles all interactivity (filters, modals, actions)         │
│  - Uses URL params for pagination/filters (shareable links)     │
│  - Calls server actions for mutations                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Server Actions                             │
│  src/app/{role}/{feature}/actions.ts                            │
│  - Fetches data from API routes                                 │
│  - Handles mutations (create, update, delete)                   │
│  - Passes auth cookies to API                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Routes                              │
│  src/app/api/{resource}/route.ts                                │
│  - RESTful endpoints                                            │
│  - Prisma database operations                                   │
│  - Authentication & authorization                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Folder Structure

For a feature page at `/business-owner/users`:

```
src/
├── app/
│   └── business-owner/
│       └── users/
│           ├── page.tsx           # Server component (entry point)
│           └── actions.ts         # Server actions for data fetching
│
├── components/
│   └── business-owner/
│       └── user/                  # Feature components folder
│           ├── index.ts           # Barrel exports
│           ├── users-client.tsx   # Main client component
│           ├── user-columns.tsx   # TanStack Table column definitions
│           ├── user-filters.tsx   # Search and filter controls
│           ├── user-stats.tsx     # Statistics cards
│           ├── user-table.tsx     # Table component (optional, if not using DataTable)
│           ├── user-create-modal.tsx
│           ├── user-edit-modal.tsx
│           ├── user-delete-modal.tsx
│           └── user-role-modal.tsx
│
└── app/
    └── api/
        └── users/
            ├── route.ts           # GET (list), POST (create)
            └── [id]/
                └── route.ts       # GET, PUT, DELETE (single resource)
```

### Naming Conventions

| Item               | Convention                     | Example                 |
| ------------------ | ------------------------------ | ----------------------- |
| Page folder        | kebab-case                     | `users/`, `courses/`    |
| Component folder   | singular, kebab-case           | `user/`, `course/`      |
| Client component   | `{feature}-client.tsx`         | `users-client.tsx`      |
| Column definitions | `{feature}-columns.tsx`        | `user-columns.tsx`      |
| Modals             | `{feature}-{action}-modal.tsx` | `user-create-modal.tsx` |
| Server actions     | `actions.ts`                   | `actions.ts`            |

---

## Step-by-Step Implementation

### Step 1: Create the Server Actions

**File:** `src/app/{role}/{feature}/actions.ts`

```typescript
"use server";

import { cookies, headers } from "next/headers";

// Define response types
export interface ItemListResponse {
  items: Item[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  stats: {
    // Feature-specific stats
  };
}

// Helper to get base URL
async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}`;
}

// Fetch function
export async function getItems(params = {}): Promise<ItemListResponse> {
  const baseUrl = await getBaseUrl();
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const response = await fetch(`${baseUrl}/api/items?${queryParams}`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });

  // Transform and return data
}

// Mutation functions
export async function createItem(data) {
  /* ... */
}
export async function updateItem(id, data) {
  /* ... */
}
export async function deleteItem(id) {
  /* ... */
}
```

### Step 2: Create the Page Component (Server)

**File:** `src/app/{role}/{feature}/page.tsx`

```typescript
import { Suspense } from "react";
import { FeatureClient } from "@/components/{role}/{feature}";
import { getItems } from "./actions";
import { Spinner } from "@/components/ui/spinner";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    // ... other filters
  }>;
}

export default async function FeaturePage({ searchParams }: PageProps) {
  const params = await searchParams;

  const data = await getItems({
    page: params.page ? parseInt(params.page) : 1,
    pageSize: params.pageSize ? parseInt(params.pageSize) : 10,
    search: params.search ?? "",
    // ... other filters
  });

  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <Spinner className="size-8" />
        </div>
      }
    >
      <FeatureClient initialData={data} />
    </Suspense>
  );
}
```

### Step 3: Create the Client Component

**File:** `src/components/{role}/{feature}/{feature}-client.tsx`

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
import { Button } from "@/components/ui/button";

export function FeatureClient({ initialData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // URL-based pagination (makes links shareable)
  const updateUrl = useCallback(
    (params) => {
      const newParams = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value === "" || value === "all") {
          newParams.delete(key);
        } else {
          newParams.set(key, String(value));
        }
      });
      startTransition(() => {
        router.push(`?${newParams.toString()}`, { scroll: false });
      });
    },
    [router, searchParams]
  );

  // Action handlers
  const handleEdit = (item) => {
    setSelectedItem(item);
    setEditModalOpen(true);
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    setDeleteModalOpen(true);
  };

  // Success handlers (refresh data after mutations)
  const handleSuccess = () => {
    toast.success("Operation successful");
    router.refresh();
  };

  return (
    <PageLayout
      title="Feature"
      description="Description"
      actions={/* buttons */}
    >
      {/* Stats */}
      {/* Filters */}
      {/* DataTable */}
      {/* Modals */}
    </PageLayout>
  );
}
```

### Step 4: Create Column Definitions

**File:** `src/components/{role}/{feature}/{feature}-columns.tsx`

```typescript
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/shared/data-table";

interface ColumnsProps {
  onEdit?: (item: Item) => void;
  onDelete?: (item: Item) => void;
  // ... other action handlers
}

export function getColumns({
  onEdit,
  onDelete,
}: ColumnsProps = {}): ColumnDef<Item>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => <span>{row.getValue("name")}</span>,
    },
    {
      id: "actions",
      cell: ({ row }) => <DropdownMenu>{/* Action items */}</DropdownMenu>,
    },
  ];
}
```

### Step 5: Create Modals

Each modal follows this pattern:

```typescript
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const schema = z.object({
  // validation schema
});

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item | null; // For edit modals
  onSuccess?: () => void;
}

export function FeatureModal({
  open,
  onOpenChange,
  item,
  onSuccess,
}: ModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed");
      onOpenChange(false);
      onSuccess?.();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Title</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)}>{/* Form fields */}</form>
      </DialogContent>
    </Dialog>
  );
}
```

### Step 6: Create Barrel Export

**File:** `src/components/{role}/{feature}/index.ts`

```typescript
export { FeatureClient } from "./feature-client";
export { getColumns, type ItemColumnData } from "./feature-columns";
export { FeatureFilters } from "./feature-filters";
export { FeatureStats } from "./feature-stats";
export { FeatureCreateModal } from "./feature-create-modal";
export { FeatureEditModal } from "./feature-edit-modal";
export { FeatureDeleteModal } from "./feature-delete-modal";
```

---

## Component Patterns

### PageLayout Component

Use `PageLayout` from `@/components/shared/page-layout` for consistent page structure:

```typescript
<PageLayout
  title="Page Title"
  description="Page description"
  actions={<Button>Add New</Button>}
>
  {children}
</PageLayout>
```

### PageSection Component

Group related content:

```typescript
<PageSection title="Section Title" actions={<Button size="sm">Action</Button>}>
  {content}
</PageSection>
```

### PageCard Component

Wrap content in cards:

```typescript
<PageCard>
  {content}
</PageCard>

<PageCard noPadding className="overflow-hidden">
  {/* For tables */}
</PageCard>
```

### DataTable Component

Use the shared DataTable for all tabular data:

```typescript
<DataTable
  columns={columns}
  data={data}
  showSearch={false} // We use custom filters
  manualPagination
  pageCount={pagination.totalPages}
  pageIndex={currentPage - 1}
  pageSize={currentPageSize}
  onPageChange={handlePageChange}
  onPageSizeChange={handlePageSizeChange}
  totalRows={pagination.total}
  isLoading={isPending}
/>
```

---

## Data Flow

### URL-Based State Management

Filters and pagination are stored in URL params for:

- **Shareable links**: Users can share filtered views
- **Browser history**: Back/forward navigation works
- **Bookmarkable**: Users can bookmark specific views

```typescript
// Reading from URL
const currentPage = Number(searchParams.get("page") ?? "1");
const currentSearch = searchParams.get("search") ?? "";

// Updating URL
const updateUrl = (params) => {
  const newParams = new URLSearchParams(searchParams.toString());
  // ... update params
  router.push(`?${newParams.toString()}`, { scroll: false });
};
```

### Server Actions for API Calls

Server actions handle API communication with proper auth:

```typescript
"use server";

export async function getData() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const response = await fetch(`${baseUrl}/api/resource`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  // ...
}
```

### Refresh After Mutations

After successful mutations, refresh the page data:

```typescript
const handleSuccess = () => {
  toast.success("Success message");
  router.refresh(); // Re-fetches server component data
};
```

---

## Modal Patterns

### Modal Types

| Modal       | Purpose                         | Trigger             |
| ----------- | ------------------------------- | ------------------- |
| Create      | Add new item                    | Header button       |
| Edit        | Modify existing item            | Row action dropdown |
| Delete      | Remove item (with confirmation) | Row action dropdown |
| Role/Status | Change specific field           | Row action dropdown |

### Modal State Management

```typescript
// State
const [createModalOpen, setCreateModalOpen] = useState(false);
const [editModalOpen, setEditModalOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<Item | null>(null);

// Open handlers
const handleEdit = (item: Item) => {
  setSelectedItem(item);
  setEditModalOpen(true);
};

// Success handlers
const handleEditSuccess = () => {
  toast.success("Item updated");
  setSelectedItem(null);
  router.refresh();
};
```

### Delete Confirmation

Use `AlertDialog` for destructive actions:

```typescript
<AlertDialog open={open} onOpenChange={onOpenChange}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Item</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete} className="bg-destructive">
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Checklist

### Before Starting

- [ ] API routes exist for the resource (`GET`, `POST`, `PUT`, `DELETE`)
- [ ] Types are defined in `@/types` or locally

### Page Structure

- [ ] Server component page (`page.tsx`) fetches initial data
- [ ] Server actions file (`actions.ts`) handles API calls
- [ ] Client component handles all interactivity
- [ ] Components are in `src/components/{role}/{feature}/`
- [ ] Barrel export (`index.ts`) exists

### Components

- [ ] Uses `PageLayout` for consistent structure
- [ ] Uses `DataTable` for tabular data
- [ ] Column definitions are in separate file
- [ ] Filters update URL params (shareable links)
- [ ] Stats section shows relevant metrics

### Modals

- [ ] Create modal for adding items
- [ ] Edit modal for modifying items
- [ ] Delete modal with confirmation
- [ ] All modals use Zod validation
- [ ] Success handlers refresh data

### UX

- [ ] Loading states (Spinner, skeleton)
- [ ] Error handling with toast messages
- [ ] Refresh button in header
- [ ] Pagination controls
- [ ] Search and filter controls

### Code Quality

- [ ] TypeScript types for all props
- [ ] No `any` types
- [ ] Consistent naming conventions
- [ ] Components are exported via barrel file

---

## Example: User Management Page

Reference implementation: `src/app/business-owner/users/`

**Files:**

- `page.tsx` - Server component
- `actions.ts` - Server actions

**Components:** `src/components/business-owner/user/`

- `users-client.tsx` - Main client component
- `user-columns.tsx` - Table columns
- `user-filters.tsx` - Search/filter controls
- `user-stats.tsx` - Statistics cards
- `user-create-modal.tsx` - Create user form
- `user-edit-modal.tsx` - Edit user form
- `user-delete-modal.tsx` - Delete confirmation
- `user-role-modal.tsx` - Change role dialog
- `index.ts` - Barrel exports

This implementation serves as the template for all feature pages in the platform.
