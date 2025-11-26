"use server";

import { cookies, headers } from "next/headers";
import { UserRole } from "@/types";

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  avatar?: string | null;
  profile?: {
    avatar?: string | null;
  } | null;
}

export interface UsersResponse {
  users: UserListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    totalStudents: number;
    totalLecturers: number;
    totalBusinessOwners: number;
  };
}

export interface GetUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
}

async function getBaseUrl() {
  // In server components, we need to construct the full URL
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}`;
}

export async function getUsers(params: GetUsersParams = {}): Promise<UsersResponse> {
  const {
    page = 1,
    pageSize = 10,
    search = "",
    role = "all",
    status = "all",
  } = params;

  try {
    const baseUrl = await getBaseUrl();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    // Build query params
    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
    });

    if (search) {
      queryParams.set("search", search);
    }
    if (role && role !== "all") {
      queryParams.set("role", role);
    }
    if (status && status !== "all") {
      queryParams.set("isActive", status === "active" ? "true" : "false");
    }

    const response = await fetch(`${baseUrl}/api/business-owner/users?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("API Error:", response.status, response.statusText);
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || "Failed to fetch users");
    }

    // Transform API response to match our interface
    const users: UserListItem[] = result.data.users.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      isActive: user.isActive,
      createdAt: user.createdAt,
      avatar: user.profile?.avatar || null,
    }));

    // Calculate stats from the users (we'll need to add a stats endpoint later for accurate counts)
    // For now, use pagination total as an approximation
    const totalUsers = result.data.pagination.total;

    return {
      users,
      pagination: {
        page: result.data.pagination.page,
        pageSize: result.data.pagination.limit,
        total: result.data.pagination.total,
        totalPages: result.data.pagination.totalPages,
      },
      stats: {
        totalUsers,
        activeUsers: users.filter((u: UserListItem) => u.isActive).length,
        inactiveUsers: users.filter((u: UserListItem) => !u.isActive).length,
        totalStudents: users.filter((u: UserListItem) => u.role === UserRole.STUDENT).length,
        totalLecturers: users.filter((u: UserListItem) => u.role === UserRole.LECTURER).length,
        totalBusinessOwners: users.filter((u: UserListItem) => u.role === UserRole.BUSINESS_OWNER).length,
      },
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    // Return empty data on error
    return {
      users: [],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
      },
      stats: {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        totalStudents: 0,
        totalLecturers: 0,
        totalBusinessOwners: 0,
      },
    };
  }
}

export async function toggleUserStatus(userId: string): Promise<{ success: boolean; isActive: boolean }> {
  try {
    const baseUrl = await getBaseUrl();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    // First get current status
    const getResponse = await fetch(`${baseUrl}/api/business-owner/users/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
    });

    if (!getResponse.ok) {
      throw new Error("Failed to get user");
    }

    const userData = await getResponse.json();
    const currentStatus = userData.data?.user?.isActive ?? true;

    // Toggle status
    const response = await fetch(`${baseUrl}/api/business-owner/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ isActive: !currentStatus }),
    });

    if (!response.ok) {
      throw new Error("Failed to update user status");
    }

    const result = await response.json();
    return { success: true, isActive: result.data?.user?.isActive ?? !currentStatus };
  } catch (error) {
    console.error("Error toggling user status:", error);
    throw error;
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean }> {
  try {
    const baseUrl = await getBaseUrl();
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const response = await fetch(`${baseUrl}/api/business-owner/users/${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete user");
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}
