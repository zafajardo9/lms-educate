"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, UsersRound, Trash2, Archive } from "lucide-react";

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

interface Group {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isDefault: boolean;
  isArchived: boolean;
  maxMembers: number | null;
  memberCount: number;
  spotsRemaining: number | null;
  createdAt: string;
  createdBy: { id: string; name: string } | null;
}

interface GroupsClientProps {
  courseId: string;
  courseTitle: string;
  initialGroups: Group[];
}

const typeLabels: Record<string, string> = {
  STUDY: "Study Group",
  DISCUSSION: "Discussion",
  PROJECT: "Project",
  CUSTOM: "Custom",
};

const typeBadgeVariants: Record<string, "default" | "secondary" | "outline"> = {
  STUDY: "default",
  DISCUSSION: "secondary",
  PROJECT: "default",
  CUSTOM: "outline",
};

export function GroupsClient({
  courseId,
  courseTitle,
  initialGroups,
}: GroupsClientProps) {
  const router = useRouter();
  const [groups, setGroups] = useState(initialGroups);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "STUDY",
    maxMembers: "",
  });

  const handleCreateGroup = async () => {
    if (!formData.name.trim()) {
      toast.error("Group name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/business-owner/courses/${courseId}/groups`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description || null,
            type: formData.type,
            maxMembers: formData.maxMembers
              ? parseInt(formData.maxMembers)
              : null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Failed to create group");
      }

      toast.success("Group created successfully");
      setIsCreateDialogOpen(false);
      setFormData({ name: "", description: "", type: "STUDY", maxMembers: "" });
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create group"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Delete group "${groupName}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(
        `/api/business-owner/courses/${courseId}/groups/${groupId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Failed to delete group");
      }

      toast.success("Group deleted");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete group"
      );
    }
  };

  return (
    <PageLayout
      title={`Groups - ${courseTitle}`}
      description="Manage course groups for collaborative learning"
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
            Create Group
          </Button>
        </div>
      }
    >
      <PageSection>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="h-5 w-5" />
              Course Groups
            </CardTitle>
            <CardDescription>
              {groups.length} group(s) in this course
            </CardDescription>
          </CardHeader>
          <CardContent>
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No groups created yet. Create a group to organize students.
              </p>
            ) : (
              <div className="space-y-3">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{group.name}</p>
                        {group.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            Default
                          </Badge>
                        )}
                        {group.isArchived && (
                          <Badge variant="secondary" className="text-xs">
                            <Archive className="h-3 w-3 mr-1" />
                            Archived
                          </Badge>
                        )}
                      </div>
                      {group.description && (
                        <p className="text-sm text-muted-foreground">
                          {group.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{group.memberCount} members</span>
                        {group.maxMembers && (
                          <span>• Max: {group.maxMembers}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={typeBadgeVariants[group.type] || "secondary"}
                      >
                        {typeLabels[group.type] || group.type}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteGroup(group.id, group.name)}
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

      {/* Create Group Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription>
              Create a new group for students in this course.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Group Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Study Group A"
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
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDY">Study Group</SelectItem>
                    <SelectItem value="DISCUSSION">Discussion</SelectItem>
                    <SelectItem value="PROJECT">Project</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max Members</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.maxMembers}
                  onChange={(e) =>
                    setFormData({ ...formData, maxMembers: e.target.value })
                  }
                  placeholder="Unlimited"
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
              onClick={handleCreateGroup}
              disabled={!formData.name.trim() || isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
