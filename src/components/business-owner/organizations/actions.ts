"use server";

import { cookies, headers } from "next/headers";
import type {
  CreateOrganizationData,
  GetOrganizationsParams,
  OrganizationListItem,
  OrganizationsResponse,
} from "./types";

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

export async function getOrganizations(
  params: GetOrganizationsParams = {}
): Promise<OrganizationsResponse> {
  const {
    page = 1,
    pageSize = 10,
    search = "",
  } = params;

  try {
    const baseUrl = await getBaseUrl();
    const authHeaders = await getAuthHeaders();

    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
    });

    if (search) queryParams.set("search", search);
    const response = await fetch(
      `${baseUrl}/api/business-owner/organizations?${queryParams.toString()}`,
      {
        method: "GET",
        headers: authHeaders,
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch organizations: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error?.message || "Failed to fetch organizations");
    }

    const organizations: OrganizationListItem[] =
      result.data?.organizations?.map((org: any) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        description: org.description,
        ownerId: org.ownerId,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      })) ?? [];

    const pagination = result.pagination || {
      page: 1,
      limit: 10,
      total: organizations.length,
      totalPages: 1,
    };

    const stats = {
      totalOrganizations: pagination.total,
    };

    return {
      organizations,
      pagination: {
        page: pagination.page,
        pageSize: pagination.limit,
        total: pagination.total,
        totalPages: pagination.totalPages,
      },
      stats,
    };
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return {
      organizations: [],
      pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
      stats: {
        totalOrganizations: 0,
      },
    };
  }
}

export async function createOrganization(data: CreateOrganizationData) {
  try {
    const baseUrl = await getBaseUrl();
    const authHeaders = await getAuthHeaders();

    const response = await fetch(`${baseUrl}/api/business-owner/organizations`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error?.message || "Failed to create organization",
      };
    }

    return { success: true, organization: result.data?.organization };
  } catch (error) {
    console.error("Error creating organization:", error);
    return { success: false, error: "Failed to create organization" };
  }
}
