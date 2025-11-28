"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { toast } from "sonner";
import { QuizHeader } from "./quiz-header";
import { QuestionCard } from "./question-card";
import { QuizPreviewDialog } from "./quiz-preview-dialog";
import { Button } from "@/components/ui/button";
import { PageLayout, PageSection } from "@/components/shared/page-layout";
import { Plus, ArrowLeft, Save } from "lucide-react";
import {
  createQuizQuestions,
  updateQuizQuestion,
  deleteQuizQuestion,
  type QuizQuestionInput,
  type QuizQuestionType,
} from "./actions";

export type QuestionType = "multiple-choice" | "true-false" | "short-answer";

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options: Option[];
  correctAnswer?: string;
  points: number;
  dbId?: string; // Database ID for existing questions
  isDeleted?: boolean; // Mark for deletion
}

export interface Quiz {
  title: string;
  description: string;
  questions: Question[];
}

// Database question type from Prisma
interface ExistingQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string | null;
  points: number;
  order: number | null;
}

interface QuizBuilderProps {
  courseId: string;
  quizId: string;
  courseTitle: string;
  quizTitle: string;
  subCourseTitle?: string | null;
  quizDescription?: string | null;
  existingQuestionCount: number;
  existingQuestions: ExistingQuestion[];
}

// Map database question type to component type
function mapDbTypeToComponentType(dbType: QuizQuestionType): QuestionType {
  switch (dbType) {
    case "MULTIPLE_CHOICE":
      return "multiple-choice";
    case "TRUE_FALSE":
      return "true-false";
    case "SHORT_ANSWER":
    case "ESSAY":
    default:
      return "short-answer";
  }
}

// Map component type to database type
function mapComponentTypeToDbType(
  componentType: QuestionType
): QuizQuestionType {
  switch (componentType) {
    case "multiple-choice":
      return "MULTIPLE_CHOICE";
    case "true-false":
      return "TRUE_FALSE";
    case "short-answer":
      return "SHORT_ANSWER";
  }
}

// Convert existing database questions to component format
function mapExistingQuestions(
  existingQuestions: ExistingQuestion[]
): Question[] {
  return existingQuestions.map((q) => {
    const componentType = mapDbTypeToComponentType(q.type);
    let options: Option[] = [];

    if (componentType === "multiple-choice" && q.options) {
      options = q.options.map((optText) => ({
        id: crypto.randomUUID(),
        text: optText,
        isCorrect: optText === q.correctAnswer,
      }));
    } else if (componentType === "true-false") {
      options = [
        {
          id: crypto.randomUUID(),
          text: "True",
          isCorrect: q.correctAnswer === "True",
        },
        {
          id: crypto.randomUUID(),
          text: "False",
          isCorrect: q.correctAnswer === "False",
        },
      ];
    }

    return {
      id: crypto.randomUUID(),
      dbId: q.id,
      type: componentType,
      text: q.question,
      options,
      correctAnswer: q.correctAnswer,
      points: q.points,
    };
  });
}

const createDefaultQuestion = (): Question => ({
  id: crypto.randomUUID(),
  type: "multiple-choice",
  text: "",
  options: [
    { id: crypto.randomUUID(), text: "", isCorrect: false },
    { id: crypto.randomUUID(), text: "", isCorrect: false },
    { id: crypto.randomUUID(), text: "", isCorrect: false },
    { id: crypto.randomUUID(), text: "", isCorrect: false },
  ],
  points: 10,
});

