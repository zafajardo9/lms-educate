"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  UserPlus,
  GraduationCap,
  UsersRound,
  Lightbulb,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageLayout, PageSection } from "@/components/shared/page-layout";
import { SubCourseList } from "./sub-courses/sub-course-list";
import { CourseGuideModal } from "./course-guide-modal";
import type { SubCourse } from "./sub-courses/types";

interface CourseDetailsClientProps {
  course: {
    id: string;
    title: string;
    description: string | null;
    isPublished: boolean;
  };
  subCourses: SubCourse[];
}

export function CourseDetailsClient({
  course,
  subCourses,
}: CourseDetailsClientProps) {
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <>
      <PageLayout
        title={course.title}
        description={course.description || "Manage your course content"}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/business-owner/courses">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Courses
              </Link>
            </Button>
            <div className="h-6 w-px bg-border" />
            <Button variant="outline" asChild>
              <Link href={`/business-owner/courses/${course.id}/instructors`}>
                <UserPlus className="mr-2 h-4 w-4" />
                Instructors
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/business-owner/courses/${course.id}/groups`}>
                <UsersRound className="mr-2 h-4 w-4" />
                Groups
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/business-owner/courses/${course.id}/enrollments`}>
                <GraduationCap className="mr-2 h-4 w-4" />
                Enrollments
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/business-owner/courses/${course.id}/cohorts`}>
                <Users className="mr-2 h-4 w-4" />
                Cohorts
              </Link>
            </Button>
            <div className="h-6 w-px bg-border" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsGuideOpen(true)}
              title="Course Guide"
            >
              <Lightbulb className="h-4 w-4 text-yellow-500" />
            </Button>
          </div>
        }
      >
        <PageSection>
          <SubCourseList courseId={course.id} subCourses={subCourses} />
        </PageSection>
      </PageLayout>

      <CourseGuideModal open={isGuideOpen} onOpenChange={setIsGuideOpen} />
    </>
  );
}
