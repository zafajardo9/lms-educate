"use server";

import { cookies, headers } from "next/headers";
import type {
  AddOrganizationMemberData,
  CreateOrganizationData,
  GetOrganizationsParams,
  OrganizationListItem,
  OrganizationMembersResponse,
  OrganizationsResponse,
  UpdateOrganizationData,
} from "./types";

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return `${protocol}://${host}`;
}

export async function updateOrganization(
  organizationId: string,
  data: UpdateOrganizationData
) {
  try {
    const baseUrl = await getBaseUrl();
    const authHeaders = await getAuthHeaders();

    const response = await fetch(
      `${baseUrl}/api/business-owner/organizations/${organizationId}`,
      {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error?.message || "Failed to update organization",
      };
    }

    return { success: true, organization: result.data?.organization };
  } catch (error) {
    console.error("Error updating organization:", error);
    return { success: false, error: "Failed to update organization" };
  }
}

export async function deleteOrganization(organizationId: string) {
  try {
    const baseUrl = await getBaseUrl();
    const authHeaders = await getAuthHeaders();

    const response = await fetch(
      `${baseUrl}/api/business-owner/organizations/${organizationId}`,
      {
        method: "DELETE",
        headers: authHeaders,
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error?.message || "Failed to delete organization",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting organization:", error);
    return { success: false, error: "Failed to delete organization" };
  }
}

export async function getOrganizationMembers(
  organizationId: string
): Promise<OrganizationMembersResponse> {
  try {
    const baseUrl = await getBaseUrl();
    const authHeaders = await getAuthHeaders();

    const response = await fetch(
      `${baseUrl}/api/business-owner/organizations/${organizationId}/members`,
      {
        method: "GET",
        headers: authHeaders,
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || "Failed to fetch members");
    }

    return {
      members: result.data?.members ?? [],
      pagination: result.pagination ?? {
        page: 1,
        pageSize: result.data?.members?.length ?? 0,
        total: result.data?.members?.length ?? 0,
        totalPages: 1,
      },
    };
  } catch (error) {
    console.error("Error fetching organization members:", error);
    return {
      members: [],
      pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
    };
  }
}

export async function addOrganizationMember(
  organizationId: string,
  data: AddOrganizationMemberData
) {
  try {
    const baseUrl = await getBaseUrl();
    const authHeaders = await getAuthHeaders();

    const response = await fetch(
      `${baseUrl}/api/business-owner/organizations/${organizationId}/members`,
      {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(data),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error?.message || "Failed to add member",
      };
    }

    return { success: true, member: result.data?.member };
  } catch (error) {
    console.error("Error adding organization member:", error);
    return { success: false, error: "Failed to add member" };
  }
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
