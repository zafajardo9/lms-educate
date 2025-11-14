# API Documentation

## Overview

This LMS platform provides a RESTful API for managing learning content, users, organizations, courses, and student progress. All APIs require authentication via Better Auth session cookies.

**Base URL:** `http://localhost:3000/api`

## Authentication

All endpoints (except authentication) require a valid Better Auth session cookie.

- **Login:** `POST /api/auth/sign-in/email`
- **Logout:** `POST /api/auth/sign-out`

## Documentation

- **[API Reference](./API_REFERENCE.md)** ⭐ - **Complete API documentation with examples and security details**
- **[Implemented APIs](./IMPLEMENTED_APIS.md)** - APIs that are currently implemented and working
- **[Suggested APIs](./SUGGESTED_APIS.md)** - Recommended APIs to implement based on database schema

## Recent Updates

✅ **PostgreSQL Migration Complete**: All APIs now use Prisma ORM instead of Mongoose  
✅ **Security Enhanced**: Comprehensive authentication and authorization checks  
✅ **Documentation Updated**: Complete API reference with examples  
✅ **Organization Scoping**: All resources properly scoped to organizations

## Response Format

### Success

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error
