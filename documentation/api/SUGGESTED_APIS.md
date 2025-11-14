# Suggested APIs

Based on the database schema, here are the recommended APIs to implement for a complete LMS platform.

## Organizations API

### GET /api/organizations
List organizations (scoped to user's memberships or all for Business Owner).

**Models:** `Organization`

**Query Parameters:**
- `page`, `limit`, `search`, `plan`, `status`

### POST /api/organizations
Create a new organization.

**Models:** `Organization`, `OrganizationMembership`

**Request Body:**
```json
{
  "name": "Acme Corporation Academy",
  "slug": "acme-corp",
  "description": "Corporate training academy",
  "logoUrl": "https://example.com/logo.png",
  "primaryColor": "#3B82F6",
  "secondaryColor": "#1E40AF",
  "timezone": "America/New_York",
  "locale": "en",
  "plan": "FREE"
}
```

### GET /api/organizations/:id
Get organization by ID.

### PUT /api/organizations/:id
Update organization (Organization Owner only).

### DELETE /api/organizations/:id
Delete organization (Organization Owner only).

---

## Organization Memberships API

### GET /api/organizations/:id/members
List organization members.

**Models:** `OrganizationMembership`, `User`

**Query Parameters:**
- `page`, `limit`, `role`, `search`, `invitationStatus`

### POST /api/organizations/:id/members/invite
Invite user to organization via email.

**Models:** `OrganizationMembership`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "role": "INSTRUCTOR",
  "message": "Welcome to our organization!"
}
```

### PUT /api/organizations/:id/members/:userId
Update organization member role.

**Models:** `OrganizationMembership`

### DELETE /api/organizations/:id/members/:userId
Remove member from organization.

**Models:** `OrganizationMembership`

### POST /api/organizations/:id/members/:userId/accept-invitation
Accept organization invitation.

**Models:** `OrganizationMembership`

### POST /api/organizations/:id/members/:userId/decline-invitation
Decline organization invitation.

**Models:** `OrganizationMembership`

---

## Course Instructors API

### GET /api/courses/:id/instructors
List course instructors.

**Models:** `CourseInstructor`, `User`

### POST /api/courses/:id/instructors
Add instructor to course.

**Models:** `CourseInstructor`

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439015",
  "role": "INSTRUCTOR",
  "permissions": {
    "canEdit": true,
    "canPublish": false,
    "canManageInstructors": false
  }
}
```

### PUT /api/courses/:id/instructors/:userId
Update course instructor role/permissions.

**Models:** `CourseInstructor`

### DELETE /api/courses/:id/instructors/:userId
Remove instructor from course.

**Models:** `CourseInstructor`

---

## Sub-Courses API

### GET /api/courses/:id/sub-courses
List all sub-courses for a course.

**Models:** `SubCourse`

**Query Parameters:**
- `isPublished`

### POST /api/courses/:id/sub-courses
Create a new sub-course.

**Models:** `SubCourse`

**Request Body:**
```json
{
  "title": "HTML Basics",
  "description": "Learn HTML fundamentals",
  "order": 1,
  "isPublished": false
}
```

### GET /api/sub-courses/:id
Get sub-course by ID.

**Models:** `SubCourse`

### PUT /api/sub-courses/:id
Update sub-course.

**Models:** `SubCourse`

### DELETE /api/sub-courses/:id
Delete sub-course.

**Models:** `SubCourse`

---

## Lessons API

### GET /api/sub-courses/:id/lessons
List all lessons in a sub-course.

**Models:** `Lesson`

### GET /api/courses/:id/lessons
List all lessons in a course (direct lessons, not in sub-courses).

**Models:** `Lesson`

### POST /api/lessons
Create a new lesson.

**Models:** `Lesson`

