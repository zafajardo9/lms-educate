# LMS Platform Documentation

Opinionated, senior-level guidelines for building and reviewing code in this repo. The documentation set is intentionally lean—only three markdown files drive our conventions:

1. **README (this file)** – platform overview, folder structure, and documentation map
2. **API_CODING_PRACTICES.md** – how we design, secure, and ship API routes + services
3. **FRONTEND_CODING_PRACTICES.md** – how we build UI (Server Components first, tasteful client logic second)

Everything else lives close to the code (Prisma schema, component examples, tests).

---

## 🚀 Platform at a Glance

| Topic      | Summary                                         |
| ---------- | ----------------------------------------------- |
| Framework  | Next.js 15 (App Router) + TypeScript            |
| Database   | PostgreSQL (Prisma ORM). No Mongo, no Mongoose. |
| Auth       | Better Auth (session cookies).                  |
| Styling    | Tailwind CSS + shadcn/ui primitives.            |
| Validation | Zod everywhere inputs exist.                    |
| Testing    | Vitest.                                         |

> ✅ **Single source of truth** is the codebase. Docs simply describe the required patterns.

---

## 📂 Folder Structure & Placement Rules

```
src/
├── app/
│   ├── api/                  # Route handlers (thin controllers)
│   ├── dashboard/            # Authenticated pages (Server Components preferred)
│   └── ...
├── components/               # UI building blocks (ui/, dashboard/, etc.)
├── lib/
│   ├── actions/
│   │   ├── api/              # Prisma-only services invoked by /api routes
│   │   │   ├── *.ts          # Domain-specific services (courses.ts, users.ts, ...)
│   │   │   └── types/        # DTOs, SessionUser, pagination, etc.
│   │   │       └── index.ts  # Barrel export (import { SessionUser } from '@/lib/actions/api/types')
│   │   └── ...               # Other server actions (forms, mutations)
│   ├── services/             # Optional business utilities shared by UI/actions
│   ├── auth.ts               # Better Auth config
│   ├── prisma.ts             # Prisma client singleton
│   └── middleware/           # Auth helpers for edge/runtime
├── types/                    # Global app/domain types (shared between UI + API)
└── prisma/schema.prisma      # DB schema + enums
```

**Placement / naming best practices**

- **Types**: if a type is API-service specific, place it in `src/lib/actions/api/types/` and export via the local `index.ts` (or `types.ts` barrel). If it’s application-wide, park it in `src/types/`.
- **index.ts barrels**: create one inside folders with multiple exports (e.g., `types/`, component groups, hooks). Never import deeply from sibling files in other packages.
- **File names**: `kebab-case` for routes, `PascalCase` for components, `camelCase` for utilities.

---

## 📚 Documentation Map

| Doc                              | Purpose                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| **README**                       | You are here. Directory map, tooling, doc links.                                          |
| **API_CODING_PRACTICES.md**      | Senior-level API patterns: layering, Prisma rules, security checklists, response shapes.  |
| **FRONTEND_CODING_PRACTICES.md** | UI guidelines: Server Components-first, client boundary rules, data fetching, tone of UI. |
| **api/API_REFERENCE.md**         | Endpoint-by-endpoint reference (request/response examples).                               |

All other previous markdown guides have been removed—if something is missing, add it to one of the three docs above.

---

## 🔐 Core Engineering Tenets

1. **PostgreSQL + Prisma everywhere** – never ship Mongo/Mongoose code.
2. **Thin controllers, fat services** – `/app/api/*` only parses requests + calls the corresponding `lib/actions/api/*.ts` service.
3. **Types live near behavior** – API DTOs inside `lib/actions/api/types`, global types in `src/types`, both exported via `index.ts` for ergonomic imports.
4. **Security-by-default** – each route/service enforces auth, roles, organization scoping, and validation (details in API guide).
5. **Server Components first** – UI defaults to server rendering; opt into client components when interactivity demands it.

---

## ⚙️ Setup & Tooling

```bash
npm install
cp .env.example .env.local   # configure DATABASE_URL, auth secrets
npx prisma migrate dev
npx prisma generate
npm run dev
```

Other scripts: `npm run lint`, `npm run test`, `npm run seed`, `npx prisma studio`.

---

## 🧭 When You Need Answers

| Need                             | Where                                |
| -------------------------------- | ------------------------------------ |
| Folder placement?                | README (above)                       |
| How to write a route?            | API_CODING_PRACTICES.md              |
| How to build a client component? | FRONTEND_CODING_PRACTICES.md         |
| Endpoint contract?               | `documentation/api/API_REFERENCE.md` |
| Database shape?                  | `prisma/schema.prisma`               |

---

## 📞 Getting Help

1. Read the three docs.
2. Check existing code (courses/users APIs showcase the current patterns).
3. Ask for clarification in code review comments.

> **Reminder:** If you introduce a new folder with multiple exports, add an `index.ts` (or `types.ts`) to keep imports clean.

---

**Last updated**: Maintained together with the codebase. If a rule changes, update this README and the relevant practice doc in the same PR.
