"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Building2, LinkIcon, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import type { OrganizationListItem } from "./types";

export type OrganizationColumnData = OrganizationListItem;

interface OrganizationColumnsProps {
  onViewDetails?: (organization: OrganizationColumnData) => void;
  onManageMembers?: (organization: OrganizationColumnData) => void;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function getOrganizationColumns({
  onViewDetails,
  onManageMembers,
}: OrganizationColumnsProps = {}): ColumnDef<OrganizationColumnData>[] {
  const columns: ColumnDef<OrganizationColumnData>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Organization" />
      ),
      cell: ({ row }) => {
        const org = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(org.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{org.name}</p>
              <p className="text-sm text-muted-foreground">{org.slug}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Description" />
      ),
      cell: ({ row }) => {
        const description = row.getValue("description") as string | null;
        return (
          <span className="text-sm text-muted-foreground">
            {description || "No description"}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.getValue("createdAt"))}
        </span>
      ),
    },
    {
      accessorKey: "ownerId",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Owner ID" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("ownerId")}
        </span>
      ),
    },
  ];

  if (onViewDetails || onManageMembers) {
    columns.push({
      id: "actions",
      cell: ({ row }) => {
        const org = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!onViewDetails}
                onClick={() => onViewDetails?.(org)}
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!onManageMembers}
                onClick={() => onManageMembers?.(org)}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Manage Members
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });
  }

  return columns;
}
