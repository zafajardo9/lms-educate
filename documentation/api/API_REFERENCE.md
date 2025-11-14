# Complete API Reference

> **✅ UPDATED**: All APIs now use PostgreSQL with Prisma ORM

## Table of Contents

- [Authentication](#authentication)
- [Courses API](#courses-api)
- [Enrollment API](#enrollment-api)
- [Users API](#users-api)
- [Organizations API](#organizations-api)
- [Security & Authorization](#security--authorization)

---

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints require authentication via Better Auth session cookies, except the authentication endpoints themselves.

### Login

```http
POST /api/auth/sign-in/email
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Logout

```http
POST /api/auth/sign-out
```

---

## Courses API

### List Courses

```http
GET /api/courses
```

**Authorization:** All authenticated users (role-based filtering applied)

**Query Parameters:**

| Parameter     | Type    | Description                      | Default |
| ------------- | ------- | -------------------------------- | ------- |
| `page`        | number  | Page number                      | 1       |
| `limit`       | number  | Items per page (max 100)         | 10      |
| `search`      | string  | Search in title/description      | -       |
| `category`    | string  | Filter by category               | -       |
| `level`       | string  | BEGINNER, INTERMEDIATE, ADVANCED | -       |
| `lecturerId`  | string  | Filter by lecturer ID            | -       |
| `isPublished` | boolean | Filter by published status       | -       |
| `tags`        | string  | Comma-separated tags             | -       |

**Role-Based Filtering:**

- **Business Owner**: All courses
- **Lecturer**: Only their own courses
- **Student**: Only published courses

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx123abc",
      "title": "Introduction to Web Development",
      "description": "Learn the basics",
      "level": "BEGINNER",
      "category": "Web Development",
      "tags": ["html", "css", "javascript"],
      "price": 99.99,
      "thumbnail": "https://example.com/thumb.jpg",
      "isPublished": true,
      "lecturerId": "user123",
      "organizationId": "org123",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "lecturer": {
        "id": "user123",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
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

**Security:**

- ✅ Authentication required
- ✅ Role-based filtering
- ✅ Organization scoping

---

### Create Course

```http
POST /api/courses
Content-Type: application/json
```

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

**Validation Rules:**

- `title`: Required, 1-200 characters
- `description`: Required, 1-2000 characters
- `level`: Required, enum: BEGINNER, INTERMEDIATE, ADVANCED
- `category`: Optional, max 100 characters
- `tags`: Optional, array of strings (max 50 chars each)
- `price`: Optional, minimum 0
- `thumbnail`: Optional, valid URL

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clx123abc",
    "title": "Introduction to Web Development",
    "description": "Learn the basics of web development",
    "level": "BEGINNER",
    "category": "Web Development",
    "tags": ["html", "css", "javascript"],
    "price": 99.99,
    "thumbnail": "https://example.com/thumbnail.jpg",
    "isPublished": false,
    "lecturerId": "user123",
    "organizationId": "org123",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "lecturer": {
      "id": "user123",
      "name": "John Doe",
      "email": "john@example.com"
    }
  },
  "message": "Course created successfully"
}
```

**Security:**

- ✅ Authentication required
- ✅ Role check (Lecturer or Business Owner)
- ✅ User must belong to an organization
- ✅ Input validation with Zod
- ✅ Auto-assigned to user's organization

**Error Responses:**

```json
// 401 Unauthorized
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}

// 403 Forbidden
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}

// 400 Bad Request (Validation Error)
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid course data",
    "details": [
      {
        "path": ["title"],
        "message": "Title is required"
      }
    ]
  }
}
```

---

### Get Course by ID

```http
GET /api/courses/:id
```

**Authorization:**

- **Business Owner**: All courses
- **Lecturer**: Own courses
- **Student**: Published courses only

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clx123abc",
    "title": "Introduction to Web Development",
    "description": "Learn the basics",
    "level": "BEGINNER",
    "category": "Web Development",
    "tags": ["html", "css", "javascript"],
    "price": 99.99,
    "thumbnail": "https://example.com/thumb.jpg",
    "isPublished": true,
    "lecturerId": "user123",
    "organizationId": "org123",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "lecturer": {
      "id": "user123",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "subCourses": [],
    "lessons": [],
    "enrollment": null
  }
}
```

**Security:**

- ✅ Authentication required
- ✅ Role-based access control
- ✅ Ownership verification
- ✅ Published status check for students

---

### Update Course

```http
PUT /api/courses/:id
Content-Type: application/json
```

**Authorization:** Course owner (lecturer) or Business Owner

**Request Body:**

```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "level": "INTERMEDIATE",
  "isPublished": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "clx123abc",
    "title": "Updated Title",
    "description": "Updated description",
    "level": "INTERMEDIATE",
    "isPublished": true
    // ... other fields
  },
  "message": "Course updated successfully"
}
```

**Security:**

- ✅ Authentication required
- ✅ Ownership verification
- ✅ Input validation

---

### Delete Course

```http
DELETE /api/courses/:id
```

**Authorization:** Course owner (lecturer) or Business Owner

**Response:**

```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

**Security:**

- ✅ Authentication required
- ✅ Ownership verification
- ✅ Prevents deletion if enrollments exist

**Error Response:**

```json
// 409 Conflict
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Cannot delete course with active enrollments"
  }
}
```

---

## Enrollment API

### Enroll in Course

```http
POST /api/courses/:id/enroll
```

**Authorization:** Student only

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "enroll123",
    "studentId": "user123",
    "courseId": "course123",
    "organizationId": "org123",
    "enrolledAt": "2024-01-01T00:00:00.000Z",
    "progress": 0,
    "student": {
      "id": "user123",
      "name": "Jane Student",
      "email": "jane@example.com"
    },
    "course": {
      "id": "course123",
      "title": "Introduction to Web Development",
      "description": "Learn the basics"
    }
  },
  "message": "Successfully enrolled in course"
}
```

**Security:**

- ✅ Authentication required
- ✅ Role check (Student only)
- ✅ Course must be published
- ✅ Prevents duplicate enrollments
- ✅ Auto-assigned to course's organization

**Error Responses:**

```json
// 403 Forbidden (Not a student)
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Only students can enroll in courses"
  }
}

