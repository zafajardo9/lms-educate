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
