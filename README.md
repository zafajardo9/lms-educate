# LMS Platform

A comprehensive, **multi-tenant** Learning Management System built with Next.js 15, MongoDB, and Better Auth. Designed for companies that want to operate their own branded academies with collaborative course creation and cohort-based learning.

## Features

### Multi-Tenant Architecture
- **Organizations**: Each client organization gets a dedicated, branded workspace
- **Organization Branding**: Custom logos, colors, and branding per organization
- **Billing Plans**: Support for FREE, PRO, GROWTH, and ENTERPRISE plans
- **Organization Management**: Invite users, manage roles, and control access

### Role-Based Access Control
- **Organization-Level Roles**: Owner, Admin, Instructor, Reviewer, Learner
- **Course-Level Roles**: Course Owner, Lead Instructor, Instructor, TA, Reviewer
- **Collaborative Courses**: Multiple instructors can collaborate on courses with fine-grained permissions
- **Invitation System**: Email-based invitations with role assignments

### Course Management
- **Hierarchical Structure**: Courses with sub-courses and lessons
- **Collaborative Creation**: Multiple instructors can work on the same course
- **Cohort-Based Learning**: Create cohorts for group-based learning experiences
- **Course Publishing**: Draft and publish workflow for course content

### Learning Features
- **Quiz System**: Create quizzes with multiple question types (Multiple Choice, True/False, Short Answer, Essay)
- **Progress Tracking**: Monitor student progress at course, lesson, and quiz levels
- **File Upload**: Support for various file formats (videos, documents, images)
- **Enrollment Management**: Direct course enrollment or cohort-based enrollment

### User Experience
- **Responsive Design**: Works on desktop and mobile devices
- **Organization Isolation**: Data is scoped to organizations for security and privacy
- **Analytics**: Track progress and performance within organization context

## Tech Stack

### Full-Stack Framework
- Next.js 15 with App Router
- React 18+ with Server Components
- TypeScript for type safety
- Tailwind CSS for styling
- React Hook Form for form management

### Backend/API
- Next.js API Routes (App Router)
- MongoDB with Mongoose ODM
- Better Auth for authentication
- Zod for request validation
- Multer for file uploads

### Database
- MongoDB for primary data storage
- Mongoose ODM for data modeling
- Prisma schema available at `prisma/schema.prisma` for reference
- Better Auth session management
- Multi-tenant data isolation via organization scoping

## Project Structure

```
lms-platform/
├── src/
│   ├── app/                 # Next.js App Router pages and layouts
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Dashboard pages
│   │   └── globals.css     # Global styles
│   ├── components/         # Reusable UI components
│   ├── lib/                # Utility libraries and configurations
│   │   ├── models/         # MongoDB models
│   │   └── mongodb.ts      # Database connection
│   └── types/              # TypeScript type definitions
├── scripts/                # Utility scripts (seeding, etc.)
└── package.json           # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lms-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your MongoDB URI and other configurations
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system:
   ```bash
   # On macOS with Homebrew:
   brew services start mongodb-community
   
   # Or start manually:
   mongod
   ```

5. **Seed the database with demo users**
   ```bash
   npm run seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   This will start the Next.js development server on http://localhost:3000

7. **Access the application**
   - Application: http://localhost:3000
   - API Routes: http://localhost:3000/api/*

8. **Demo Login Credentials**
   - **👑 Business Owner**: admin@lms.com / admin123
   - **👨‍🏫 Lecturer**: lecturer@lms.com / lecturer123
   - **👨‍🎓 Student**: student@lms.com / student123

## Multi-Tenant Architecture

The platform supports multiple organizations, each with:
- **Isolated Data**: All courses, users, and content are scoped to organizations
- **Custom Branding**: Organizations can customize logos, colors, and branding
- **Role Management**: Organization owners can assign roles (Admin, Instructor, Reviewer, Learner)
- **Collaborative Courses**: Multiple instructors can collaborate on courses with different roles
- **Cohorts**: Organizations can create cohorts for group-based learning

