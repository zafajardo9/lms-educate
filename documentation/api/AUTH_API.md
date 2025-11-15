# Authentication API Documentation

## Overview

The Authentication API provides endpoints for user registration, login, logout, session management, and password changes. All endpoints follow RESTful conventions and return consistent JSON responses.

**Base URL**: `/api/auth`

---

## Endpoints

### 1. Sign Up (Register)

Create a new user account with role selection.

**Endpoint**: `POST /api/auth/signup`

**Authentication**: Not required

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "STUDENT"
}
```

**Request Schema**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | User's full name (min 2 characters) |
| email | string | Yes | Valid email address |
| password | string | Yes | Password (min 8 characters) |
| role | enum | Yes | One of: `BUSINESS_OWNER`, `LECTURER`, `STUDENT` |

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx123abc",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "STUDENT",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    "message": "Account created successfully. Please sign in."
  }
}
```

**Error Responses**:

**409 Conflict** - User already exists:
```json
{
  "success": false,
  "error": {
    "code": "USER_EXISTS",
    "message": "An account with this email already exists"
  }
}
```

**400 Bad Request** - Validation error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}
```

---

### 2. Sign In (Login)

Authenticate a user and create a session.

**Endpoint**: `POST /api/auth/signin`

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Request Schema**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password |

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx123abc",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "STUDENT",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    "message": "Sign in successful"
  }
}
```

**Error Responses**:

**401 Unauthorized** - Invalid credentials:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

**403 Forbidden** - Account disabled:
```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_DISABLED",
    "message": "Your account has been disabled. Please contact support."
  }
}
```

---

### 3. Sign Out (Logout)

End the current user session.

**Endpoint**: `POST /api/auth/signout`

**Authentication**: Required (session cookie)

**Request Body**: None

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Signed out successfully"
}
```

**Error Responses**:

**401 Unauthorized** - No active session:
```json
{
  "success": false,
  "error": {
    "code": "NO_SESSION",
    "message": "No active session found"
  }
}
```

---

### 4. Get Session

Get current user session and profile information.

**Endpoint**: `GET /api/auth/session`

**Authentication**: Required (session cookie)

**Request Body**: None

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx123abc",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "STUDENT",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "profile": {
        "bio": "Learning enthusiast",
        "avatar": "https://example.com/avatar.jpg",
        "phone": "+1234567890",
        "dateOfBirth": "1990-01-01T00:00:00Z"
      }
    },
    "session": {
      "expiresAt": "2024-01-22T10:30:00Z"
    }
  }
}
```

**Error Responses**:

**401 Unauthorized** - No active session:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No active session"
  }
}
```

**403 Forbidden** - Account disabled:
```json
{
  "success": false,
  "error": {
    "code": "ACCOUNT_DISABLED",
    "message": "Your account has been disabled"
  }
}
```

**404 Not Found** - User not found:
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found"
  }
}
```

---

### 5. Change Password

Change the current user's password.

**Endpoint**: `POST /api/auth/change-password`

**Authentication**: Required (session cookie)

**Request Body**:
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newSecurePassword456",
  "confirmPassword": "newSecurePassword456"
}
```

**Request Schema**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| currentPassword | string | Yes | User's current password |
| newPassword | string | Yes | New password (min 8 characters) |
| confirmPassword | string | Yes | Must match newPassword |

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses**:

**401 Unauthorized** - Invalid current password:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PASSWORD",
    "message": "Current password is incorrect"
  }
}
```

**400 Bad Request** - Same password:
```json
{
  "success": false,
  "error": {
    "code": "SAME_PASSWORD",
    "message": "New password must be different from current password"
  }
}
```

**400 Bad Request** - Passwords don't match:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "confirmPassword",
        "message": "Passwords do not match"
      }
    ]
  }
}
```

---

## Better Auth Integration

The authentication system uses **Better Auth** for session management. The main handler is at:

**Endpoint**: `GET/POST /api/auth/[...all]`

This catch-all route handles Better Auth's internal operations including:
- Session creation and validation
- Cookie management
- Token refresh
- OAuth flows (if configured)

**Note**: You typically don't call this endpoint directly. Use the specific endpoints above instead.

---

## User Roles

The system supports three user roles:

| Role | Value | Description | Default Dashboard |
|------|-------|-------------|-------------------|
| Business Owner | `BUSINESS_OWNER` | Full platform access, manage organizations and users | `/business-owner/dashboard` |
| Lecturer | `LECTURER` | Create and manage courses | `/lecturer/dashboard` |
| Student | `STUDENT` | Enroll in courses and learn | `/student/dashboard` |

---

## Authentication Flow

### Registration Flow

```
1. User fills registration form with role selection
   ↓
