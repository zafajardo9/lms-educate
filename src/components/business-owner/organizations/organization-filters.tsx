"use client";

import type { FormEvent } from "react";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrganizationPlan, OrganizationStatus } from "@/types";

interface OrganizationFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  planFilter: OrganizationPlan | "all";
  onPlanChange: (value: OrganizationPlan | "all") => void;
  statusFilter: OrganizationStatus | "all";
  onStatusChange: (value: OrganizationStatus | "all") => void;
  onClearFilters: () => void;
  isPending?: boolean;
}

const planOptions: { label: string; value: OrganizationPlan | "all" }[] = [
  { label: "All plans", value: "all" },
  { label: "Free", value: OrganizationPlan.FREE },
  { label: "Pro", value: OrganizationPlan.PRO },
  { label: "Growth", value: OrganizationPlan.GROWTH },
  { label: "Enterprise", value: OrganizationPlan.ENTERPRISE },
];

const statusOptions: { label: string; value: OrganizationStatus | "all" }[] = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: OrganizationStatus.ACTIVE },
  { label: "Paused", value: OrganizationStatus.PAUSED },
  { label: "Suspended", value: OrganizationStatus.SUSPENDED },
];

export function OrganizationFilters({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  planFilter,
  onPlanChange,
  statusFilter,
  onStatusChange,
  onClearFilters,
  isPending,
}: OrganizationFiltersProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearchSubmit();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 lg:flex-row lg:items-end"
    >
      <div className="flex flex-1 flex-col gap-2">
        <label className="text-sm font-medium text-muted-foreground">
          Search
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or slug"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" disabled={isPending}>
            Apply
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <label className="text-sm font-medium text-muted-foreground">
          Plan
        </label>
        <Select
          value={planFilter}
          onValueChange={(value) =>
            onPlanChange(value as OrganizationPlan | "all")
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select plan" />
          </SelectTrigger>
          <SelectContent>
            {planOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <label className="text-sm font-medium text-muted-foreground">
          Status
        </label>
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            onStatusChange(value as OrganizationStatus | "all")
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClearFilters}
          disabled={isPending}
        >
          <Filter className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>
    </form>
  );
}
