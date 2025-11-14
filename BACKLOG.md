# Project Backlog

This backlog captures the key tasks required to complete the PostgreSQL + Prisma migration and follow-up work. Items are grouped by priority so you can work top-down.

## Priority 1 – Database & ORM Migration

- [ ] Replace the Prisma datasource with PostgreSQL (`provider = "postgresql"`, `DATABASE_URL` env). Regenerate the schema using relational IDs (UUIDs or serials) instead of Mongo `_id` mappings.
- [ ] Install and configure Prisma end-to-end (`@prisma/client`, `prisma` CLI). Remove `mongoose` from dependencies and delete `src/lib/mongodb.ts` plus other Mongo helpers.
- [ ] Model the core domain (Users, Profiles, Organizations, Courses, SubCourses, Lessons, Enrollments, Quizzes, QuizSubmissions, LessonProgress) directly in `schema.prisma`, ensuring relations mirror `src/types`.

## Priority 2 – Data Access Layer

- [ ] Create a reusable Prisma client singleton (e.g., `src/lib/prisma.ts`) and update Better Auth + server code to import it.
- [ ] Replace all Mongoose model usages with Prisma queries across API routes, server actions, and server components (users, courses, enrollments, quizzes, organizations, dashboards).
- [ ] Re-implement any Mongoose-specific logic (virtuals, pre-save hooks) as Prisma relations plus explicit service utilities (e.g., enrollment progress calculations).

## Priority 3 – Auth & User Management

- [ ] Update `src/lib/auth.ts` to point Better Auth at the PostgreSQL database (either via built-in Prisma adapter or custom callbacks using Prisma) and drop the dual-write to the Mongoose `User` model.
- [ ] Ensure session callbacks and authorization helpers (`src/lib/middleware/auth.ts`) read user state from Prisma, including `role`/`isActive` flags.

## Priority 4 – Tooling, Seeds, and Testing

- [ ] Rebuild `scripts/seed.ts` to use Prisma transactions and align with the new schema; provide baseline users/organizations/courses.
- [ ] Update Vitest test setup/mocks to stub Prisma instead of Mongoose (`src/test/setup.ts`, model tests, API tests).
- [ ] Refresh environment examples (`.env.example`) and documentation to describe the PostgreSQL workflow (running `prisma migrate dev`, seeding, etc.).

## Priority 5 – Nice-to-Have Follow-ups

- [ ] Add automated database migrations to CI/CD (e.g., `prisma migrate deploy`).
- [ ] Introduce Prisma-level Zod schemas or `@prisma/client` types to tighten input validation.
- [ ] Instrument critical database flows with logging/metrics once the migration is stable.
