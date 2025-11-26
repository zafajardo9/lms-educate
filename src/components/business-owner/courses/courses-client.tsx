"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  PageLayout,
  PageSection,
  PageCard,
} from "@/components/shared/page-layout";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { CourseStats } from "./course-stats";
import { CourseFilters } from "./course-filters";
import { getCourseColumns, type CourseColumnData } from "./course-columns";
import { CourseCreateModal } from "./course-create-modal";
import { CourseEditModal } from "./course-edit-modal";
import { CourseDeleteModal } from "./course-delete-modal";
import { toggleEnrollment } from "./actions";
import type { CoursesResponse } from "./types";

interface CoursesClientProps {
  initialData: CoursesResponse;
}

export function CoursesClient({ initialData }: CoursesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Get current filters from URL
  const currentPage = Number(searchParams.get("page") ?? "1");
  const currentPageSize = Number(searchParams.get("pageSize") ?? "10");
  const currentSearch = searchParams.get("search") ?? "";
  const currentStatus = searchParams.get("status") ?? "all";
  const currentLevel = searchParams.get("level") ?? "all";

  // Local state for filters
  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const [statusFilter, setStatusFilter] = useState(currentStatus);
  const [levelFilter, setLevelFilter] = useState(currentLevel);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseColumnData | null>(
    null
  );

  // Update URL with new params
  const updateUrl = useCallback(
    (params: Record<string, string | number>) => {
      const newParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (
          value === "" ||
          value === "all" ||
          (key === "page" && value === 1)
        ) {
          newParams.delete(key);
        } else {
          newParams.set(key, String(value));
        }
      });

      startTransition(() => {
        router.push(`?${newParams.toString()}`, { scroll: false });
      });
    },
    [router, searchParams]
  );

  // Handle search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleSearchSubmit = () => {
    updateUrl({ search: searchQuery, page: 1 });
  };

  // Handle filter changes
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    updateUrl({ status: value, page: 1 });
  };

  const handleLevelChange = (value: string) => {
    setLevelFilter(value);
    updateUrl({ level: value, page: 1 });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setLevelFilter("all");
    startTransition(() => {
      router.push("/business-owner/courses", { scroll: false });
    });
  };

  // Handle pagination
  const handlePageChange = (pageIndex: number) => {
    updateUrl({ page: pageIndex + 1 });
  };

  const handlePageSizeChange = (pageSize: number) => {
    updateUrl({ pageSize, page: 1 });
  };

  // Handle course actions
  const handleView = (course: CourseColumnData) => {
    router.push(`/business-owner/courses/${course.id}`);
  };

  const handleEdit = (course: CourseColumnData) => {
    setSelectedCourse(course);
    setEditModalOpen(true);
  };

  const handleDelete = (course: CourseColumnData) => {
    setSelectedCourse(course);
    setDeleteModalOpen(true);
  };

  const handleToggleEnrollment = async (course: CourseColumnData) => {
    try {
      const result = await toggleEnrollment(course.id, !course.enrollmentOpen);
      if (result.success) {
        toast.success(
          `Enrollment ${!course.enrollmentOpen ? "opened" : "closed"} for ${
            course.title
          }`
        );
        router.refresh();
      } else {
        toast.error(result.error || "Failed to toggle enrollment");
      }
    } catch (error) {
      toast.error("Failed to toggle enrollment");
    }
  };

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  // Modal success handlers
  const handleCreateSuccess = () => {
    toast.success("Course created successfully");
    router.refresh();
  };

  const handleEditSuccess = () => {
    toast.success("Course updated successfully");
    setSelectedCourse(null);
    router.refresh();
  };

  const handleDeleteSuccess = () => {
    toast.success("Course deleted successfully");
    setSelectedCourse(null);
    router.refresh();
  };

  // Get columns with action handlers
  const columns = getCourseColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onToggleEnrollment: handleToggleEnrollment,
  });

  return (
    <PageLayout
      title="Course Management"
      description="Create and manage courses for your organization"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isPending}
          >
            <RefreshCw
              className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
            />
          </Button>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <CourseStats {...initialData.stats} />

        {/* Courses Table */}
        <PageSection title="All Courses">
          <PageCard noPadding className="overflow-hidden">
            <div className="p-4 border-b">
              <CourseFilters
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchSubmit={handleSearchSubmit}
                statusFilter={statusFilter}
                onStatusChange={handleStatusChange}
                levelFilter={levelFilter}
                onLevelChange={handleLevelChange}
                onClearFilters={handleClearFilters}
              />
            </div>
            <div className="p-4">
              <DataTable
                columns={columns}
                data={initialData.courses as CourseColumnData[]}
                showSearch={false}
                manualPagination
                pageCount={initialData.pagination.totalPages}
                pageIndex={currentPage - 1}
                pageSize={currentPageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                totalRows={initialData.pagination.total}
                isLoading={isPending}
              />
            </div>
          </PageCard>
        </PageSection>
      </div>

      {/* Modals */}
      <CourseCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />

      <CourseEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        course={selectedCourse}
        onSuccess={handleEditSuccess}
      />

      <CourseDeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        course={selectedCourse}
        onSuccess={handleDeleteSuccess}
      />
    </PageLayout>
  );
}
