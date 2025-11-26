"use server";

import { cookies, headers } from "next/headers";
import type {
  CoursesResponse,
  GetCoursesParams,
  CreateCourseData,
  UpdateCourseData,
  LecturerOption,
  CourseListItem,
} from "./types";
import { CourseStatus } from "@/types";

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}`;
}

async function getAuthHeaders() {
  const cookieStore = await cookies();
  return {
    "Content-Type": "application/json",
    Cookie: cookieStore.toString(),
  };
}

export async function getCourses(
  params: GetCoursesParams = {}
): Promise<CoursesResponse> {
  const {
    page = 1,
    pageSize = 10,
    search = "",
    status = "all",
    level = "all",
    category = "",
  } = params;

  try {
    const baseUrl = await getBaseUrl();
    const authHeaders = await getAuthHeaders();

    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
    });

    if (search) queryParams.set("search", search);
    if (status && status !== "all") queryParams.set("status", status);
    if (level && level !== "all") queryParams.set("level", level);
    if (category) queryParams.set("category", category);

    const response = await fetch(
      `${baseUrl}/api/business-owner/courses?${queryParams.toString()}`,
      {
        method: "GET",
        headers: authHeaders,
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch courses: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || "Failed to fetch courses");
    }

    const courses: CourseListItem[] = result.data.courses || [];
    const pagination = result.data.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    };

    const totalCourses = pagination.total;
    const activeCourses = courses.filter(
      (c) => c.status === CourseStatus.ACTIVE
    ).length;
    const draftCourses = courses.filter(
      (c) => c.status === CourseStatus.DRAFT
    ).length;
    const publishedCourses = courses.filter((c) => c.isPublished).length;
    const totalEnrollments = courses.reduce(
      (sum, c) => sum + (c._count?.enrollments || 0),
      0
    );

    return {
      courses,
      pagination: {
        page: pagination.page,
        pageSize: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
      },
      stats: {
        totalCourses,
        activeCourses,
        draftCourses,
        publishedCourses,
        totalEnrollments,
      },
    };
  } catch (error) {
    console.error("Error fetching courses:", error);
    return {
      courses: [],
      pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
      stats: {
        totalCourses: 0,
        activeCourses: 0,
        draftCourses: 0,
        publishedCourses: 0,
        totalEnrollments: 0,
      },
    };
  }
}

export async function getCourse(
  courseId: string
): Promise<CourseListItem | null> {
  try {
    const baseUrl = await getBaseUrl();
    const authHeaders = await getAuthHeaders();

    const response = await fetch(
      `${baseUrl}/api/business-owner/courses/${courseId}`,
      {
        method: "GET",
        headers: authHeaders,
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch course");
    }

    const result = await response.json();
    return result.data?.course || null;
  } catch (error) {
    console.error("Error fetching course:", error);
    return null;
  }
}

export async function createCourse(
  data: CreateCourseData
): Promise<{ success: boolean; course?: CourseListItem; error?: string }> {
  try {
    const baseUrl = await getBaseUrl();
    const authHeaders = await getAuthHeaders();

    const response = await fetch(`${baseUrl}/api/business-owner/courses`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error?.message || "Failed to create course",
      };
    }

    return { success: true, course: result.data };
  } catch (error) {
    console.error("Error creating course:", error);
    return { success: false, error: "Failed to create course" };
  }
}

export async function updateCourse(
  data: UpdateCourseData
): Promise<{ success: boolean; course?: CourseListItem; error?: string }> {
  try {
    const baseUrl = await getBaseUrl();
    const authHeaders = await getAuthHeaders();
    const { id, ...updateData } = data;

    const response = await fetch(
      `${baseUrl}/api/business-owner/courses/${id}`,
      {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(updateData),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error?.message || "Failed to update course",
      };
    }

    return { success: true, course: result.data };
  } catch (error) {
    console.error("Error updating course:", error);
    return { success: false, error: "Failed to update course" };
  }
}

export async function updateCourseStatus(
  courseId: string,
  status: CourseStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = await getBaseUrl();
    const authHeaders = await getAuthHeaders();

    const response = await fetch(
      `${baseUrl}/api/business-owner/courses/${courseId}`,
      {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ status }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error?.message || "Failed to update status",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating course status:", error);
    return { success: false, error: "Failed to update status" };
  }
}

export async function toggleEnrollment(
  courseId: string,
  enrollmentOpen: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = await getBaseUrl();
    const authHeaders = await getAuthHeaders();

    const response = await fetch(
      `${baseUrl}/api/business-owner/courses/${courseId}`,
      {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ enrollmentOpen }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error?.message || "Failed to toggle enrollment",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error toggling enrollment:", error);
    return { success: false, error: "Failed to toggle enrollment" };
  }
}

export async function deleteCourse(
  courseId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = await getBaseUrl();
    const authHeaders = await getAuthHeaders();

    const response = await fetch(
      `${baseUrl}/api/business-owner/courses/${courseId}`,
      {
        method: "DELETE",
        headers: authHeaders,
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error?.message || "Failed to delete course",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting course:", error);
    return { success: false, error: "Failed to delete course" };
  }
}

export async function getLecturers(): Promise<LecturerOption[]> {
  try {
    const baseUrl = await getBaseUrl();
    const authHeaders = await getAuthHeaders();

    const response = await fetch(
      `${baseUrl}/api/business-owner/users?role=LECTURER&limit=100`,
      {
        method: "GET",
        headers: authHeaders,
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch lecturers");
    }

    const result = await response.json();
    const users = result.data?.users || [];

    return users.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
    }));
  } catch (error) {
    console.error("Error fetching lecturers:", error);
    return [];
  }
}
