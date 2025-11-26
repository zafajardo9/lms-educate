import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { UserRole } from "@/types";
import { EnrollmentsClient } from "@/components/business-owner/courses/enrollments/enrollments-client";

interface EnrollmentsPageProps {
  params: Promise<{ id: string }>;
}

async function getCourseEnrollments(courseId: string, cookieHeader: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const response = await fetch(
    `${baseUrl}/api/business-owner/courses/${courseId}/enrollments`,
    {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error("Failed to fetch enrollments");
  }

  const result = await response.json();
  return result.data;
}

async function getAvailableStudents(cookieHeader: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const response = await fetch(
    `${baseUrl}/api/business-owner/users?role=STUDENT&limit=100`,
    {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }
  );

  if (!response.ok) return [];

  const result = await response.json();
  return result.data?.users || [];
}

async function getCourseCohorts(courseId: string, cookieHeader: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const response = await fetch(
    `${baseUrl}/api/business-owner/courses/${courseId}/cohorts`,
    {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }
  );

  if (!response.ok) return [];

  const result = await response.json();
  return result.data?.cohorts || [];
}

async function getCourseGroups(courseId: string, cookieHeader: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const response = await fetch(
    `${baseUrl}/api/business-owner/courses/${courseId}/groups`,
    {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }
  );

  if (!response.ok) return [];

  const result = await response.json();
  return result.data?.groups || [];
}

export default async function EnrollmentsPage({
  params,
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
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie") || "";

  const [enrollmentsData, availableStudents, cohorts, groups] =
    await Promise.all([
      getCourseEnrollments(courseId, cookieHeader),
      getAvailableStudents(cookieHeader),
      getCourseCohorts(courseId, cookieHeader),
      getCourseGroups(courseId, cookieHeader),
    ]);

  if (!enrollmentsData) {
    notFound();
  }

  return (
    <EnrollmentsClient
      courseId={courseId}
      courseTitle={enrollmentsData.courseTitle}
      initialEnrollments={enrollmentsData.enrollments}
      availableStudents={availableStudents}
      cohorts={cohorts}
      groups={groups}
    />
  );
}