**Request Body:**
```json
{
  "title": "Introduction to HTML",
  "content": "HTML is a markup language...",
  "courseId": "507f1f77bcf86cd799439020",
  "subCourseId": "507f1f77bcf86cd799439025",
  "videoUrl": "https://example.com/video.mp4",
  "attachments": ["https://example.com/file.pdf"],
  "order": 1,
  "duration": 30,
  "isPublished": false
}
```

### GET /api/lessons/:id
Get lesson by ID.

**Models:** `Lesson`

### PUT /api/lessons/:id
Update lesson.

**Models:** `Lesson`

### DELETE /api/lessons/:id
Delete lesson.

**Models:** `Lesson`

### PUT /api/lessons/reorder
Reorder lessons.

**Models:** `Lesson`

**Request Body:**
```json
{
  "lessonIds": ["507f1f77bcf86cd799439026", "507f1f77bcf86cd799439027"]
}
```

---

## Quizzes API

### GET /api/quizzes
List quizzes with filtering.

**Models:** `Quiz`

**Query Parameters:**
- `courseId`, `isPublished`, `organizationId`

### POST /api/quizzes
Create a new quiz.

**Models:** `Quiz`

**Request Body:**
```json
{
  "title": "HTML Quiz",
  "description": "Test your HTML knowledge",
  "courseId": "507f1f77bcf86cd799439020",
  "timeLimit": 30,
  "maxAttempts": 3,
  "passingScore": 70,
  "isPublished": false
}
```

### GET /api/quizzes/:id
Get quiz by ID with questions.

**Models:** `Quiz`, `Question`

### PUT /api/quizzes/:id
Update quiz.

**Models:** `Quiz`

### DELETE /api/quizzes/:id
Delete quiz.

**Models:** `Quiz`

---

## Questions API

### GET /api/quizzes/:id/questions
List all questions for a quiz.

**Models:** `Question`

### POST /api/quizzes/:id/questions
Add question to quiz.

**Models:** `Question`

**Request Body:**
```json
{
  "type": "MULTIPLE_CHOICE",
  "question": "What does HTML stand for?",
  "options": [
    "HyperText Markup Language",
    "HighText Markup Language",
    "HyperText Markdown Language"
  ],
  "correctAnswer": "HyperText Markup Language",
  "explanation": "HTML stands for HyperText Markup Language",
  "points": 10,
  "order": 1
}
```

### PUT /api/questions/:id
Update question.

**Models:** `Question`

### DELETE /api/questions/:id
Delete question.

**Models:** `Question`

---

## Quiz Submissions API

### POST /api/quizzes/:id/submit
Submit quiz answers.

