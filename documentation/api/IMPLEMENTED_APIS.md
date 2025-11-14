# Implemented APIs

## Authentication

### POST /api/auth/[...all]

Better Auth handles authentication endpoints including login, logout, and session management.

---

## Quizzes API

### GET /api/quizzes

List quizzes with pagination and filtering.

**Authorization:**

- Business Owner & Lecturer: all quizzes (respecting provided filters)
- Student: only published quizzes

**Query Parameters:**

- `courseId` (string) - Filter by course
- `isPublished` (boolean) - Filter by publish status
- `search` (string) - Search in title or description
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 50)

**Response:**

```json
{
  "success": true,
  "data": [
    /* quizzes */
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

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

## Organizations API

### GET /api/organizations

List organizations the authenticated user can access.

**Authorization:**

- Business Owner: all organizations
- Other roles: limited to organizations they own or have accepted memberships in

**Query Parameters:**

- `search` (string) - Search by name or description
- `plan` (string) - Filter by subscription plan
- `status` (string) - Filter by organization status
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 50)

### POST /api/organizations

Create a new organization and add the creator as owner.

**Authorization:** Business Owner only

**Request Body:**

```json
{
  "name": "Acme Academy",
  "slug": "acme-academy", // optional, auto-generated from name when omitted
  "description": "Corporate training org",
  "logoUrl": "https://example.com/logo.png",
  "primaryColor": "#3B82F6",
  "secondaryColor": "#1E40AF",
  "timezone": "America/New_York",
  "locale": "en",
  "plan": "FREE",
  "status": "ACTIVE",
  "metadata": { "industry": "Technology" }
}
```

**Notes:**

- Slugs are deduplicated automatically
- Creator receives an `OrganizationRole.OWNER` membership with accepted invitation status

### GET /api/organizations/:id/members

List members and pending invitations for an organization.

**Authorization:**

- Business Owner
- Organization OWNER/ADMIN

**Query Parameters:**

- `role` (string) - Filter by member role
- `invitationStatus` (string) - Filter by invitation status
- `search` (string) - Search by member name/email or invitation email
- `page`, `limit`

### POST /api/organizations/:id/members

Invite a user (or add an existing account) to the organization.

**Authorization:** Business Owner, Organization OWNER/ADMIN

**Request Body:**

```json
{
  "email": "newuser@example.com",
  "role": "INSTRUCTOR",
  "message": "Welcome to the team!"
}
```

**Notes:**

- Existing users are auto-accepted and immediately added
- Invitations store optional messages in membership metadata

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
