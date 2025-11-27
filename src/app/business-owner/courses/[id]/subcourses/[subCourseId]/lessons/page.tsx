import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { Metadata } from "next";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@/types";
import { LessonCreateClient } from "@/components/business-owner/courses/lessons/lesson-create-client";

interface CreateLessonPageProps {
  params: Promise<{ id: string; subCourseId: string }>;
}

export async function generateMetadata({
  params,
}: CreateLessonPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Create Lesson | Course ${id}`,
  };
}

export default async function CreateLessonPage({
  params,
}: CreateLessonPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth/login");
  }

  if (session.user.role !== UserRole.BUSINESS_OWNER) {
    redirect("/dashboard");
  }

  const { id: courseId, subCourseId } = await params;

  const subCourse = await prisma.subCourse.findFirst({
    where: { id: subCourseId, courseId },
    select: {
      id: true,
      title: true,
      course: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!subCourse) {
    notFound();
  }

  return (
    <LessonCreateClient
      courseId={courseId}
      subCourseId={subCourseId}
      courseTitle={subCourse.course.title}
      subCourseTitle={subCourse.title}
    />
  );
}
