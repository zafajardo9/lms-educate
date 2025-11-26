import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { UserRole } from "@/types";
import {
  EnrollmentsClient,
  getEnrollments,
  getAvailableStudents,
  getCourseCohorts,
  getCourseGroups,
} from "@/components/business-owner/course-enrollments";

interface EnrollmentsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    cohortId?: string;
    groupId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function EnrollmentsPage({
  params,
  searchParams,
}: EnrollmentsPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  if (session.user.role !== UserRole.BUSINESS_OWNER) {
    redirect("/dashboard");
  }

  const { id: courseId } = await params;
  const searchParamsValue = await searchParams;

  const page = searchParamsValue.page ? parseInt(searchParamsValue.page) : 1;
  const limit = searchParamsValue.limit ? parseInt(searchParamsValue.limit) : 10;
  const search = searchParamsValue.search;
  const cohortId = searchParamsValue.cohortId;
  const groupId = searchParamsValue.groupId;
  const status = searchParamsValue.status;
  const startDate = searchParamsValue.startDate;
  const endDate = searchParamsValue.endDate;

  const [enrollmentsData, availableStudents, cohorts, groups] =
    await Promise.all([
      getEnrollments(courseId, {
        page,
        limit,
        search,
        cohortId,
        groupId,
        status,
        startDate,
        endDate,
      }),
      getAvailableStudents(),
      getCourseCohorts(courseId),
      getCourseGroups(courseId),
    ]);

  if (!enrollmentsData) {
    notFound();
  }

  return (
    <EnrollmentsClient
      courseId={courseId}
      courseTitle={enrollmentsData.courseTitle}
      initialData={enrollmentsData}
      availableStudents={availableStudents}
      cohorts={cohorts}
      groups={groups}
    />
  );
}
