"use client";

import { Users, UserCheck, UserX, GraduationCap } from "lucide-react";
import { PageCard, PageGrid } from "@/components/shared/page-layout";
import { cn } from "@/lib/utils";

interface UserStatsProps {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalStudents: number;
  totalLecturers: number;
  totalBusinessOwners: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description?: string;
  className?: string;
}

function StatCard({ title, value, icon, description, className }: StatCardProps) {
  return (
    <PageCard className={cn("flex items-center gap-4", className)}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold">{value.toLocaleString()}</p>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </PageCard>
  );
}

export function UserStats({
  totalUsers,
  activeUsers,
  inactiveUsers,
  totalStudents,
  totalLecturers,
  totalBusinessOwners,
}: UserStatsProps) {
  return (
    <PageGrid columns={4}>
      <StatCard
        title="Total Users"
        value={totalUsers}
        icon={<Users className="h-6 w-6" />}
      />
      <StatCard
        title="Active Users"
        value={activeUsers}
        icon={<UserCheck className="h-6 w-6" />}
      />
      <StatCard
        title="Inactive Users"
        value={inactiveUsers}
        icon={<UserX className="h-6 w-6" />}
      />
      <StatCard
        title="Students"
        value={totalStudents}
        icon={<GraduationCap className="h-6 w-6" />}
        description={`${totalLecturers} lecturers, ${totalBusinessOwners} owners`}
      />
    </PageGrid>
  );
}