// 404 Not Found
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Course not found"
  }
}

// 403 Forbidden (Course not published)
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Course is not available for enrollment"
  }
}

// 409 Conflict (Already enrolled)
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Already enrolled in this course"
  }
}
```

---

### Unenroll from Course

```http
DELETE /api/courses/:id/enroll
```

**Authorization:** Student only

**Response:**

```json
{
  "success": true,
  "message": "Successfully unenrolled from course"
}
```

**Security:**

- ✅ Authentication required
- ✅ Role check (Student only)
- ✅ Only own enrollments can be deleted

---

## Users API

### Get User by ID

```http
GET /api/users/:id
```

**Authorization:** Business Owner or the user themselves

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "STUDENT",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "profile": {
        "id": "profile123",
        "userId": "user123",
        "bio": "Student bio",
        "avatar": "https://example.com/avatar.jpg",
        "phone": "+1234567890",
        "dateOfBirth": "1990-01-01T00:00:00.000Z"
      }
    }
  }
}
```

**Security:**

- ✅ Authentication required
- ✅ Authorization check (Business Owner or self)
- ✅ Password excluded from response

---

### Update User

```http
PUT /api/users/:id
Content-Type: application/json
```

**Authorization:** Business Owner or the user themselves (role changes require Business Owner)

**Request Body:**

```json
{
  "name": "Updated Name",
  "role": "LECTURER",
  "isActive": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user123",
      "email": "user@example.com",
      "name": "Updated Name",
      "role": "LECTURER",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "profile": null
    }
  },
  "message": "User updated successfully"
}
```

**Security:**

- ✅ Authentication required
- ✅ Authorization check
- ✅ Role changes require Business Owner
- ✅ Input validation

---

### Delete User

```http
DELETE /api/users/:id
```

**Authorization:** Business Owner only

**Response:**

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Security:**