2. POST /api/auth/signup
   ↓
3. Server validates input
   ↓
4. Server creates user in database
   ↓
5. Server creates default user profile
   ↓
6. User redirected to login page
```

### Login Flow

```
1. User enters credentials
   ↓
2. POST /api/auth/signin
   ↓
3. Server validates credentials
   ↓
4. Server checks account status
   ↓
5. Better Auth creates session
   ↓
6. User redirected to role-specific dashboard
   - BUSINESS_OWNER → /business-owner/dashboard
   - LECTURER → /lecturer/dashboard
   - STUDENT → /student/dashboard
```

### Session Management

```
1. Client makes authenticated request
   ↓
2. Middleware checks session cookie
   ↓
3. Better Auth validates session
   ↓
4. Request proceeds if valid
   OR
   User redirected to /auth/login if invalid
```

---

## Security Features

### Password Security
- Minimum 8 characters required
- Hashed using bcrypt (10 rounds)
- Never returned in API responses
- Validated on both client and server

### Session Security
- HTTP-only cookies
- 7-day expiration
- Automatic refresh after 1 day
- Secure flag in production

### Account Protection
- Active status checking
- Email uniqueness validation
- Role-based access control
- Middleware route protection

---

## Client-Side Usage

### Using Better Auth Client

```typescript
import { signIn, signUp, signOut, useSession } from '@/lib/auth-client'

// Sign up
const { data, error } = await signUp.email({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
  role: 'STUDENT',
})

// Sign in
const { data, error } = await signIn.email({
  email: 'user@example.com',
  password: 'password123',
})

// Sign out
await signOut()

// Get session in component
const { data: session, isPending } = useSession()
```

### Using Fetch API

```typescript
// Sign up
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'STUDENT',
  }),
})

// Sign in
const response = await fetch('/api/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'password123',
  }),
})

// Get session
const response = await fetch('/api/auth/session')
const { data } = await response.json()
console.log('Current user:', data.user)
```

---

## Testing

### Demo Accounts

```
Business Owner:
  Email: admin@lms.com
  Password: admin123

Lecturer:
  Email: lecturer@lms.com
  Password: lecturer123

Student:
  Email: student@lms.com
  Password: student123
```

### cURL Examples

**Sign Up**:
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "STUDENT"
  }'
```

**Sign In**:
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Get Session**:
```bash
curl http://localhost:3000/api/auth/session \
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN"
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `USER_EXISTS` | 409 | Email already registered |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `ACCOUNT_DISABLED` | 403 | User account is disabled |
| `NO_SESSION` | 401 | No active session found |
| `UNAUTHORIZED` | 401 | Authentication required |
| `USER_NOT_FOUND` | 404 | User doesn't exist |
| `INVALID_PASSWORD` | 401 | Current password is wrong |
| `SAME_PASSWORD` | 400 | New password same as old |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `INTERNAL_ERROR` | 500 | Server error occurred |

---

## Best Practices

1. **Always validate on server**: Never trust client-side validation alone
2. **Use HTTPS in production**: Protect credentials in transit
3. **Handle errors gracefully**: Show user-friendly messages
4. **Implement rate limiting**: Prevent brute force attacks (TODO)
5. **Log authentication events**: Track sign-ins and failures
6. **Use strong passwords**: Enforce minimum requirements
7. **Clear sessions on logout**: Invalidate tokens properly
8. **Check session expiry**: Refresh or redirect as needed

---

## Related Documentation

- [Role-Based Routing](../ROLE_BASED_ROUTING.md)
- [API Coding Practices](../API_CODING_PRACTICES.md)
- [Frontend Coding Practices](../FRONTEND_CODING_PRACTICES.md)
- [Consolidated Guide](../CONSOLIDATED_GUIDE.md)

