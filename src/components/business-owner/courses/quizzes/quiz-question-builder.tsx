"use client";

import NextLink from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  useFieldArray,
  useForm,
  type Control,
  type UseFormSetValue,
  type UseFormWatch,
} from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  GripVertical,
  Plus,
  Trash,
} from "lucide-react";

import { PageLayout, PageSection } from "@/components/shared/page-layout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  createQuizQuestions,
  updateQuizQuestion,
  type QuizQuestionInput,
  type QuizQuestionType,
} from "./actions";

const optionSchema = z.object({
  value: z.string().min(1, "Option is required"),
});

const questionSchema = z
  .object({
    questionId: z.string().optional(),
    type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER", "ESSAY"]),
    question: z.string().min(1, "Question text is required"),
    options: z.array(optionSchema).optional(),
    correctAnswer: z.string().min(1, "Correct answer is required"),
    explanation: z.string().max(1000).optional().or(z.literal("")),
    points: z.union([z.string(), z.number()]).optional(),
    order: z.union([z.string(), z.number()]).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "MULTIPLE_CHOICE") {
      const optionValues = value.options ?? [];
      if (optionValues.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: "Multiple choice questions need at least two options",
        });
      }

      const hasMatchingAnswer = optionValues.some(
        (option) => option.value.trim() === value.correctAnswer.trim()
      );

      if (!hasMatchingAnswer) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["correctAnswer"],
          message: "Correct answer must match one of the options",
        });
      }
    }

    if (value.type === "TRUE_FALSE") {
      if (value.correctAnswer !== "True" && value.correctAnswer !== "False") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["correctAnswer"],
          message: "Select either True or False",
        });
      }
    }
  });

const questionBuilderSchema = z.object({
  questions: z.array(questionSchema).min(1, "Add at least one question"),
});

type QuestionBuilderFormValues = z.infer<typeof questionBuilderSchema>;

type OptionField = { value: string };

type QuestionField = QuestionBuilderFormValues["questions"][number];

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

function getDefaultQuestion(): QuestionField {
  return {
    questionId: undefined,
    type: "MULTIPLE_CHOICE",
    question: "",
    correctAnswer: "",
    explanation: "",
    points: "1",
    order: "",
    options: [{ value: "" }, { value: "" }],
  };
}

function mapExistingQuestions(
  existingQuestions: ExistingQuestion[]
): QuestionField[] {
  if (!existingQuestions.length) {
    return [getDefaultQuestion()];
  }

  return existingQuestions.map((question) => ({
    questionId: question.id,
    type: question.type,
    question: question.question,
    options:
      question.type === "MULTIPLE_CHOICE"
        ? (question.options ?? []).map((option) => ({ value: option }))
        : [],
    correctAnswer: question.correctAnswer ?? "",
    explanation: question.explanation ?? "",
    points: question.points?.toString() ?? "1",
    order:
      question.order === null || question.order === undefined
        ? ""
        : question.order.toString(),
  }));
}

interface QuizQuestionBuilderProps {
  courseId: string;
  quizId: string;
  courseTitle: string;
  quizTitle: string;
  subCourseTitle?: string | null;
  quizDescription?: string | null;
  existingQuestionCount: number;
  existingQuestions: ExistingQuestion[];
}

