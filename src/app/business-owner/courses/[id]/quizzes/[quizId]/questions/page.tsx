import { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { QuizQuestionBuilder } from "@/components/business-owner/courses/quizzes/quiz-question-builder";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@/types";

interface QuizQuestionPageProps {
  params: Promise<{ id: string; quizId: string }>;
}

export async function generateMetadata({
  params,
}: QuizQuestionPageProps): Promise<Metadata> {
  const { id, quizId } = await params;
  return {
    title: `Quiz Questions | Course ${id}`,
    description: `Manage quiz ${quizId} questions`,
  };
}

export default async function QuizQuestionPage({
  params,
}: QuizQuestionPageProps) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth/login");
  }

  if (session.user.role !== UserRole.BUSINESS_OWNER) {
    redirect("/dashboard");
  }

  const { id: courseId, quizId } = await params;

  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, courseId },
    select: {
      id: true,
      title: true,
      description: true,
      subCourse: {
        select: {
          id: true,
          title: true,
        },
      },
      course: {
        select: {
          id: true,
          title: true,
        },
      },
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          type: true,
          question: true,
          options: true,
          correctAnswer: true,
          explanation: true,
          points: true,
          order: true,
        },
      },
      _count: {
        select: { questions: true },
      },
    },
  });

  if (!quiz) {
    notFound();
  }

  return (
    <QuizQuestionBuilder
      courseId={courseId}
      quizId={quizId}
      courseTitle={quiz.course.title}
      quizTitle={quiz.title}
      subCourseTitle={quiz.subCourse?.title}
      existingQuestionCount={quiz._count.questions}
      quizDescription={quiz.description}
      existingQuestions={quiz.questions}
    />
  );
}
