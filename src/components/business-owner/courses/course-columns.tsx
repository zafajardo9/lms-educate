"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Users,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CourseStatus, CourseLevel } from "@/types";

export interface CourseColumnData {
  id: string;
  title: string;
  description: string;
  status: CourseStatus;
  level: CourseLevel;
  isPublished: boolean;
  enrollmentOpen: boolean;
  price: number | null;
  category: string | null;
  createdAt: string;
  lecturer: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    enrollments: number;
    subCourses: number;
  };
}

interface GetColumnsProps {
  onEdit: (course: CourseColumnData) => void;
  onDelete: (course: CourseColumnData) => void;
  onView: (course: CourseColumnData) => void;
  onToggleEnrollment: (course: CourseColumnData) => void;
}

const statusColors: Record<CourseStatus, string> = {
  [CourseStatus.DRAFT]:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  [CourseStatus.ACTIVE]:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  [CourseStatus.DISABLED]:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  [CourseStatus.ARCHIVED]:
    "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const levelColors: Record<CourseLevel, string> = {
  [CourseLevel.BEGINNER]:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  [CourseLevel.INTERMEDIATE]:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  [CourseLevel.ADVANCED]:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
};

export function getCourseColumns({
  onEdit,
  onDelete,
  onView,
  onToggleEnrollment,
}: GetColumnsProps): ColumnDef<CourseColumnData>[] {
  return [
    {
      accessorKey: "title",
      header: "Course",
      cell: ({ row }) => {
        const course = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{course.title}</span>
            <span className="text-sm text-muted-foreground truncate max-w-[300px]">
              {course.description}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "lecturer.name",
      header: "Instructor",
      cell: ({ row }) => {
        const lecturer = row.original.lecturer;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{lecturer.name}</span>
            <span className="text-xs text-muted-foreground">
              {lecturer.email}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant="secondary" className={statusColors[status]}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "level",
      header: "Level",
      cell: ({ row }) => {
        const level = row.original.level;
        return (
          <Badge variant="outline" className={levelColors[level]}>
            {level}
          </Badge>
        );
      },
    },
    {
      accessorKey: "enrollmentOpen",
      header: "Enrollment",
      cell: ({ row }) => {
        const isOpen = row.original.enrollmentOpen;
        return (
          <Badge variant={isOpen ? "default" : "secondary"}>
            {isOpen ? "Open" : "Closed"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "_count.enrollments",
      header: "Students",
      cell: ({ row }) => {
        const count = row.original._count?.enrollments || 0;
        return (
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{count}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return (
          <span className="text-sm text-muted-foreground">
            {date.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const course = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onView(course)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(course)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Course
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleEnrollment(course)}>
                {course.enrollmentOpen ? (
                  <>
                    <ToggleLeft className="mr-2 h-4 w-4" />
                    Close Enrollment
                  </>
                ) : (
                  <>
                    <ToggleRight className="mr-2 h-4 w-4" />
                    Open Enrollment
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(course)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Course
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
