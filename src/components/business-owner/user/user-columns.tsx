"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Shield,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/shared/data-table";
import { UserRole } from "@/types";
import { cn } from "@/lib/utils";

export interface UserColumnData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string | Date;
  avatar?: string | null;
}

interface UserColumnsProps {
  onEdit?: (user: UserColumnData) => void;
  onDelete?: (user: UserColumnData) => void;
  onToggleStatus?: (user: UserColumnData) => void;
  onChangeRole?: (user: UserColumnData) => void;
}

const roleColors: Record<UserRole, string> = {
  [UserRole.BUSINESS_OWNER]: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  [UserRole.LECTURER]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  [UserRole.STUDENT]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

const roleLabels: Record<UserRole, string> = {
  [UserRole.BUSINESS_OWNER]: "Business Owner",
  [UserRole.LECTURER]: "Lecturer",
  [UserRole.STUDENT]: "Student",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getUserColumns({
  onEdit,
  onDelete,
  onToggleStatus,
  onChangeRole,
}: UserColumnsProps = {}): ColumnDef<UserColumnData>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="User" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const role = row.getValue("role") as UserRole;
        return (
          <Badge
            variant="secondary"
            className={cn("font-normal", roleColors[role])}
          >
            {roleLabels[role]}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value === "all" || row.getValue(id) === value;
      },
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge
            variant="secondary"
            className={cn(
              "font-normal",
              isActive
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
            )}
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        if (value === "all") return true;
        const isActive = row.getValue(id) as boolean;
        return value === "active" ? isActive : !isActive;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Joined" />
      ),
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string | Date;
        return (
          <span className="text-muted-foreground">{formatDate(date)}</span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit?.(user)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangeRole?.(user)}>
                <Shield className="mr-2 h-4 w-4" />
                Change Role
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus?.(user)}>
                {user.isActive ? (
                  <>
                    <UserX className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(user)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
