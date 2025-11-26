"use client";

import {
  BookOpen,
  Users,
  FileEdit,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { PageGrid, PageCard } from "@/components/shared/page-layout";

interface CourseStatsProps {
  totalCourses: number;
  activeCourses: number;
  draftCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
}

export function CourseStats({
  totalCourses,
  activeCourses,
  draftCourses,
  publishedCourses,
  totalEnrollments,
}: CourseStatsProps) {
  const stats = [
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
  ];

  return (
    <PageGrid columns={4} className="lg:grid-cols-5">
      {stats.map((stat) => (
        <PageCard key={stat.label} className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${stat.color}`}>
            <stat.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        </PageCard>
      ))}
    </PageGrid>
  );
}
