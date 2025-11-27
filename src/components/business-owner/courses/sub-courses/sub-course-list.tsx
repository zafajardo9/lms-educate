"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  GraduationCap,
  MoreVertical,
  Pencil,
  Trash,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { SubCourseCreateModal } from "./sub-course-create-modal";
import { SubCourseEditModal } from "./sub-course-edit-modal";
import { SubCourseDeleteModal } from "./sub-course-delete-modal";
import type { SubCourse } from "./types";

interface SubCourseListProps {
  courseId: string;
  subCourses: SubCourse[];
}

export function SubCourseList({ courseId, subCourses }: SubCourseListProps) {
  const [editingSubCourse, setEditingSubCourse] = useState<SubCourse | null>(
    null
  );
  const [deletingSubCourse, setDeletingSubCourse] = useState<SubCourse | null>(
    null
  );
  const [openModuleId, setOpenModuleId] = useState<string | null>(
    subCourses[0]?.id ?? null
  );

  const orderedSubCourses = useMemo(
    () => [...subCourses].sort((a, b) => a.order - b.order),
    [subCourses]
  );

  const toggleModule = (id: string) => {
    setOpenModuleId((current) => (current === id ? null : id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Modules</h2>
        <SubCourseCreateModal courseId={courseId} />
      </div>

      {orderedSubCourses.length === 0 ? (
        <Card className="corner-none rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <p className="mb-2">No modules yet</p>
            <p className="text-sm">Create a module to start adding lessons.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orderedSubCourses.map((subCourse) => {
            const lessons = subCourse.lessons ?? [];
            const quizzes = subCourse.quizzes ?? [];
            const isOpen = openModuleId === subCourse.id;

            return (
              <Card
                key={subCourse.id}
                className={`corner-none rounded-2xl overflow-hidden border transition-all ${
                  isOpen
                    ? "border-primary/40 shadow-lg shadow-primary/5"
                    : "hover:border-primary/30"
                }`}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 bg-muted/40">
                  <button
                    type="button"
                    className="flex flex-1 flex-col items-start gap-1 text-left"
                    onClick={() => toggleModule(subCourse.id)}
                  >
                    <div className="flex w-full items-center justify-between">
                      <CardTitle className="text-base font-medium flex-1">
                        {subCourse.title}
                      </CardTitle>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Badge
                        variant={
                          subCourse.isPublished ? "default" : "secondary"
                        }
                      >
                        {subCourse.isPublished ? "Published" : "Draft"}
                      </Badge>
                      <span>•</span>
                      <span>
                        {lessons.length || subCourse._count?.lessons || 0}{" "}
                        Lessons
                      </span>
                      <span>•</span>
                      <span>
                        {quizzes.length || subCourse._count?.quizzes || 0}{" "}
                        Quizzes
                      </span>
                    </div>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="-mr-2 h-8 w-8"
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingSubCourse(subCourse)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeletingSubCourse(subCourse)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    {subCourse.description}
                  </p>
                  {isOpen && (
                    <div className="mt-4 space-y-6 border-t pt-4 pl-4 md:pl-6">
                      <section className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <BookOpen className="h-4 w-4" />
                            Lessons
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            title="Lesson management coming soon"
                          >
                            Add Lesson
                          </Button>
                        </div>
                        {lessons.length ? (
                          <ul className="space-y-2">
                            {lessons.map((lesson) => (
                              <li
                                key={lesson.id}
                                className="flex items-center justify-between rounded-md border border-dashed px-3 py-2 text-sm bg-background/80"
                              >
                                <div>
                                  <p className="font-medium">{lesson.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Order {lesson.order + 1}
                                    {lesson.duration
                                      ? ` · ${lesson.duration} min`
                                      : ""}
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    lesson.isPublished ? "default" : "secondary"
                                  }
                                >
                                  {lesson.isPublished ? "Live" : "Draft"}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-3 text-sm text-muted-foreground italic">
                            No lessons yet.
                          </p>
                        )}
                      </section>
                      <section className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <GraduationCap className="h-4 w-4" />
                            Quizzes
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled
                            title="Quiz management coming soon"
                          >
                            Add Quiz
                          </Button>
                        </div>
                        {quizzes.length ? (
                          <ul className="space-y-2">
                            {quizzes.map((quiz) => (
                              <li
                                key={quiz.id}
                                className="flex items-center justify-between rounded-md border border-dashed px-3 py-2 text-sm bg-background/80"
                              >
                                <div>
                                  <p className="font-medium">{quiz.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Order {quiz.order + 1}
                                    {quiz._count?.questions
                                      ? ` · ${quiz._count.questions} questions`
                                      : ""}
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    quiz.isPublished ? "default" : "secondary"
                                  }
                                >
                                  {quiz.isPublished ? "Live" : "Draft"}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-3 text-sm text-muted-foreground italic">
                            No quizzes yet.
                          </p>
                        )}
                      </section>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {editingSubCourse && (
        <SubCourseEditModal
          courseId={courseId}
          subCourse={editingSubCourse}
          open={true}
          onOpenChange={(open) => !open && setEditingSubCourse(null)}
        />
      )}

      {deletingSubCourse && (
        <SubCourseDeleteModal
          courseId={courseId}
          subCourse={deletingSubCourse}
          open={true}
          onOpenChange={(open) => !open && setDeletingSubCourse(null)}
        />
      )}
    </div>
  );
}