export function QuizQuestionBuilder({
  courseId,
  quizId,
  courseTitle,
  quizTitle,
  subCourseTitle,
  quizDescription,
  existingQuestionCount,
  existingQuestions,
}: QuizQuestionBuilderProps) {
  const router = useRouter();
  const [isSubmitting, startTransition] = useTransition();
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(
    null
  );

  const initialQuestions = existingQuestions.length
    ? mapExistingQuestions(existingQuestions)
    : [getDefaultQuestion()];

  const form = useForm<QuestionBuilderFormValues>({
    resolver: zodResolver(questionBuilderSchema),
    defaultValues: {
      questions: initialQuestions,
    },
  });

  const { control, handleSubmit, watch, setValue, getValues, reset } = form;

  const { fields, append, remove, swap, insert } = useFieldArray({
    control,
    name: "questions",
  });

  useEffect(() => {
    reset({
      questions: existingQuestions.length
        ? mapExistingQuestions(existingQuestions)
        : [getDefaultQuestion()],
    });
  }, [existingQuestions, reset]);

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

  const onSubmit = (values: QuestionBuilderFormValues) => {
    startTransition(async () => {
      const submissionQuestions = values.questions.map((question, index) => {
        const numericPoints =
          question.points === undefined || question.points === ""
            ? 1
            : Number(question.points);
        const numericOrder =
          question.order === undefined || question.order === ""
            ? index
            : Number(question.order);
        const optionValues = (question.options ?? [])
          .map((option) => option.value.trim())
          .filter(Boolean);

        const payload: QuizQuestionInput = {
          type: question.type,
          question: question.question.trim(),
          correctAnswer: question.correctAnswer.trim(),
          explanation: question.explanation?.trim() || null,
          points: Number.isNaN(numericPoints) ? 1 : numericPoints,
          order: Number.isNaN(numericOrder) ? index : numericOrder,
          options:
            question.type === "MULTIPLE_CHOICE" ? optionValues : undefined,
        };

        return {
          questionId: question.questionId,
          payload,
        };
      });

      const updates = submissionQuestions.filter((q) => q.questionId);
      const creations = submissionQuestions
        .filter((q) => !q.questionId)
        .map((q) => q.payload);

      for (const item of updates) {
        const result = await updateQuizQuestion(
          courseId,
          quizId,
          item.questionId!,
          item.payload
        );

        if (!result.success) {
          toast.error(result.error || "Failed to update question");
          return;
        }
      }

      if (creations.length) {
        const creationResult = await createQuizQuestions(
          courseId,
          quizId,
          creations
        );

        if (!creationResult.success) {
          toast.error(creationResult.error || "Failed to create questions");
          return;
        }
      }

      if (!updates.length && !creations.length) {
        toast.info("No changes to save");
        return;
      }

      toast.success("Questions saved successfully");
      router.refresh();
    });
  };

  const handleDuplicate = (index: number) => {
    const question = getValues(`questions.${index}`);
    insert(index + 1, {
      ...question,
      questionId: undefined,
      options:
        question.options?.map((option) => ({ value: option.value })) ?? [],
    });
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index > 0) {
      swap(index, index - 1);
    }
    if (direction === "down" && index < fields.length - 1) {
      swap(index, index + 1);
    }
  };

  return (
    <PageLayout
      title={`Manage Questions`}
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
      <PageSection className="space-y-6 max-w-4xl">
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

        <div className="rounded-xl border bg-card/40 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Quiz summary</p>
          <p>{quizDescription || "No description provided."}</p>
          <p className="mt-2">
            Existing questions: <strong>{existingQuestionCount}</strong>
          </p>
        </div>

        <Form {...form}>
          <form className="space-y-6 pb-32" onSubmit={handleSubmit(onSubmit)}>
            {fields.map((field, index) => (
              <QuestionCard
                key={field.id}
                index={index}
                control={control}
                watch={watch}
                setValue={setValue}
                remove={remove}
                onDuplicate={handleDuplicate}
                onMove={handleMove}
                isFirst={index === 0}
                isLast={index === fields.length - 1}
                isActive={activeQuestionIndex === index}
                setActiveQuestionIndex={setActiveQuestionIndex}
              />
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => append(getDefaultQuestion())}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" /> Add another question
            </Button>

            <Separator />
          </form>
        </Form>
      </PageSection>

      <div className="fixed bottom-4 right-6 left-[calc(var(--sidebar-width,16rem)+1.5rem)] z-10 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="quiz-question-builder-form"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save questions"}
        </Button>
      </div>
    </PageLayout>
  );
}

interface QuestionCardProps {
  index: number;
  control: Control<QuestionBuilderFormValues>;
  watch: UseFormWatch<QuestionBuilderFormValues>;
  setValue: UseFormSetValue<QuestionBuilderFormValues>;
  remove: (index?: number | number[]) => void;
  onDuplicate: (index: number) => void;
  onMove: (index: number, direction: "up" | "down") => void;
  isFirst: boolean;
  isLast: boolean;
  isActive: boolean;
  setActiveQuestionIndex: (value: number | null) => void;
}