**Models:** `QuizSubmission`, `Question`

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "507f1f77bcf86cd799439045",
      "answer": "HyperText Markup Language"
    }
  ],
  "timeSpent": 25
}
```

### GET /api/quizzes/:id/results
Get quiz results for student.

**Models:** `QuizSubmission`

**Query Parameters:**
- `studentId` (Lecturer/Business Owner only)

### GET /api/quizzes/:id/attempts
Get quiz attempt history.

**Models:** `QuizSubmission`

**Query Parameters:**
- `studentId` (Lecturer/Business Owner only)

---

## Enrollments API

### GET /api/enrollments
List enrollments with filtering.

**Models:** `Enrollment`, `User`, `Course`

**Query Parameters:**
- `studentId`, `courseId`, `cohortId`, `progress`, `organizationId`

### GET /api/enrollments/:id
Get enrollment by ID with progress tracking.

**Models:** `Enrollment`, `LessonProgress`

### GET /api/enrollments/:id/progress
Get detailed progress for enrollment.

**Models:** `Enrollment`, `LessonProgress`, `Lesson`

### PUT /api/enrollments/:id/progress
Update enrollment progress (when lesson is completed).

**Models:** `Enrollment`, `LessonProgress`

---

## Lesson Progress API

### GET /api/enrollments/:id/lessons/:lessonId/progress
Get lesson progress for enrollment.

**Models:** `LessonProgress`

### PUT /api/enrollments/:id/lessons/:lessonId/progress
Update lesson progress (mark as completed, update time spent).

**Models:** `LessonProgress`

**Request Body:**
```json
{
  "isCompleted": true,
  "timeSpent": 30
}
```

---

## Cohorts API

### GET /api/organizations/:id/cohorts
List cohorts for an organization.

**Models:** `Cohort`, `Course`

**Query Parameters:**
- `courseId`, `status`, `page`, `limit`

### POST /api/organizations/:id/cohorts
Create a new cohort.

**Models:** `Cohort`

**Request Body:**
```json
{
  "courseId": "507f1f77bcf86cd799439020",
  "name": "Spring 2024 Cohort",
  "description": "Spring semester cohort",
  "startDate": "2024-03-01T00:00:00.000Z",
  "endDate": "2024-06-30T00:00:00.000Z",
  "enrollmentLimit": 50,
  "status": "PLANNED",
  "timezone": "America/New_York"
}
```

### GET /api/cohorts/:id
Get cohort by ID.

**Models:** `Cohort`, `CohortEnrollment`

### PUT /api/cohorts/:id
Update cohort.

**Models:** `Cohort`

### DELETE /api/cohorts/:id
Delete cohort.

**Models:** `Cohort`

---

## Cohort Enrollments API

### GET /api/cohorts/:id/enrollments
List enrollments in a cohort.

**Models:** `CohortEnrollment`, `Enrollment`, `User`

### POST /api/cohorts/:id/enroll
Enroll in cohort (creates both Enrollment and CohortEnrollment).

**Models:** `Enrollment`, `CohortEnrollment`

**Note:** User must be enrolled in the course first

### DELETE /api/cohorts/:id/enrollments/:enrollmentId
Remove enrollment from cohort.

**Models:** `CohortEnrollment`

---

## Analytics API

### GET /api/analytics/dashboard
Get dashboard statistics.

**Models:** Multiple (aggregated data)

**Query Parameters:**
- `organizationId` (Business Owner only, optional)

**Response:**
```json
{
  "totalMembers": 150,
  "totalInstructors": 25,
  "totalCourses": 30,
  "totalEnrollments": 500,
  "activeCohorts": 5,
  "recentActivity": [...]
}
```

### GET /api/analytics/instructor
Get analytics for instructor.

**Models:** `Course`, `Enrollment`, `QuizSubmission`

**Query Parameters:**
- `instructorId`, `organizationId`, `courseId`

### GET /api/analytics/learner
Get learner progress analytics.

**Models:** `Enrollment`, `LessonProgress`, `QuizSubmission`

**Query Parameters:**
- `learnerId`, `organizationId`, `courseId`

### GET /api/courses/:id/analytics
Get course analytics.

**Models:** `Enrollment`, `LessonProgress`, `QuizSubmission`

---

## File Upload API

### POST /api/upload
Upload a file (video, document, or image).

**Request:** Multipart form data

**Form Fields:**
- `file` - File to upload
- `organizationId` - Required
- `type` - `video`, `document`, or `image`
- `courseId` (optional)
- `lessonId` (optional)

### GET /api/files/:id
Get file metadata.

### GET /api/files/:id/download
Download file.

### DELETE /api/files/:id
Delete file.

---

## Implementation Priority

### Phase 1: Organization Management
1. Organizations API
2. Organization Memberships API

### Phase 2: Course Content
3. Sub-Courses API
4. Lessons API
5. Course Instructors API

### Phase 3: Assessments
6. Quizzes API
7. Questions API
8. Quiz Submissions API

### Phase 4: Learning Progress
9. Enrollments API (enhanced)
10. Lesson Progress API
11. Cohorts API
12. Cohort Enrollments API

### Phase 5: Analytics & Files
13. Analytics API
14. File Upload API

---

## Notes

- All APIs should implement organization scoping
- Role-based access control should be enforced
- Input validation using Zod schemas
- Pagination for list endpoints
- Proper error handling and status codes

