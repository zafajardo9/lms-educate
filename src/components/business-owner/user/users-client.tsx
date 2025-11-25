"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageLayout, PageSection, PageCard } from "@/components/shared/page-layout";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { UserStats } from "./user-stats";
import { UserFilters } from "./user-filters";
import { getUserColumns, type UserColumnData } from "./user-columns";
import { UserCreateModal } from "./user-create-modal";
import { UserEditModal } from "./user-edit-modal";
import { UserDeleteModal } from "./user-delete-modal";
import { UserRoleModal } from "./user-role-modal";
import { toggleUserStatus, type UsersResponse } from "@/app/business-owner/users/actions";

interface UsersClientProps {
  initialData: UsersResponse;
}

export function UsersClient({ initialData }: UsersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Get current filters from URL
  const currentPage = Number(searchParams.get("page") ?? "1");
  const currentPageSize = Number(searchParams.get("pageSize") ?? "10");
  const currentSearch = searchParams.get("search") ?? "";
  const currentRole = searchParams.get("role") ?? "all";
  const currentStatus = searchParams.get("status") ?? "all";

  // Local state for filters (for immediate UI feedback)
  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const [roleFilter, setRoleFilter] = useState(currentRole);
  const [statusFilter, setStatusFilter] = useState(currentStatus);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserColumnData | null>(null);

  // Update URL with new params
  const updateUrl = useCallback(
    (params: Record<string, string | number>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      
      Object.entries(params).forEach(([key, value]) => {
        if (value === "" || value === "all" || (key === "page" && value === 1)) {
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

  // Handle search with debounce effect
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleSearchSubmit = () => {
    updateUrl({ search: searchQuery, page: 1 });
  };

  // Handle filter changes
  const handleRoleChange = (value: string) => {
    setRoleFilter(value);
    updateUrl({ role: value, page: 1 });
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    updateUrl({ status: value, page: 1 });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
    startTransition(() => {
      router.push("/business-owner/users", { scroll: false });
    });
  };

  // Handle pagination
  const handlePageChange = (pageIndex: number) => {
    updateUrl({ page: pageIndex + 1 });
  };

  const handlePageSizeChange = (pageSize: number) => {
    updateUrl({ pageSize, page: 1 });
  };

  // Handle user actions
  const handleEdit = (user: UserColumnData) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleDelete = (user: UserColumnData) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleChangeRole = (user: UserColumnData) => {
    setSelectedUser(user);
    setRoleModalOpen(true);
  };

  const handleToggleStatus = async (user: UserColumnData) => {
    try {
      const result = await toggleUserStatus(user.id);
      toast.success(
        `User ${user.name} ${result.isActive ? "activated" : "deactivated"} successfully`
      );
      router.refresh();
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  // Modal success handlers
  const handleCreateSuccess = () => {
    toast.success("User created successfully");
    router.refresh();
  };

  const handleEditSuccess = () => {
    toast.success("User updated successfully");
    setSelectedUser(null);
    router.refresh();
  };

  const handleDeleteSuccess = () => {
    toast.success("User deleted successfully");
    setSelectedUser(null);
    router.refresh();
  };

  const handleRoleSuccess = () => {
    toast.success("User role updated successfully");
    setSelectedUser(null);
    router.refresh();
  };

  // Get columns with action handlers
  const columns = getUserColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onToggleStatus: handleToggleStatus,
    onChangeRole: handleChangeRole,
  });

  return (
    <PageLayout
      title="User Management"
      description="Manage users, roles, and permissions across the platform"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isPending}>
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <UserStats {...initialData.stats} />

        {/* Users Table */}
        <PageSection title="All Users">
          <PageCard noPadding className="overflow-hidden">
            <div className="p-4 border-b">
              <UserFilters
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchSubmit={handleSearchSubmit}
                roleFilter={roleFilter}
                onRoleChange={handleRoleChange}
                statusFilter={statusFilter}
                onStatusChange={handleStatusChange}
                onClearFilters={handleClearFilters}
              />
            </div>
            <div className="p-4">
              <DataTable
                columns={columns}
                data={initialData.users}
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
      <UserCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />

      <UserEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        user={selectedUser}
        onSuccess={handleEditSuccess}
      />

      <UserDeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        user={selectedUser}
        onSuccess={handleDeleteSuccess}
      />

      <UserRoleModal
        open={roleModalOpen}
        onOpenChange={setRoleModalOpen}
        user={selectedUser}
        onSuccess={handleRoleSuccess}
      />
    </PageLayout>
  );
}
