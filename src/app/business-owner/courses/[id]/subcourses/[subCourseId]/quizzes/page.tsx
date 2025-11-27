import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { Metadata } from "next";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@/types";
import { QuizCreateClient } from "@/components/business-owner/courses/quizzes/quiz-create-client";

interface CreateQuizPageProps {
  params: Promise<{ id: string; subCourseId: string }>;
}

export async function generateMetadata({
  params,
}: CreateQuizPageProps): Promise<Metadata> {
  const { id, subCourseId } = await params;
  return {
    title: `Create Quiz | Course ${id}`,
    description: `Create quiz for subcourse ${subCourseId}`,
  };
}

export default async function CreateQuizPage({ params }: CreateQuizPageProps) {
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
    <QuizCreateClient
      courseId={courseId}
      subCourseId={subCourseId}
      courseTitle={subCourse.course.title}
      subCourseTitle={subCourse.title}
    />
  );
}
