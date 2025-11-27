"use client";

import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TiptapLink from "@tiptap/extension-link";
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
import { createLesson } from "./actions";

const lessonSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
  videoUrl: z
    .union([z.string().url({ message: "Enter a valid URL" }), z.literal("")])
    .optional(),
  duration: z
    .union([z.string(), z.number()])
    .optional()
    .refine(
      (val) =>
        val === undefined ||
        val === "" ||
        (!Number.isNaN(Number(val)) && Number(val) >= 0),
      { message: "Duration must be a positive number" }
    ),
  attachments: z
    .array(z.string().url({ message: "Enter valid attachment URLs" }))
    .default([]),
  isPublished: z.boolean().default(false),
});

type LessonFormValues = z.infer<typeof lessonSchema>;

interface LessonCreateClientProps {
  courseId: string;
  subCourseId: string;
  courseTitle: string;
  subCourseTitle: string;
}

export function LessonCreateClient({
  courseId,
  subCourseId,
  courseTitle,
  subCourseTitle,
}: LessonCreateClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [attachmentInput, setAttachmentInput] = useState("");

  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: "",
      content: "",
      videoUrl: "",
      duration: "",
      attachments: [],
      isPublished: false,
    },
  });

  const placeholderText = useMemo(
    () => `Write the content for ${subCourseTitle}`,
    [subCourseTitle]
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Placeholder.configure({ placeholder: placeholderText }),
      CharacterCount.configure({ limit: 50000 }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TiptapLink.configure({ openOnClick: false }),
    ],
    content: form.getValues("content"),
    onUpdate: ({ editor }) => {
      form.setValue("content", editor.getHTML(), { shouldValidate: true });
    },
    immediatelyRender: false,
  });

  const onSubmit = (values: LessonFormValues) => {
    startTransition(async () => {
      const payload = {
        title: values.title,
        content: values.content,
        videoUrl: values.videoUrl ? values.videoUrl : undefined,
        duration:
          values.duration === undefined || values.duration === ""
            ? undefined
            : Number(values.duration),
        attachments: values.attachments,
        isPublished: values.isPublished,
      };

      const result = await createLesson(courseId, subCourseId, payload);
      if (result.success) {
        toast.success("Lesson created successfully");
        router.push(`/business-owner/courses/${courseId}`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create lesson");
      }
    });
  };

  return (
    <PageLayout
      title="Create Lesson"
      description={`Add a new lesson to ${subCourseTitle}`}
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
          <NextLink
            href="/business-owner/courses"
            className="text-primary hover:underline"
          >
            Courses
          </NextLink>
          <span className="px-2">/</span>
          <NextLink
            href={`/business-owner/courses/${courseId}`}
            className="text-primary hover:underline"
          >
            {courseTitle}
          </NextLink>
          <span className="px-2">/</span>
          <span className="text-foreground">Create Lesson</span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Introduction to React"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson Content</FormLabel>
                  <FormControl>
                    <div className="rounded-lg border">
                      <EditorToolbar editor={editor} />
                      {editor ? (
                        <EditorContent
                          editor={editor}
                          className="prose prose-sm min-h-[320px] max-w-none px-3 py-4 focus:outline-none"
                        />
                      ) : (
                        <div className="min-h-[320px] animate-pulse bg-muted/40" />
                      )}
                      <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                        {editor?.storage.characterCount?.characters() ?? 0}
                        /50000 characters
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attachments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attachments</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      {field.value?.length ? (
                        field.value.map((attachment, index) => (
                          <div key={attachment + index} className="flex gap-2">
                            <Input
                              placeholder="https://resource-link"
                              value={attachment}
                              onChange={(event) => {
                                const next = [...(field.value || [])];
                                next[index] = event.target.value;
                                field.onChange(next);
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const next = (field.value || []).filter(
                                  (_, i) => i !== index
                                );
                                field.onChange(next);
                              }}
                            >
                              ✕
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No attachments added yet.
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add attachment URL"
                          value={attachmentInput}
                          onChange={(event) =>
                            setAttachmentInput(event.target.value)
                          }
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            if (!attachmentInput.trim()) return;
                            field.onChange([
                              ...(field.value || []),
                              attachmentInput.trim(),
                            ]);
                            setAttachmentInput("");
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Attach supporting links or assets (PDFs, slides, etc.).
                        URLs only for now.
                      </p>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video URL</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="60"
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
                    <FormLabel className="text-base">Publish lesson</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Make this lesson visible to enrolled students.
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
                {isPending ? "Creating..." : "Create Lesson"}
              </Button>
            </div>
          </form>
        </Form>
      </PageSection>
    </PageLayout>
  );
}

interface EditorToolbarProps {
  editor: Editor | null;
}

function EditorToolbar({ editor }: EditorToolbarProps) {
  const isDisabled = !editor;

  const run = (cb: () => void) => {
    if (!editor) return;
    cb();
  };

  const promptForLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string;
    const url = window.prompt("Enter URL", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap gap-1 border-b bg-muted/40 px-3 py-2 text-sm">
      <ToolbarButton
        label="Bold"
        isActive={editor?.isActive("bold")}
        disabled={isDisabled}
        onClick={() => run(() => editor!.chain().focus().toggleBold().run())}
      />
      <ToolbarButton
        label="Italic"
        isActive={editor?.isActive("italic")}
        disabled={isDisabled}
        onClick={() => run(() => editor!.chain().focus().toggleItalic().run())}
      />
      <ToolbarButton
        label="Underline"
        isActive={editor?.isActive("underline")}
        disabled={isDisabled}
        onClick={() =>
          run(() => editor!.chain().focus().toggleUnderline().run())
        }
      />
      <ToolbarButton
        label="Strike"
        isActive={editor?.isActive("strike")}
        disabled={isDisabled}
        onClick={() => run(() => editor!.chain().focus().toggleStrike().run())}
      />
      <ToolbarButton
        label="H2"
        isActive={editor?.isActive("heading", { level: 2 })}
        disabled={isDisabled}
        onClick={() =>
          run(() => editor!.chain().focus().toggleHeading({ level: 2 }).run())
        }
      />
      <ToolbarButton
        label="H3"
        isActive={editor?.isActive("heading", { level: 3 })}
        disabled={isDisabled}
        onClick={() =>
          run(() => editor!.chain().focus().toggleHeading({ level: 3 }).run())
        }
      />
      <ToolbarButton
        label="Quote"
        isActive={editor?.isActive("blockquote")}
        disabled={isDisabled}
        onClick={() =>
          run(() => editor!.chain().focus().toggleBlockquote().run())
        }
      />
      <ToolbarButton
        label="Code"
        isActive={editor?.isActive("codeBlock")}
        disabled={isDisabled}
        onClick={() =>
          run(() => editor!.chain().focus().toggleCodeBlock().run())
        }
      />
      <ToolbarButton
        label="Bullets"
        isActive={editor?.isActive("bulletList")}
        disabled={isDisabled}
        onClick={() =>
          run(() => editor!.chain().focus().toggleBulletList().run())
        }
      />
      <ToolbarButton
        label="Ordered"
        isActive={editor?.isActive("orderedList")}
        disabled={isDisabled}
        onClick={() =>
          run(() => editor!.chain().focus().toggleOrderedList().run())
        }
      />
      <ToolbarButton
        label="Left"
        isActive={editor?.isActive({ textAlign: "left" })}
        disabled={isDisabled}
        onClick={() =>
          run(() => editor!.chain().focus().setTextAlign("left").run())
        }
      />
      <ToolbarButton
        label="Center"
        isActive={editor?.isActive({ textAlign: "center" })}
        disabled={isDisabled}
        onClick={() =>
          run(() => editor!.chain().focus().setTextAlign("center").run())
        }
      />
      <ToolbarButton
        label="Right"
        isActive={editor?.isActive({ textAlign: "right" })}
        disabled={isDisabled}
        onClick={() =>
          run(() => editor!.chain().focus().setTextAlign("right").run())
        }
      />
      <ToolbarButton
        label={editor?.isActive("link") ? "Edit Link" : "Link"}
        isActive={editor?.isActive("link")}
        disabled={isDisabled}
        onClick={promptForLink}
      />
      <ToolbarButton
        label="Clear"
        disabled={isDisabled}
        onClick={() =>
          run(() =>
            editor!
              .chain()
              .focus()
              .unsetAllMarks()
              .clearNodes()
              .setTextAlign("left")
              .run()
          )
        }
      />
    </div>
  );
}

interface ToolbarButtonProps {
  label: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

function ToolbarButton({
  label,
  onClick,
  isActive,
  disabled,
}: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant={isActive ? "secondary" : "ghost"}
      size="sm"
      className="h-8 px-2"
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </Button>
  );
}