### Organization Roles
- **Owner**: Full control over organization settings, billing, and members
- **Admin**: Manage members, instructors, and organization content
- **Instructor**: Can create and manage courses within the organization
- **Reviewer**: Can review course content and provide feedback
- **Learner**: Can enroll in courses and access learning materials

### Course Instructor Roles
- **Course Owner**: Full control over the course
- **Lead Instructor**: Primary instructor responsible for course delivery
- **Instructor**: Can create and edit course content
- **TA (Teaching Assistant)**: Can assist with course management
- **Reviewer**: Can review course content and provide feedback

### Available Scripts

- `npm run dev` - Start the Next.js development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run seed` - Seed the database with demo data

## Development Workflow

This project follows a spec-driven development approach. The implementation is broken down into manageable tasks:

### Completed ✅
1. **Project Setup** ✅ - Basic project structure and dependencies
2. **Database Schema** ✅ - MongoDB models with multi-tenant organization support
3. **Authentication System** ✅ - Better Auth integration
4. **User Management** ✅ - CRUD operations for users
5. **Course Management** ✅ - Course creation and management (basic)

### In Progress / Planned
6. **Organization Management** 📋 - Multi-tenant organization CRUD, branding, member management
7. **Organization Memberships** 📋 - Invitation system, role management
8. **Course Instructors** 📋 - Collaborative course creation with role-based permissions
9. **Content Structure** 📋 - Hierarchical content organization (sub-courses, lessons)
10. **Cohorts** 📋 - Cohort creation and management for group-based learning
11. **File Upload** 📋 - Media and document handling
12. **Quiz System** 📋 - Quiz creation and management
13. **Quiz Taking** 📋 - Student quiz interface
14. **Analytics** 📋 - Progress tracking and reporting (organization-scoped)
15. **State Management** 📋 - TanStack Query integration
16. **UI/UX** 📋 - Role-based interfaces with organization context
17. **Error Handling** 📋 - Comprehensive error management
18. **Security** 📋 - Security best practices with multi-tenant isolation
19. **Performance** 📋 - Optimization and caching
20. **Testing** 📋 - Comprehensive test suite
21. **Deployment** 📋 - Production deployment setup

## API Endpoints

### Authentication
- `POST /api/auth/[...all]` - Better Auth catch-all route (login, logout, session)

### Users
- `GET /api/users` - List users (organization-scoped)
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/:id/profile` - Get user profile
- `PUT /api/users/:id/profile` - Update user profile

### Organizations (Planned)
- `GET /api/organizations` - List organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/:id` - Get organization details
- `PUT /api/organizations/:id` - Update organization
- `GET /api/organizations/:id/members` - List organization members
- `POST /api/organizations/:id/members/invite` - Invite member
- `PUT /api/organizations/:id/members/:userId` - Update member role

### Courses
- `GET /api/courses` - List courses (organization-scoped)
- `POST /api/courses` - Create course
- `GET /api/courses/:id` - Get course details
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course
- `POST /api/courses/:id/enroll` - Enroll in course

### Course Instructors (Planned)
- `GET /api/courses/:id/instructors` - List course instructors
- `POST /api/courses/:id/instructors` - Add instructor to course
- `PUT /api/courses/:id/instructors/:userId` - Update instructor role
- `DELETE /api/courses/:id/instructors/:userId` - Remove instructor

### Cohorts (Planned)
- `GET /api/organizations/:id/cohorts` - List cohorts
- `POST /api/organizations/:id/cohorts` - Create cohort
- `GET /api/cohorts/:id` - Get cohort details
- `PUT /api/cohorts/:id` - Update cohort
- `POST /api/cohorts/:id/enroll` - Enroll in cohort

### Quizzes (Planned)
- `GET /api/quizzes` - List quizzes (organization-scoped)
- `POST /api/quizzes` - Create quiz
- `GET /api/quizzes/:id` - Get quiz details
- `POST /api/quizzes/:id/submit` - Submit quiz answers

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Contributing

1. Follow the existing code style and conventions
2. Write tests for new features
3. Update documentation as needed
4. Use TypeScript for type safety
5. Follow the established project structure

## License

This project is licensed under the MIT License.