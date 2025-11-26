import { Suspense } from "react";
import { CoursesClient, getCourses } from "@/components/business-owner/courses";
import { Spinner } from "@/components/ui/spinner";

interface CoursesPageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    status?: string;
    level?: string;
    category?: string;
  }>;
}

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams;

  const data = await getCourses({
    page: params.page ? parseInt(params.page) : 1,
    pageSize: params.pageSize ? parseInt(params.pageSize) : 10,
    search: params.search ?? "",
    status: params.status ?? "all",
    level: params.level ?? "all",
    category: params.category ?? "",
  });

  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <Spinner className="size-8" />
        </div>
      }
    >
      <CoursesClient initialData={data} />
    </Suspense>
  );
}
