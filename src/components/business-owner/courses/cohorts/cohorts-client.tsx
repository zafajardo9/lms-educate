"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Users, Trash2, Calendar, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLayout, PageSection } from "@/components/shared/page-layout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Cohort {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  enrollmentLimit: number | null;
  enrolledCount: number;
  spotsRemaining: number | null;
  createdAt: string;
}

interface CohortsClientProps {
  courseId: string;
  courseTitle: string;
  initialCohorts: Cohort[];
}

const statusLabels: Record<string, string> = {
  PLANNED: "Planned",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const statusBadgeVariants: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  PLANNED: "outline",
  ACTIVE: "default",
  COMPLETED: "secondary",
  ARCHIVED: "destructive",
};

export function CohortsClient({
  courseId,
  courseTitle,
  initialCohorts,
}: CohortsClientProps) {
  const router = useRouter();
  const [cohorts, setCohorts] = useState(initialCohorts);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "PLANNED",
    startDate: "",
    endDate: "",
    enrollmentLimit: "",
  });

  const handleCreateCohort = async () => {
    if (!formData.name.trim()) {
      toast.error("Cohort name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/business-owner/courses/${courseId}/cohorts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description || null,
            status: formData.status,
            startDate: formData.startDate
              ? new Date(formData.startDate).toISOString()
              : null,
            endDate: formData.endDate
              ? new Date(formData.endDate).toISOString()
              : null,
            enrollmentLimit: formData.enrollmentLimit
              ? parseInt(formData.enrollmentLimit)
              : null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Failed to create cohort");
      }

      toast.success("Cohort created successfully");
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        status: "PLANNED",
        startDate: "",
        endDate: "",
        enrollmentLimit: "",
      });
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create cohort"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCohort = async (cohortId: string, cohortName: string) => {
    if (!confirm(`Delete cohort "${cohortName}"? This cannot be undone.`))
      return;

    try {
      const response = await fetch(
        `/api/business-owner/courses/${courseId}/cohorts/${cohortId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Failed to delete cohort");
      }

      toast.success("Cohort deleted");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete cohort"
      );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <PageLayout
      title={`Cohorts - ${courseTitle}`}
      description="Manage course cohorts for scheduled learning"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/business-owner/courses/${courseId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Link>
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Cohort
          </Button>
        </div>
      }
    >
      <PageSection>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Course Cohorts
            </CardTitle>
            <CardDescription>
              {cohorts.length} cohort(s) in this course
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cohorts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No cohorts created yet. Create a cohort to schedule course runs.
              </p>
            ) : (
              <div className="space-y-3">
                {cohorts.map((cohort) => (
                  <div
                    key={cohort.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{cohort.name}</p>
                        <Badge
                          variant={
                            statusBadgeVariants[cohort.status] || "secondary"
                          }
                        >
                          {statusLabels[cohort.status] || cohort.status}
                        </Badge>
                      </div>
                      {cohort.description && (
                        <p className="text-sm text-muted-foreground">
                          {cohort.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(cohort.startDate)} -{" "}
                          {formatDate(cohort.endDate)}
                        </span>
                        <span>
                          {cohort.enrolledCount} enrolled
                          {cohort.enrollmentLimit &&
                            ` / ${cohort.enrollmentLimit} max`}
                        </span>
                        {cohort.spotsRemaining !== null &&
                          cohort.spotsRemaining > 0 && (
                            <span className="text-green-600">
                              {cohort.spotsRemaining} spots left
                            </span>
                          )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link
                          href={`/business-owner/courses/${courseId}/cohorts/${cohort.id}`}
                        >
                          Manage
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleDeleteCohort(cohort.id, cohort.name)
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageSection>

      {/* Create Cohort Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Cohort</DialogTitle>
            <DialogDescription>
              Create a new cohort for scheduled course delivery.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cohort Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Spring 2025"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNED">Planned</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Enrollment Limit</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.enrollmentLimit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      enrollmentLimit: e.target.value,
                    })
                  }
                  placeholder="Unlimited"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCohort}
              disabled={!formData.name.trim() || isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Cohort"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
