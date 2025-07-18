# LMS Platform

A comprehensive Learning Management System built with Next.js 15, MongoDB, and Better Auth.

## Features

- **Role-based Authentication**: Business Owner, Lecturer, and Student roles
- **Course Management**: Create hierarchical courses with sub-courses and lessons
- **Quiz System**: Create and manage quizzes with multiple question types
- **File Upload**: Support for various file formats (videos, documents, images)
- **Progress Tracking**: Monitor student progress and performance
- **Responsive Design**: Works on desktop and mobile devices

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
- Better Auth session management

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

### Available Scripts

- `npm run dev` - Start the Next.js development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run seed` - Seed the database with demo data

## Development Workflow

This project follows a spec-driven development approach. The implementation is broken down into manageable tasks:

1. **Project Setup** ✅ - Basic project structure and dependencies
2. **Database Schema** - MongoDB models and relationships
3. **Authentication System** - Better Auth integration
4. **User Management** - CRUD operations for users
5. **Course Management** - Course creation and management
6. **Content Structure** - Hierarchical content organization
7. **File Upload** - Media and document handling
8. **Quiz System** - Quiz creation and management
9. **Quiz Taking** - Student quiz interface
10. **Analytics** - Progress tracking and reporting
11. **State Management** - TanStack Query integration
12. **UI/UX** - Role-based interfaces
13. **Error Handling** - Comprehensive error management
14. **Security** - Security best practices
15. **Performance** - Optimization and caching
16. **Testing** - Comprehensive test suite
17. **Deployment** - Production deployment setup

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Courses
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course
- `GET /api/courses/:id` - Get course details
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Quizzes
- `GET /api/quizzes` - List quizzes
- `POST /api/quizzes` - Create quiz
- `GET /api/quizzes/:id` - Get quiz details
- `POST /api/quizzes/:id/submit` - Submit quiz answers

## Contributing

1. Follow the existing code style and conventions
2. Write tests for new features
3. Update documentation as needed
4. Use TypeScript for type safety
5. Follow the established project structure

## License

This project is licensed under the MIT License.