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
import { OrganizationStats } from "./organization-stats";
import { OrganizationFilters } from "./organization-filters";
import { getOrganizationColumns } from "./organization-columns";
import type { OrganizationListItem, OrganizationsResponse } from "./types";
import { OrganizationPlan, OrganizationStatus } from "@/types";
import { OrganizationCreateModal } from "./organization-create-modal";
import {
  OrganizationEditDialog,
  OrganizationDeleteDialog,
  OrganizationMembersDialog,
} from "./index";

interface OrganizationsClientProps {
  initialData: OrganizationsResponse;
}

export function OrganizationsClient({ initialData }: OrganizationsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentPage = Number(searchParams.get("page") ?? "1");
  const currentPageSize = Number(searchParams.get("pageSize") ?? "10");
  const currentSearch = searchParams.get("search") ?? "";
  const currentPlan =
    (searchParams.get("plan") as OrganizationPlan | "all" | null) ?? "all";
  const currentStatus =
    (searchParams.get("status") as OrganizationStatus | "all" | null) ?? "all";

  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const [planFilter, setPlanFilter] = useState<OrganizationPlan | "all">(
    currentPlan
  );
  const [statusFilter, setStatusFilter] = useState<OrganizationStatus | "all">(
    currentStatus
  );

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] =
    useState<OrganizationListItem | null>(null);

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

  const handleSearchChange = (value: string) => setSearchQuery(value);
  const handleSearchSubmit = () => updateUrl({ search: searchQuery, page: 1 });

  const handlePlanChange = (value: OrganizationPlan | "all") => {
    setPlanFilter(value);
    updateUrl({ plan: value, page: 1 });
  };

  const handleStatusChange = (value: OrganizationStatus | "all") => {
    setStatusFilter(value);
    updateUrl({ status: value, page: 1 });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setPlanFilter("all");
    setStatusFilter("all");
    startTransition(() => {
      router.push("/business-owner/organizations", { scroll: false });
    });
  };

  const handlePageChange = (pageIndex: number) => {
    updateUrl({ page: pageIndex + 1 });
  };

  const handlePageSizeChange = (pageSize: number) => {
    updateUrl({ pageSize, page: 1 });
  };

  const handleRefresh = () => {
    startTransition(() => router.refresh());
  };

  const handleCreateSuccess = () => {
    toast.success("Organization created successfully");
    setCreateModalOpen(false);
    router.refresh();
  };

  const handleViewUsers = (organization: OrganizationListItem) => {
    setSelectedOrganization(organization);
    setMembersDialogOpen(true);
  };

  const handleEdit = (organization: OrganizationListItem) => {
    setSelectedOrganization(organization);
    setEditDialogOpen(true);
  };

  const handleDelete = (organization: OrganizationListItem) => {
    setSelectedOrganization(organization);
    setDeleteDialogOpen(true);
  };

  const handleEditDialogChange = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open && !membersDialogOpen && !deleteDialogOpen) {
      setSelectedOrganization(null);
    }
  };

  const handleDeleteDialogChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open && !membersDialogOpen && !editDialogOpen) {
      setSelectedOrganization(null);
    }
  };

  const handleMembersDialogChange = (open: boolean) => {
    setMembersDialogOpen(open);
    if (!open && !editDialogOpen && !deleteDialogOpen) {
      setSelectedOrganization(null);
    }
  };

  const handleEditSuccess = () => {
    toast.success("Organization updated successfully");
    router.refresh();
    handleEditDialogChange(false);
  };

  const handleDeleteSuccess = () => {
    toast.success("Organization deleted successfully");
    router.refresh();
    handleDeleteDialogChange(false);
  };

  const columns = getOrganizationColumns({
    onViewUsers: handleViewUsers,
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <PageLayout
      title="Organizations"
      description="Manage all organizations within your LMS workspace"
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
            New Organization
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <OrganizationStats {...initialData.stats} />

        <PageSection title="All Organizations">
          <PageCard noPadding className="overflow-hidden">
            <div className="border-b p-4">
              <OrganizationFilters
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchSubmit={handleSearchSubmit}
                planFilter={planFilter}
                onPlanChange={handlePlanChange}
                statusFilter={statusFilter}
                onStatusChange={handleStatusChange}
                onClearFilters={handleClearFilters}
                isPending={isPending}
              />
            </div>
            <div className="p-4">
              <DataTable
                columns={columns}
                data={initialData.organizations}
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

      <OrganizationCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />

      <OrganizationEditDialog
        open={editDialogOpen}
        onOpenChange={handleEditDialogChange}
        organization={selectedOrganization}
        onSuccess={handleEditSuccess}
      />

      <OrganizationDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={handleDeleteDialogChange}
        organization={selectedOrganization}
        onSuccess={handleDeleteSuccess}
      />

      <OrganizationMembersDialog
        open={membersDialogOpen}
        onOpenChange={handleMembersDialogChange}
        organization={selectedOrganization}
      />
    </PageLayout>
  );
}
