"use client";

import { Building2, PauseCircle, ShieldAlert, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, description, icon }: StatCardProps) {
  return (
    <Card className="border-muted/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export interface OrganizationStatsProps {
  totalOrganizations: number;
  activeOrganizations: number;
  pausedOrganizations: number;
  suspendedOrganizations: number;
}

export function OrganizationStats(stats: OrganizationStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total Organizations"
        value={stats.totalOrganizations}
        description="All organizations in your workspace"
        icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        label="Active"
        value={stats.activeOrganizations}
        description="Currently active tenants"
        icon={<Users className="h-4 w-4 text-emerald-500" />}
      />
      <StatCard
        label="Paused"
        value={stats.pausedOrganizations}
        description="Temporarily paused organizations"
        icon={<PauseCircle className="h-4 w-4 text-amber-500" />}
      />
      <StatCard
        label="Suspended"
        value={stats.suspendedOrganizations}
        description="Requires attention"
        icon={<ShieldAlert className="h-4 w-4 text-destructive" />}
      />
    </div>
  );
}
