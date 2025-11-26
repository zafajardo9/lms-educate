import { CourseStatus, CourseLevel } from "@/types";

export interface CourseListItem {
  id: string;
  title: string;
  description: string;
  status: CourseStatus;
  level: CourseLevel;
  isPublished: boolean;
  enrollmentOpen: boolean;
  price: number | null;
  thumbnail: string | null;
  category: string | null;
  tags: string[];
  duration: number | null;
  availableFrom: string | null;
  availableUntil: string | null;
  createdAt: string;
  updatedAt: string;
  lecturer: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    enrollments: number;
    subCourses: number;
    quizzes: number;
  };
}

export interface CoursesResponse {
  courses: CourseListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalCourses: number;
    activeCourses: number;
    draftCourses: number;
    publishedCourses: number;
    totalEnrollments: number;
  };
}

export interface GetCoursesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  level?: string;
  category?: string;
}

export interface CreateCourseData {
  title: string;
  description: string;
  lecturerId: string;
  level: CourseLevel;
  category?: string;
  tags?: string[];
  price?: number;
  duration?: number;
  status?: CourseStatus;
  isPublished?: boolean;
  enrollmentOpen?: boolean;
  availableFrom?: string;
  availableUntil?: string;
}

export interface UpdateCourseData extends Partial<CreateCourseData> {
  id: string;
}

export interface LecturerOption {
  id: string;
  name: string;
  email: string;
}
