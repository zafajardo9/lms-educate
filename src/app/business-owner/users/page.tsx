import { Suspense } from "react";
import { UsersClient } from "@/components/business-owner/user";
import { getUsers } from "./actions";
import { Spinner } from "@/components/ui/spinner";

interface UsersPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    role?: string;
    status?: string;
  }>;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;
  
  const data = await getUsers({
    page: params.page ? parseInt(params.page) : 1,
    pageSize: params.pageSize ? parseInt(params.pageSize) : 10,
    search: params.search ?? "",
    role: params.role ?? "all",
    status: params.status ?? "all",
  });

  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <Spinner className="size-8" />
        </div>
      }
    >
      <UsersClient initialData={data} />
    </Suspense>
  );
}
