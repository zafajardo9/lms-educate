export interface OrganizationListItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
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
  };
}

export interface GetOrganizationsParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface CreateOrganizationData {
  name: string;
  slug?: string;
  description?: string;
}

export type UpdateOrganizationData = Partial<CreateOrganizationData>;

export type OrganizationMemberRole = "OWNER" | "ADMIN" | "LECTURER";

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationMemberRole;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

export interface OrganizationMembersResponse {
  members: OrganizationMember[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface AddOrganizationMemberData {
  email: string;
  role: OrganizationMemberRole;
}
