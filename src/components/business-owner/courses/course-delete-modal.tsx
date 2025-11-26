"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { deleteCourse } from "./actions";
import type { CourseColumnData } from "./course-columns";

interface CourseDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: CourseColumnData | null;
  onSuccess: () => void;
}

export function CourseDeleteModal({
  open,
  onOpenChange,
  course,
  onSuccess,
}: CourseDeleteModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!course) return;

    setIsLoading(true);
    try {
      const result = await deleteCourse(course.id);
      if (result.success) {
        onOpenChange(false);
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to delete course:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Course</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{course?.title}</strong>?
            This action cannot be undone. All associated subcourses, lessons,
            quizzes, and enrollments will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Course
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
