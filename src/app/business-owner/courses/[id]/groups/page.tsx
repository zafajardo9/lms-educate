import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { UserRole } from "@/types";
import { GroupsClient } from "@/components/business-owner/courses/groups/groups-client";

interface GroupsPageProps {
  params: Promise<{ id: string }>;
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

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error("Failed to fetch groups");
  }

  const result = await response.json();
  return result.data;
}

export default async function GroupsPage({ params }: GroupsPageProps) {
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

  const groupsData = await getCourseGroups(courseId, cookieHeader);

  if (!groupsData) {
    notFound();
  }

  return (
    <GroupsClient
      courseId={courseId}
      courseTitle={groupsData.courseTitle}
      initialGroups={groupsData.groups}
    />
  );
}
