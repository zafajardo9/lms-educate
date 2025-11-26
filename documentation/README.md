# LMS Platform Documentation

Lean documentation for building and reviewing code. Three files drive all conventions:

| Doc                              | Purpose                                            |
| -------------------------------- | -------------------------------------------------- |
| **README.md**                    | Platform overview, setup, quick reference          |
| **API_CODING_PRACTICES.md**      | API patterns, security, Prisma rules               |
| **FRONTEND_CODING_PRACTICES.md** | UI patterns, folder structure, page implementation |

> **Single source of truth** is the codebase. Docs describe required patterns.

---

## Platform at a Glance

| Topic      | Summary                              |
| ---------- | ------------------------------------ |
| Framework  | Next.js 15 (App Router) + TypeScript |
| Database   | PostgreSQL (Prisma ORM)              |
| Auth       | Better Auth (session cookies)        |
| Styling    | Tailwind CSS + shadcn/ui             |
| Validation | Zod                                  |
| Testing    | Vitest                               |

---

## Folder Structure

```
src/
├── app/                              # Routes ONLY (pages, API handlers)
│   ├── api/{role}/{resource}/        # API route handlers
│   ├── business-owner/               # Business owner pages
│   ├── lecturer/                     # Lecturer pages
│   ├── student/                      # Student pages
│   └── auth/                         # Auth pages (login, register)
│
├── components/                       # ALL feature code lives here
│   ├── ui/                           # shadcn/ui primitives
│   ├── shared/                       # Cross-role components (PageLayout, DataTable)
│   └── {role}/{feature}/             # Feature components, types, actions
│       ├── index.ts                  # Barrel exports
│       ├── types.ts                  # TypeScript interfaces
│       ├── actions.ts                # Server actions
│       └── *.tsx                     # Components
│
├── lib/                              # Core utilities
│   ├── auth.ts                       # Better Auth config
│   ├── prisma.ts                     # Prisma client
│   └── actions/api/                  # API service layer
│
└── types/                            # Global TypeScript definitions
```

### Key Principle

**`app/` is thin, `components/` has everything.**

```typescript
// Page imports everything from components folder
import { CoursesClient, getCourses } from "@/components/business-owner/courses";
```

---

## Role-Based Routing

| Role             | Dashboard                   | Capabilities                          |
| ---------------- | --------------------------- | ------------------------------------- |
| `BUSINESS_OWNER` | `/business-owner/dashboard` | Manage platform, users, organizations |
| `LECTURER`       | `/lecturer/dashboard`       | Create/manage courses                 |
| `STUDENT`        | `/student/dashboard`        | Browse/enroll in courses              |

Middleware enforces role boundaries. Unauthorized access redirects to user's dashboard.

---

## Core Tenets

1. **PostgreSQL + Prisma** – No MongoDB
2. **Thin controllers** – API routes call services in `lib/actions/api/`
3. **Types near behavior** – Feature types in `components/{role}/{feature}/types.ts`
4. **Security-by-default** – Auth, roles, org scoping on every route
5. **Server Components first** – Client components only for interactivity

---

## Setup

```bash
npm install
cp .env.example .env.local   # Configure DATABASE_URL, auth secrets
npx prisma migrate dev
npx prisma generate
npm run dev
```

Other: `npm run lint`, `npm run test`, `npm run seed`, `npx prisma studio`

---

## Quick Reference

| Need              | Where                        |
| ----------------- | ---------------------------- |
| Folder structure  | PROJECT_STRUCTURE.md         |
| API patterns      | API_CODING_PRACTICES.md      |
| Frontend patterns | FRONTEND_CODING_PRACTICES.md |
| Database schema   | `prisma/schema.prisma`       |
| API endpoints     | `documentation/api/`         |

---

## Reference Implementations

- **Courses**: `src/components/business-owner/courses/`
- **Users**: `src/components/business-owner/user/`

Check existing code for current patterns.
