"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Users,
  FileEdit,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { PageGrid, PageCard } from "@/components/shared/page-layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CourseStatsProps {
  totalCourses: number;
  activeCourses: number;
  draftCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
}

export function CourseStats(props: CourseStatsProps) {
  const {
    totalCourses,
    activeCourses,
    draftCourses,
    publishedCourses,
    totalEnrollments,
  } = props;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [renderDetailedStats, setRenderDetailedStats] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      setRenderDetailedStats(true);
    }
  }, [isModalOpen]);

  const stats = useMemo(
    () => [
      {
        label: "Total Courses",
        value: totalCourses,
        icon: BookOpen,
        color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
      },
      {
        label: "Active Courses",
        value: activeCourses,
        icon: CheckCircle,
        color: "text-green-600 bg-green-100 dark:bg-green-900/30",
      },
      {
        label: "Draft Courses",
        value: draftCourses,
        icon: FileEdit,
        color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30",
      },
      {
        label: "Published",
        value: publishedCourses,
        icon: TrendingUp,
        color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
      },
      {
        label: "Total Enrollments",
        value: totalEnrollments,
        icon: Users,
        color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30",
      },
    ],
    [
      totalCourses,
      activeCourses,
      draftCourses,
      publishedCourses,
      totalEnrollments,
    ]
  );

  return (
    <>
      <PageCard className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Course overview
          </p>
          <p className="text-3xl font-semibold">
            {totalCourses}
            <span className="text-base font-normal text-muted-foreground ml-2">
              total courses
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            {publishedCourses} published · {activeCourses} active ·{" "}
            {draftCourses} draft
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>View analytics</Button>
      </PageCard>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Course analytics</DialogTitle>
            <DialogDescription>
              Detailed course distribution and enrollment metrics.
            </DialogDescription>
          </DialogHeader>

          {renderDetailedStats ? (
            <PageGrid columns={2} className="lg:grid-cols-3">
              {stats.map((stat) => (
                <PageCard key={stat.label} className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </PageCard>
              ))}
            </PageGrid>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Preparing analytics…
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
