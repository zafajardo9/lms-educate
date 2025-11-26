import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { UserRole } from "@/types";
import { InstructorsClient } from "@/components/business-owner/courses/instructors/instructors-client";

interface InstructorsPageProps {
  params: Promise<{ id: string }>;
}

async function getCourseInstructors(courseId: string, cookieHeader: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const response = await fetch(
    `${baseUrl}/api/business-owner/courses/${courseId}/instructors`,
    {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error("Failed to fetch instructors");
  }

  const result = await response.json();
  return result.data;
}

async function getAvailableLecturers(cookieHeader: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const response = await fetch(
    `${baseUrl}/api/business-owner/users?role=LECTURER&limit=100`,
    {
      headers: { Cookie: cookieHeader },
      cache: "no-store",
    }
  );

  if (!response.ok) return [];

  const result = await response.json();
  return result.data?.users || [];
}

export default async function InstructorsPage({
  params,
}: InstructorsPageProps) {
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

  const [instructorsData, availableLecturers] = await Promise.all([
    getCourseInstructors(courseId, cookieHeader),
    getAvailableLecturers(cookieHeader),
  ]);

  if (!instructorsData) {
    notFound();
  }

  return (
    <InstructorsClient
      courseId={courseId}
      courseTitle={instructorsData.courseTitle}
      primaryLecturer={instructorsData.primaryLecturer}
      initialInstructors={instructorsData.instructors}
      availableLecturers={availableLecturers}
    />
  );
}
