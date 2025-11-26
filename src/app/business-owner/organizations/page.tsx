import { Suspense } from "react";

import {
  OrganizationsClient,
  getOrganizations,
} from "@/components/business-owner/organizations";
import { Spinner } from "@/components/ui/spinner";

interface OrganizationsPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    plan?: string;
    status?: string;
  }>;
}

export default async function OrganizationsPage({
  searchParams,
}: OrganizationsPageProps) {
  const params = await searchParams;

  const data = await getOrganizations({
    page: params.page ? parseInt(params.page, 10) : 1,
    pageSize: params.pageSize ? parseInt(params.pageSize, 10) : 10,
    search: params.search ?? "",
    plan: (params.plan as any) ?? "all",
    status: (params.status as any) ?? "all",
  });

  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <Spinner className="size-8" />
        </div>
      }
    >
      <OrganizationsClient initialData={data} />
    </Suspense>
  );
}
