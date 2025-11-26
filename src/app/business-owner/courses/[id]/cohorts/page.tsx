import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { UserRole } from "@/types";
import { CohortsClient } from "@/components/business-owner/courses/cohorts/cohorts-client";

interface CohortsPageProps {
  params: Promise<{ id: string }>;
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

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error("Failed to fetch cohorts");
  }

  const result = await response.json();
  return result.data;
}

export default async function CohortsPage({ params }: CohortsPageProps) {
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

  const cohortsData = await getCourseCohorts(courseId, cookieHeader);

  if (!cohortsData) {
    notFound();
  }

  return (
    <CohortsClient
      courseId={courseId}
      courseTitle={cohortsData.courseTitle}
      initialCohorts={cohortsData.cohorts}
    />
  );
}