function QuestionCard({
  index,
  control,
  watch,
  setValue,
  remove,
  onDuplicate,
  onMove,
  isFirst,
  isLast,
  isActive,
  setActiveQuestionIndex,
}: QuestionCardProps) {
  const questionType: QuizQuestionType = watch(`questions.${index}.type`);
  const options = watch(`questions.${index}.options`) as
    | OptionField[]
    | undefined;
  const correctAnswer = watch(`questions.${index}.correctAnswer`);
  const questionId = watch(`questions.${index}.questionId`);

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
    replace: replaceOptions,
  } = useFieldArray({
    control,
    name: `questions.${index}.options`,
  });

  const ensureOptionsForMultipleChoice = () => {
    if (questionType !== "MULTIPLE_CHOICE") {
      return;
    }

    const optionValues = options ?? [];
    if (optionValues.length >= 2) {
      return;
    }

    const padded: OptionField[] = [...optionValues];
    while (padded.length < 2) {
      padded.push({ value: "" });
    }

    setValue(`questions.${index}.options` as const, padded, {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  useEffect(() => {
    ensureOptionsForMultipleChoice();
    if (questionType === "TRUE_FALSE") {
      if (correctAnswer !== "True" && correctAnswer !== "False") {
        setValue(`questions.${index}.correctAnswer`, "True", {
          shouldDirty: true,
          shouldTouch: true,
        });
      }
    }
  }, [questionType, correctAnswer, index, setValue]);

  const handleTypeChange = (
    value: QuizQuestionType,
    onChange: (value: QuizQuestionType) => void
  ) => {
    onChange(value);
    if (value === "MULTIPLE_CHOICE") {
      ensureOptionsForMultipleChoice();
    } else if (value === "TRUE_FALSE") {
      replaceOptions([]);
      setValue(`questions.${index}.correctAnswer`, "True", {
        shouldDirty: true,
        shouldTouch: true,
      });
    } else {
      replaceOptions([]);
      setValue(`questions.${index}.correctAnswer`, "", {
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border-2 bg-background/80 p-4 transition-colors",
        isActive
          ? "border-primary shadow-lg shadow-primary/20"
          : "border-border hover:border-primary/40"
      )}
      onFocusCapture={() => setActiveQuestionIndex(index)}
      onBlurCapture={(event) => {
        const relatedTarget = event.relatedTarget as HTMLElement | null;
        if (!event.currentTarget.contains(relatedTarget)) {
          setActiveQuestionIndex(null);
        }
      }}
    >
      <div className="flex flex-col gap-2 border-b pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          Question {index + 1}
          {questionId && <Badge variant="outline">Saved</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onMove(index, "up")}
            disabled={isFirst}
          >
            Move up
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onMove(index, "down")}
            disabled={isLast}
          >
            Move down
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(index)}
          >
            <Copy className="mr-1 h-4 w-4" /> Duplicate
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(index)}
            className="text-destructive hover:text-destructive"
          >
            <Trash className="mr-1 h-4 w-4" /> Remove
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <FormField
          control={control}
          name={`questions.${index}.type`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question type</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value: QuizQuestionType) =>
                  handleTypeChange(value, field.onChange)
                }
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="MULTIPLE_CHOICE">
                    Multiple choice
                  </SelectItem>
                  <SelectItem value="TRUE_FALSE">True or False</SelectItem>
                  <SelectItem value="SHORT_ANSWER">Short answer</SelectItem>
                  <SelectItem value="ESSAY">Essay</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`questions.${index}.question`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question prompt</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Type your question"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {questionType === "MULTIPLE_CHOICE" && (
          <div className="rounded-xl border bg-muted/20 p-4">
            <Label className="text-sm font-medium">Answer choices</Label>
            <div className="mt-3 space-y-3">
              {optionFields.map((optionField, optionIndex) => (
                <div
                  key={optionField.id}
                  className="flex flex-col gap-2 rounded-md border bg-background p-3 md:flex-row md:items-center"
                >
                  <FormField
                    control={control}
                    name={`questions.${index}.options.${optionIndex}.value`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder={`Option ${optionIndex + 1}`}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={
                        correctAnswer === (options?.[optionIndex]?.value ?? "")
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setValue(
                          `questions.${index}.correctAnswer`,
                          options?.[optionIndex]?.value ?? "",
                          { shouldDirty: true, shouldTouch: true }
                        )
                      }
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Correct
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(optionIndex)}
                      disabled={optionFields.length <= 2}
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Remove option</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => appendOption({ value: "" })}
            >
              <Plus className="mr-1 h-4 w-4" /> Add option
            </Button>
          </div>
        )}

        {questionType === "TRUE_FALSE" && (
          <div className="rounded-xl border bg-muted/20 p-4">
            <Label className="text-sm font-medium">Correct answer</Label>
            <div className="mt-3 flex gap-2">
              {(["True", "False"] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={correctAnswer === value ? "default" : "outline"}
                  onClick={() =>
                    setValue(`questions.${index}.correctAnswer`, value, {
                      shouldDirty: true,
                      shouldTouch: true,
                    })
                  }
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>
        )}

        {questionType !== "MULTIPLE_CHOICE" &&
          questionType !== "TRUE_FALSE" && (
            <FormField
              control={control}
              name={`questions.${index}.correctAnswer`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correct answer</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Provide the correct answer"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name={`questions.${index}.points`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Points</FormLabel>
                <FormControl>
                  <Input type="number" min={1} placeholder="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`questions.${index}.order`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order (optional)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} placeholder="Auto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name={`questions.${index}.explanation`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Explanation (optional)</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Add feedback for students"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