- ✅ Authentication required
- ✅ Business Owner only
- ✅ Cascading deletes handled by Prisma

---

### Get User Profile

```http
GET /api/users/:id/profile
```

**Authorization:** Business Owner or the user themselves

**Response:**

```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "profile123",
      "userId": "user123",
      "bio": "Student bio",
      "avatar": "https://example.com/avatar.jpg",
      "phone": "+1234567890",
      "dateOfBirth": "1990-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Security:**

- ✅ Authentication required
- ✅ Authorization check

---

### Update User Profile

```http
PUT /api/users/:id/profile
Content-Type: application/json
```

**Authorization:** Business Owner or the user themselves

**Request Body:**

```json
{
  "bio": "Updated bio",
  "avatar": "https://example.com/new-avatar.jpg",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01T00:00:00.000Z"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "profile123",
      "userId": "user123",
      "bio": "Updated bio",
      "avatar": "https://example.com/new-avatar.jpg",
      "phone": "+1234567890",
      "dateOfBirth": "1990-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "Profile updated successfully"
}
```

**Security:**

- ✅ Authentication required
- ✅ Authorization check
- ✅ Input validation
- ✅ Upsert operation (creates if doesn't exist)

---

## Security & Authorization

### Authentication

All endpoints require a valid Better Auth session cookie. The session is checked using:

```typescript
const session = await auth.api.getSession({ headers: request.headers });
```

### Authorization Levels

#### 1. **System-Level Roles**

- **BUSINESS_OWNER**: Full system access
- **LECTURER**: Can create and manage courses
- **STUDENT**: Can enroll in courses

#### 2. **Resource Ownership**

- Users can only modify their own resources unless they're Business Owners
- Lecturers can only manage their own courses
- Students can only manage their own enrollments

#### 3. **Organization Scoping**

- All resources are scoped to organizations
- Users must belong to an organization to create content
- Data isolation ensures cross-organization security

### Security Features

✅ **Authentication Required**: All endpoints check for valid session  
✅ **Role-Based Access Control**: Different permissions per role  
✅ **Input Validation**: Zod schemas validate all inputs  
✅ **SQL Injection Prevention**: Prisma uses parameterized queries  
✅ **Password Security**: Passwords never returned in responses  
✅ **Organization Isolation**: Data scoped by organizationId  
✅ **Ownership Verification**: Resource ownership checked before mutations  
✅ **Cascading Deletes**: Handled safely by Prisma schema

### Error Codes

| Code               | Status | Description                                 |
| ------------------ | ------ | ------------------------------------------- |
| `UNAUTHORIZED`     | 401    | Authentication required                     |
| `FORBIDDEN`        | 403    | Insufficient permissions                    |
| `NOT_FOUND`        | 404    | Resource not found                          |
| `VALIDATION_ERROR` | 400    | Invalid input data                          |
| `CONFLICT`         | 409    | Resource conflict (duplicate, dependencies) |
| `INTERNAL_ERROR`   | 500    | Server error                                |

---

## Rate Limiting

Currently not implemented. Consider adding rate limiting for production:

- Authentication endpoints: 5 requests/minute
- API endpoints: 100 requests/minute per user

## Pagination

All list endpoints support pagination:

```
GET /api/courses?page=2&limit=20
```

**Default**: page=1, limit=10  
**Maximum limit**: 100

## Testing

Use tools like:

- **Postman**: Import collection for testing
- **curl**: Command-line testing
- **Vitest**: Automated API tests

Example curl request:

```bash
curl -X POST http://localhost:3000/api/courses \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=your-token" \
  -d '{
    "title": "Test Course",
    "description": "Test description",
    "level": "BEGINNER"
  }'
```

---

## Next Steps

1. **Run migrations**: `npx prisma migrate dev`
2. **Seed database**: `npm run seed`
3. **Start server**: `npm run dev`
4. **Test APIs**: Use Postman or curl

For implementation details, see:

- [API Patterns (Prisma)](../API_PATTERNS_PRISMA.md)
- [Architecture](../ARCHITECTURE.md)
- [Authentication Patterns](../AUTHENTICATION_PATTERNS.md)
