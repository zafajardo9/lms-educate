# Implemented APIs

## Authentication

### POST /api/auth/[...all]
Better Auth handles authentication endpoints including login, logout, and session management.

---

## Users API

### GET /api/users
List all users with filtering and pagination.

**Authorization:** Business Owner only

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `search` (string) - Search by name or email
- `role` (string) - Filter by role
- `isActive` (boolean) - Filter by active status

### POST /api/users
Create a new user.

**Authorization:** Business Owner only

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "role": "STUDENT",
  "password": "password123",
  "isActive": true
}
```

### GET /api/users/:id
Get user by ID.

**Authorization:** Business Owner or the user themselves

### PUT /api/users/:id
Update user.

**Authorization:** Business Owner or the user themselves (role changes require Business Owner)

### DELETE /api/users/:id
Delete user.

**Authorization:** Business Owner only

### GET /api/users/:id/profile
Get user profile.

**Authorization:** Business Owner or the user themselves

### PUT /api/users/:id/profile
Update user profile.

**Authorization:** Business Owner or the user themselves

---

## Courses API

### GET /api/courses
List courses with filtering and pagination.

**Authorization:** All authenticated users (role-based filtering applied)

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `search` (string) - Search in title and description
- `category` (string) - Filter by category
- `level` (string) - Filter by level
- `lecturerId` (string) - Filter by lecturer ID
- `isPublished` (boolean) - Filter by published status
- `tags` (string) - Comma-separated tags

### POST /api/courses
Create a new course.

**Authorization:** Lecturer or Business Owner

**Request Body:**
```json
{
  "title": "Introduction to Web Development",
  "description": "Learn the basics of web development",
  "level": "BEGINNER",
  "category": "Web Development",
  "tags": ["html", "css", "javascript"],
  "price": 99.99,
  "thumbnail": "https://example.com/thumbnail.jpg"
}
```

### GET /api/courses/:id
Get course by ID with full details.

**Authorization:** 
- Business Owner: All courses
- Lecturer: Own courses
- Student: Published courses

### PUT /api/courses/:id
Update course.

**Authorization:** Course owner (lecturer) or Business Owner

### DELETE /api/courses/:id
Delete course.

**Authorization:** Course owner (lecturer) or Business Owner

**Note:** Cannot delete courses with active enrollments

---

## Course Enrollment API

### POST /api/courses/:id/enroll
Enroll student in course.

**Authorization:** Student only

**Note:** Course must be published and student must not already be enrolled

### DELETE /api/courses/:id/enroll
Unenroll student from course.

**Authorization:** Student only

---

## Notes

- All implemented APIs use Mongoose for database operations
- Authentication is handled via Better Auth
- Role-based access control is implemented
- Organization scoping is planned but not yet implemented

