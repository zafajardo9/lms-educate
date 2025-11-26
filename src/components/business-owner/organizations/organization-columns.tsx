"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Building2, LinkIcon, MoreHorizontal } from "lucide-react";
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
import { OrganizationPlan, OrganizationStatus } from "@/types";
import type { OrganizationListItem } from "./types";
import { cn } from "@/lib/utils";

export type OrganizationColumnData = OrganizationListItem;

interface OrganizationColumnsProps {
  onViewDetails?: (organization: OrganizationColumnData) => void;
  onManageMembers?: (organization: OrganizationColumnData) => void;
}

const planLabels: Record<OrganizationPlan, string> = {
  [OrganizationPlan.FREE]: "Free",
  [OrganizationPlan.PRO]: "Pro",
  [OrganizationPlan.GROWTH]: "Growth",
  [OrganizationPlan.ENTERPRISE]: "Enterprise",
};

const statusStyles: Record<OrganizationStatus, string> = {
  [OrganizationStatus.ACTIVE]:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  [OrganizationStatus.PAUSED]:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  [OrganizationStatus.SUSPENDED]:
    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

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
              <AvatarImage src={org.logoUrl ?? undefined} alt={org.name} />
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
      accessorKey: "plan",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Plan" />
      ),
      cell: ({ row }) => {
        const plan = row.getValue("plan") as OrganizationPlan;
        return (
          <Badge variant="secondary" className="font-normal">
            {planLabels[plan]}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        if (value === "all") return true;
        return row.getValue(id) === value;
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as OrganizationStatus;
        return (
          <Badge
            variant="secondary"
            className={cn("font-normal", statusStyles[status])}
          >
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        if (value === "all") return true;
        return row.getValue(id) === value;
      },
    },
    {
      accessorKey: "timezone",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Timezone" />
      ),
      cell: ({ row }) => {
        const timezone = row.getValue("timezone") as string | null;
        return (
          <span className="text-sm text-muted-foreground">
            {timezone || "—"}
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
