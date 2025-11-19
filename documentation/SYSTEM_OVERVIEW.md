# System Overview

## 🎯 Platform Purpose

The **LMS Platform** is a comprehensive, **multi-tenant Learning Management System** designed to empower organizations to deliver world-class education. It enables companies, educational institutions, and training centers to operate their own branded academies within a single, unified infrastructure.

Unlike traditional single-tenant LMS solutions, our platform is built from the ground up for **isolation and scalability**, ensuring that each organization's data, users, and content remain strictly separated while sharing a robust underlying engine.

## 🧩 Core Modules

### 1. Identity & Access Management (IAM)
The foundation of the platform, handling who users are and what they can do.
-   **Multi-Tenancy**: Users can belong to multiple organizations with different roles in each.
-   **Role-Based Access Control (RBAC)**: Granular permissions at the System, Organization, and Course levels.
-   **Authentication**: Secure login via Email/Password (powered by Better Auth).

### 2. Organization Management
The container for all learning activities.
-   **Branding**: Custom logos, colors, and subdomains (planned) for each organization.
-   **Subscription Plans**: Tiered access (Free, Pro, Enterprise) controlling feature availability.
-   **Member Management**: Invitation systems and role assignment within the organization.

### 3. Course Management
The core learning engine.
-   **Hierarchical Content**: Courses are structured into **Sub-Courses** (Modules) and **Lessons**.
-   **Rich Media**: Support for video, text, and file attachments.
-   **Collaborative Authoring**: Multiple instructors can co-author courses with specific permissions (Lead, TA, etc.).

### 4. Learning Experience
How students interact with content.
-   **Cohorts**: Group-based learning with synchronized start/end dates.
-   **Progress Tracking**: Granular tracking of lesson completion and time spent.
-   **Enrollments**: Flexible enrollment options (Direct or Cohort-based).

### 5. Assessment Engine
Tools to verify knowledge.
-   **Quizzes**: Configurable assessments with time limits and passing scores.
-   **Question Bank**: Support for Multiple Choice, True/False, and Essay questions.
-   **Grading**: Automated grading for objective questions and manual review for subjective ones.

## 🔄 Key Workflows

### User Journey: The Student
1.  **Discovery**: Student visits the Organization's landing page.
2.  **Enrollment**: Student purchases a course or is invited to a Cohort.
3.  **Learning**: Student watches lessons, completes assignments, and tracks progress.
4.  **Assessment**: Student takes quizzes to verify understanding.
5.  **Completion**: Student completes all requirements and receives a certificate (planned).

### User Journey: The Instructor
1.  **Creation**: Instructor drafts a new Course and outlines the curriculum.
2.  **Content**: Instructor uploads videos and writes lesson content.
3.  **Assessment**: Instructor creates Quizzes to test knowledge.
4.  **Publishing**: Course is reviewed and published to the Organization's catalog.
5.  **Management**: Instructor monitors student progress and grades submissions.

### User Journey: The Business Owner
1.  **Setup**: Owner creates an Organization and configures branding.
2.  **Team**: Owner invites Instructors and Admins.
3.  **Strategy**: Owner defines the course catalog and pricing strategy.
4.  **Growth**: Owner monitors analytics to understand engagement and revenue.
