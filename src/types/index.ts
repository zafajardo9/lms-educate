// ============================================================================
// SHARED TYPES - Centralized data types for the LMS Platform
// ============================================================================

// User Types
export enum UserRole {
  BUSINESS_OWNER = 'BUSINESS_OWNER',
  LECTURER = 'LECTURER',
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  userId: string;
  bio?: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: Date;
}

// Organization Types
export enum OrganizationPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  GROWTH = 'GROWTH',
  ENTERPRISE = 'ENTERPRISE'
}

export enum OrganizationStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  SUSPENDED = 'SUSPENDED'
}

export enum OrganizationRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
  REVIEWER = 'REVIEWER',
  LEARNER = 'LEARNER'
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  EXPIRED = 'EXPIRED'
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  timezone: string;
  locale: string;
  plan: OrganizationPlan;
  status: OrganizationStatus;
  ownerId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  userId?: string;
  role: OrganizationRole;
  invitationEmail?: string;
  invitationStatus: InvitationStatus;
  invitedById?: string;
  joinedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Course Types
export interface Course {
  id: string;
  title: string;
  description: string;
  lecturerId: string;
  isPublished: boolean;
  thumbnail?: string;
  price?: number;
  duration?: number; // in minutes
  level: CourseLevel;
  category?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  lecturer?: User;
  subCourses: SubCourse[];
  lessons: Lesson[];
  enrollments: Enrollment[];
  quizzes: Quiz[];
}

export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

export interface SubCourse {
  id: string;
  title: string;
  description: string;
  courseId: string;
  order: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  course?: Course;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  attachments: string[];
  courseId?: string;
  subCourseId?: string;
  order: number;
  duration?: number; // in minutes
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  course?: Course;
  subCourse?: SubCourse;
}

// Quiz Types
export interface Quiz {
  id: string;
  title: string;
  description: string;
  courseId: string;
  timeLimit?: number; // in minutes
  maxAttempts: number;
  passingScore: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  course?: Course;
  questions: Question[];
  submissions: QuizSubmission[];
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  ESSAY = 'ESSAY'
}

export interface Question {
  id: string;
  quizId: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  studentId: string;
  answers: QuizAnswer[];
  score: number;
  totalPoints: number;
  isPassed: boolean;
  timeSpent: number; // in minutes
  submittedAt: Date;
  
  // Relations
  quiz?: Quiz;
  student?: User;
}

export interface QuizAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  pointsEarned: number;
}

// Enrollment Types
export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: Date;
  progress: number; // percentage 0-100
  completedAt?: Date;
  lastAccessedAt?: Date;
  
  // Relations
  student?: User;
  course?: Course;
  progressTracking: LessonProgress[];
}

export interface LessonProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  isCompleted: boolean;
  timeSpent: number; // in minutes
  completedAt?: Date;
  
  // Relations
  enrollment?: Enrollment;
  lesson?: Lesson;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Form Types
export interface CreateCourseData {
  title: string;
  description: string;
  level: CourseLevel;
  category?: string;
  tags: string[];
  price?: number;
}

export interface CreateLessonData {
  title: string;
  content: string;
  courseId?: string;
  subCourseId?: string;
  videoUrl?: string;
  duration?: number;
}

export interface CreateQuizData {
  title: string;
  description: string;
  courseId: string;
  timeLimit?: number;
  maxAttempts: number;
  passingScore: number;
}

export interface CreateQuestionData {
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
}

// Filter and Search Types
export interface CourseFilters {
  search?: string;
  category?: string;
  level?: CourseLevel;
  lecturerId?: string;
  isPublished?: boolean;
  tags?: string[];
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

// Dashboard Analytics Types
export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'enrollment' | 'course_created' | 'quiz_completed' | 'user_registered';
  description: string;
  userId: string;
  userName: string;
  timestamp: Date;
}

export interface LecturerStats {
  totalCourses: number;
  totalStudents: number;
  totalQuizzes: number;
  averageRating: number;
  recentEnrollments: Enrollment[];
}

export interface StudentStats {
  enrolledCourses: number;
  completedCourses: number;
  totalQuizzesTaken: number;
  averageScore: number;
  recentActivity: ActivityItem[];
}

// File Upload Types
export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
}

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}