export function QuizBuilder({
  courseId,
  quizId,
  courseTitle,
  quizTitle,
  subCourseTitle,
  quizDescription,
  existingQuestionCount,
  existingQuestions,
}: QuizBuilderProps) {
  const router = useRouter();
  const [isSubmitting, startTransition] = useTransition();
  const [deletedDbIds, setDeletedDbIds] = useState<string[]>([]);

  const initialQuestions = existingQuestions.length
    ? mapExistingQuestions(existingQuestions)
    : [createDefaultQuestion()];

  const [quiz, setQuiz] = useState<Quiz>({
    title: quizTitle,
    description: quizDescription || "",
    questions: initialQuestions,
  });
  const [previewOpen, setPreviewOpen] = useState(false);

  const breadcrumbs = useMemo(() => {
    const crumbs: { label: string; href?: string }[] = [
      { label: "Courses", href: "/business-owner/courses" },
      { label: courseTitle, href: `/business-owner/courses/${courseId}` },
    ];
    if (subCourseTitle) {
      crumbs.push({ label: subCourseTitle });
    }
    crumbs.push({ label: quizTitle });
    crumbs.push({ label: "Questions" });
    return crumbs;
  }, [courseId, courseTitle, subCourseTitle, quizTitle]);

  const updateQuizDetails = (field: "title" | "description", value: string) => {
    setQuiz((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    startTransition(async () => {
      // Separate questions into updates and creations
      const updates = quiz.questions.filter((q) => q.dbId && !q.isDeleted);
      const creations = quiz.questions.filter((q) => !q.dbId && !q.isDeleted);

      // Handle deletions
      for (const dbId of deletedDbIds) {
        const result = await deleteQuizQuestion(courseId, quizId, dbId);
        if (!result.success) {
          toast.error(result.error || "Failed to delete question");
          return;
        }
      }

      // Handle updates
      for (let i = 0; i < updates.length; i++) {
        const question = updates[i];
        const correctAnswer =
          question.type === "short-answer"
            ? question.correctAnswer || ""
            : question.options.find((opt) => opt.isCorrect)?.text || "";

        const payload: QuizQuestionInput = {
          type: mapComponentTypeToDbType(question.type),
          question: question.text,
          correctAnswer,
          explanation: null,
          points: question.points,
          order: i,
          options:
            question.type === "multiple-choice"
              ? question.options.map((opt) => opt.text).filter(Boolean)
              : undefined,
        };

        const result = await updateQuizQuestion(
          courseId,
          quizId,
          question.dbId!,
          payload
        );
        if (!result.success) {
          toast.error(result.error || "Failed to update question");
          return;
        }
      }

      // Handle creations
      if (creations.length > 0) {
        const creationPayloads: QuizQuestionInput[] = creations.map(
          (question, i) => {
            const correctAnswer =
              question.type === "short-answer"
                ? question.correctAnswer || ""
                : question.options.find((opt) => opt.isCorrect)?.text || "";

            return {
              type: mapComponentTypeToDbType(question.type),
              question: question.text,
              correctAnswer,
              explanation: null,
              points: question.points,
              order: updates.length + i,
              options:
                question.type === "multiple-choice"
                  ? question.options.map((opt) => opt.text).filter(Boolean)
                  : undefined,
            };
          }
        );

        const result = await createQuizQuestions(
          courseId,
          quizId,
          creationPayloads
        );
        if (!result.success) {
          toast.error(result.error || "Failed to create questions");
          return;
        }
      }

      toast.success("Questions saved successfully");
      router.refresh();
    });
  };

  const addQuestion = () => {
    setQuiz((prev) => ({
      ...prev,
      questions: [...prev.questions, createDefaultQuestion()],
    }));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === id ? { ...q, ...updates } : q
      ),
    }));
  };

  const deleteQuestion = (id: string) => {
    const questionToDelete = quiz.questions.find((q) => q.id === id);
    if (questionToDelete?.dbId) {
      setDeletedDbIds((prev) => [...prev, questionToDelete.dbId!]);
    }
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));
  };

  const duplicateQuestion = (id: string) => {
    const questionToDuplicate = quiz.questions.find((q) => q.id === id);
    if (questionToDuplicate) {
      const duplicated: Question = {
        ...questionToDuplicate,
        id: crypto.randomUUID(),
        options: questionToDuplicate.options.map((opt) => ({
          ...opt,
          id: crypto.randomUUID(),
        })),
      };
      const index = quiz.questions.findIndex((q) => q.id === id);
      setQuiz((prev) => ({
        ...prev,
        questions: [
          ...prev.questions.slice(0, index + 1),
          duplicated,
          ...prev.questions.slice(index + 1),
        ],
      }));
    }
  };

  return (
    <>
      <QuizPreviewDialog
        quiz={quiz}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
      <PageLayout
        title="Manage Questions"
        description={
          subCourseTitle
            ? `${quizTitle} · ${subCourseTitle}`
            : quizTitle || "Manage quiz questions"
        }
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
        className="overflow-hidden"
      >
        <PageSection className="space-y-6 max-w-3xl mx-auto">
          {/* Breadcrumbs */}
          <div className="text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`}>
                {crumb.href ? (
                  <NextLink
                    className="text-primary hover:underline"
                    href={crumb.href}
                  >
                    {crumb.label}
                  </NextLink>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
                {index < breadcrumbs.length - 1 && (
                  <span className="px-2">/</span>
                )}
              </span>
            ))}
          </div>

          {/* Quiz Summary */}
          <div className="rounded-xl border bg-card/40 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Quiz summary</p>
            <p>{quizDescription || "No description provided."}</p>
            <p className="mt-2">
              Existing questions: <strong>{existingQuestionCount}</strong>
            </p>
          </div>

          <QuizHeader
            title={quiz.title}
            description={quiz.description}
            onTitleChange={(value) => updateQuizDetails("title", value)}
            onDescriptionChange={(value) =>
              updateQuizDetails("description", value)
            }
            onPreview={() => setPreviewOpen(true)}
            questionCount={quiz.questions.length}
          />

          <div className="space-y-4 mt-6">
            {quiz.questions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                onUpdate={(updates) => updateQuestion(question.id, updates)}
                onDelete={() => deleteQuestion(question.id)}
                onDuplicate={() => duplicateQuestion(question.id)}
                canDelete={quiz.questions.length > 1}
              />
            ))}
          </div>

          <div className="my-6 flex justify-center">
            <Button
              onClick={addQuestion}
              variant="outline"
              className="gap-2 border-dashed border-2 hover:border-primary hover:bg-accent bg-transparent"
            >
              <Plus className="h-4 w-4" />
              Add Question
            </Button>
          </div>

          {/* Save Actions */}
          <div className="sticky bottom-0 left-0 right-0 flex justify-end gap-2 border-t border-border bg-background/95 px-4 py-4 backdrop-blur supports-backdrop-filter:bg-background/80">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save Questions"}
            </Button>
          </div>
        </PageSection>
      </PageLayout>
    </>
  );
}
