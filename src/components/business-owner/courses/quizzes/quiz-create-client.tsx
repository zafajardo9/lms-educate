"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createQuiz } from "./actions";

const quizSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(1000),
  timeLimit: z
    .union([z.string(), z.number()])
    .optional()
    .refine(
      (val) =>
        val === undefined ||
        val === "" ||
        (!Number.isNaN(Number(val)) && Number(val) > 0),
      { message: "Time limit must be a positive number" }
    ),
  maxAttempts: z
    .union([z.string(), z.number()])
    .optional()
    .refine(
      (val) =>
        val === undefined ||
        val === "" ||
        (!Number.isNaN(Number(val)) && Number(val) >= 1),
      { message: "Max attempts must be at least 1" }
    ),
  passingScore: z
    .union([z.string(), z.number()])
    .optional()
    .refine(
      (val) =>
        val === undefined ||
        val === "" ||
        (!Number.isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100),
      { message: "Passing score must be between 0 and 100" }
    ),
  order: z
    .union([z.string(), z.number()])
    .optional()
    .refine(
      (val) =>
        val === undefined ||
        val === "" ||
        (!Number.isNaN(Number(val)) && Number(val) >= 0),
      { message: "Order must be a positive number" }
    ),
  isPublished: z.boolean().default(false),
});

type QuizFormValues = z.infer<typeof quizSchema>;

interface QuizCreateClientProps {
  courseId: string;
  courseTitle: string;
  subCourseId?: string;
  subCourseTitle?: string;
}

export function QuizCreateClient({
  courseId,
  courseTitle,
  subCourseId,
  subCourseTitle,
}: QuizCreateClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<QuizFormValues>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: "",
      description: "",
      timeLimit: "",
      maxAttempts: "1",
      passingScore: "70",
      order: "",
      isPublished: false,
    },
  });

  const onSubmit = (values: QuizFormValues) => {
    startTransition(async () => {
      const payload = {
        title: values.title,
        description: values.description,
        timeLimit:
          values.timeLimit === undefined || values.timeLimit === ""
            ? undefined
            : Number(values.timeLimit),
        maxAttempts:
          values.maxAttempts === undefined || values.maxAttempts === ""
            ? undefined
            : Number(values.maxAttempts),
        passingScore:
          values.passingScore === undefined || values.passingScore === ""
            ? undefined
            : Number(values.passingScore),
        order:
          values.order === undefined || values.order === ""
            ? undefined
            : Number(values.order),
        isPublished: values.isPublished,
      };

      const result = await createQuiz(courseId, subCourseId ?? null, payload);
      if (result.success) {
        toast.success("Quiz created successfully");
        router.push(`/business-owner/courses/${courseId}`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create quiz");
      }
    });
  };

  const sectionTitle = subCourseTitle
    ? `Add a new quiz to ${subCourseTitle}`
    : `Add a new quiz to ${courseTitle}`;

  const breadcrumbs: { label: string; href?: string }[] = [
    { label: "Courses", href: "/business-owner/courses" },
    { label: courseTitle, href: `/business-owner/courses/${courseId}` },
  ];

  if (subCourseTitle) {
    breadcrumbs.push({ label: subCourseTitle });
  }
  breadcrumbs.push({ label: "Create Quiz" });

  return (
    <PageLayout
      title="Create Quiz"
      description={sectionTitle}
      actions={
        <Button variant="outline" asChild>
          <NextLink href={`/business-owner/courses/${courseId}`}>
            Back to course
          </NextLink>
        </Button>
      }
    >
      <PageSection>
        <div className="mb-6 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.label}>
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quiz Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Module 1 Knowledge Check"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quiz Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="Describe the quiz scope"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="timeLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Limit (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Optional"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxAttempts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Attempts</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} placeholder="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="passingScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passing Score (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="70"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Auto"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Publish quiz</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Make this quiz visible to enrolled students.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Quiz"}
              </Button>
            </div>
          </form>
        </Form>
      </PageSection>
    </PageLayout>
  );
}
