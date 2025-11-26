import { OrganizationPlan, OrganizationStatus } from "@/types";

export interface OrganizationListItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  plan: OrganizationPlan;
  status: OrganizationStatus;
  timezone?: string | null;
  locale?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown> | null;
}

export interface OrganizationsResponse {
  organizations: OrganizationListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  stats: {
    totalOrganizations: number;
    activeOrganizations: number;
    pausedOrganizations: number;
    suspendedOrganizations: number;
  };
}

export interface GetOrganizationsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  plan?: OrganizationPlan | "all";
  status?: OrganizationStatus | "all";
}

export interface CreateOrganizationData {
  name: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  timezone?: string;
  locale?: string;
  plan?: OrganizationPlan;
  status?: OrganizationStatus;
  metadata?: Record<string, unknown>;
}
