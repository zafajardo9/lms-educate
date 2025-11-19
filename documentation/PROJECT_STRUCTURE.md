# Project Structure Guide

This document maps out the codebase organization to help you locate logic and components quickly.

## 📂 High-Level Structure

```
lms-platform/
├── src/                  # Source code
│   ├── app/              # Next.js App Router (Pages & API)
│   ├── components/       # React Components
│   ├── lib/              # Core Logic & Utilities
│   └── types/            # TypeScript Definitions
├── prisma/               # Database Schema & Migrations
├── public/               # Static Assets
└── documentation/        # Project Documentation
```

## 🏗️ `src/app` (Routes)

We follow a **Role-Based Routing** pattern.

-   **`api/`**: Backend endpoints.
    -   `auth/`: Authentication routes (Better Auth).
    -   `users/`, `courses/`: REST API resources.
-   **`auth/`**: Public authentication pages.
    -   `login/`: Sign-in page.
    -   `register/`: Sign-up page.
-   **`business-owner/`**: Protected routes for Business Owners.
    -   `dashboard/`: Main analytics and management view.
-   **`lecturer/`**: Protected routes for Instructors.
    -   `courses/`: Course authoring tools.
-   **`student/`**: Protected routes for Learners.
    -   `my-courses/`: Enrolled content.

## 🧩 `src/components` (UI)

-   **`ui/`**: Reusable, atomic components (Buttons, Inputs, Cards). Mostly from shadcn/ui.
-   **`dashboard/`**: Complex widgets for dashboard views (Charts, Stats Cards).
-   **`courses/`**: Components specific to course rendering (Video Player, Lesson List).
-   **`forms/`**: Reusable form layouts and validators.

## 🧠 `src/lib` (Logic)

This is where the business logic lives. **Keep `app/` thin and put logic here.**

-   **`actions/`**: Server Actions for data mutations.
    -   `courses.ts`: Create/Update course logic.
    -   `users.ts`: User management logic.
-   **`auth.ts`**: Better Auth configuration and session helpers.
-   **`prisma.ts`**: Singleton database client.
-   **`utils.ts`**: Common helper functions (formatting, class merging).

## 🗄️ `prisma/` (Database)

-   **`schema.prisma`**: The single source of truth for the data model.
-   **`migrations/`**: History of database changes.
-   **`seed.ts`**: Script to populate the DB with initial data.

## 📚 `documentation/`

-   `CONSOLIDATED_GUIDE.md`: The main entry point for developers.
-   `SYSTEM_OVERVIEW.md`: High-level architecture.
-   `DATABASE_SCHEMA.md`: Data model reference.
-   `PROJECT_STRUCTURE.md`: This file.
