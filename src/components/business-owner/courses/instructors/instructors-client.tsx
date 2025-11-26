"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, UserPlus, Crown, Trash2, Mail } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Instructor {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  role: string;
  permissions: Record<string, boolean> | null;
  addedAt: string;
  invitedBy: { id: string; name: string } | null;
}

interface Lecturer {
  id: string;
  name: string;
  email: string;
}

interface InstructorsClientProps {
  courseId: string;
  courseTitle: string;
  primaryLecturer: Lecturer | null;
  initialInstructors: Instructor[];
  availableLecturers: Lecturer[];
}

const roleLabels: Record<string, string> = {
  OWNER: "Owner",
  LEAD_INSTRUCTOR: "Lead Instructor",
  INSTRUCTOR: "Instructor",
  TA: "Teaching Assistant",
  REVIEWER: "Reviewer",
};

const roleBadgeVariants: Record<string, "default" | "secondary" | "outline"> = {
  OWNER: "default",
  LEAD_INSTRUCTOR: "default",
  INSTRUCTOR: "secondary",
  TA: "outline",
  REVIEWER: "outline",
};

export function InstructorsClient({
  courseId,
  courseTitle,
  primaryLecturer,
  initialInstructors,
  availableLecturers,
}: InstructorsClientProps) {
  const router = useRouter();
  const [instructors, setInstructors] = useState(initialInstructors);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addMode, setAddMode] = useState<"select" | "email">("select");
  const [selectedLecturer, setSelectedLecturer] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [selectedRole, setSelectedRole] = useState("INSTRUCTOR");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out lecturers who are already instructors or the primary lecturer
  const existingUserIds = new Set(
    [...instructors.map((i) => i.user.id), primaryLecturer?.id].filter(Boolean)
  );

  const availableToAdd = availableLecturers.filter(
    (l) => !existingUserIds.has(l.id)
  );

  const resetForm = () => {
    setSelectedLecturer("");
    setEmailInput("");
    setSelectedRole("INSTRUCTOR");
    setAddMode("select");
  };

  const handleAddBySelect = async () => {
    if (!selectedLecturer) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/business-owner/courses/${courseId}/instructors`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selectedLecturer,
            role: selectedRole,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Failed to add instructor");
      }

      toast.success(result.message || "Instructor added successfully");
      setIsAddDialogOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add instructor"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddByEmail = async () => {
    if (!emailInput.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      // Search for lecturer by email (without org filter)
      const searchResponse = await fetch(
        `/api/business-owner/users?role=LECTURER&search=${encodeURIComponent(
          emailInput.trim()
        )}&limit=10&filterByOrg=false`
      );
      const searchResult = await searchResponse.json();

      if (!searchResponse.ok || !searchResult.success) {
        throw new Error("Failed to search for lecturer");
      }

      const lecturers = searchResult.data?.users || [];
      const lecturer = lecturers.find(
        (l: Lecturer) =>
          l.email.toLowerCase() === emailInput.trim().toLowerCase()
      );

      if (!lecturer) {
        throw new Error(`No lecturer found with email: ${emailInput.trim()}`);
      }

      // Check if already an instructor
      if (existingUserIds.has(lecturer.id)) {
        throw new Error(
          "This lecturer is already an instructor for this course"
        );
      }

      // Add the instructor
      const response = await fetch(
        `/api/business-owner/courses/${courseId}/instructors`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: lecturer.id,
            role: selectedRole,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Failed to add instructor");
      }

      toast.success(result.message || `${lecturer.name} added as instructor`);
      setIsAddDialogOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add instructor"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddInstructor = () => {
    if (addMode === "email") {
      handleAddByEmail();
    } else {
      handleAddBySelect();
    }
  };

  const handleRemoveInstructor = async (
    instructorId: string,
    userName: string
  ) => {
    if (!confirm(`Remove ${userName} from this course?`)) return;

    try {
      const response = await fetch(
        `/api/business-owner/courses/${courseId}/instructors/${instructorId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Failed to remove instructor");
      }

      toast.success("Instructor removed");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove instructor"
      );
    }
  };

  return (
    <PageLayout
      title={`Instructors - ${courseTitle}`}
      description="Manage course instructors and their roles"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/business-owner/courses/${courseId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Link>
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Instructor
          </Button>
        </div>
      }
    >
      <PageSection>
        <div className="space-y-4">
          {/* Primary Lecturer */}
          {primaryLecturer && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    <CardTitle className="text-lg">Primary Lecturer</CardTitle>
                  </div>
                  <Badge>Primary</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="font-medium">{primaryLecturer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {primaryLecturer.email}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Instructors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Additional Instructors
              </CardTitle>
              <CardDescription>
                {instructors.length} instructor(s) assigned to this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              {instructors.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No additional instructors assigned yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {instructors.map((instructor) => (
                    <div
                      key={instructor.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{instructor.user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {instructor.user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            roleBadgeVariants[instructor.role] || "secondary"
                          }
                        >
                          {roleLabels[instructor.role] || instructor.role}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleRemoveInstructor(
                              instructor.id,
                              instructor.user.name
                            )
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
        </div>
      </PageSection>

      {/* Add Instructor Dialog */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Instructor</DialogTitle>
            <DialogDescription>
              Add a lecturer as an instructor by selecting from the list or
              entering their email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={addMode === "select" ? "default" : "outline"}
                size="sm"
                onClick={() => setAddMode("select")}
                className="flex-1"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Select Lecturer
              </Button>
              <Button
                type="button"
                variant={addMode === "email" ? "default" : "outline"}
                size="sm"
                onClick={() => setAddMode("email")}
                className="flex-1"
              >
                <Mail className="mr-2 h-4 w-4" />
                Add by Email
              </Button>
            </div>

            {/* Lecturer Selection */}
            {addMode === "select" ? (
              <div className="space-y-2">
                <Label>Lecturer *</Label>
                {availableToAdd.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No available lecturers in your organization. Use "Add by
                    Email" to add a lecturer.
                  </p>
                ) : (
                  <Select
                    value={selectedLecturer}
                    onValueChange={setSelectedLecturer}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lecturer" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableToAdd.map((lecturer) => (
                        <SelectItem key={lecturer.id} value={lecturer.id}>
                          {lecturer.name} ({lecturer.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Lecturer Email *</Label>
                <Input
                  type="email"
                  placeholder="lecturer@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the email of an existing lecturer account
                </p>
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEAD_INSTRUCTOR">
                    Lead Instructor
                  </SelectItem>
                  <SelectItem value="INSTRUCTOR">Instructor</SelectItem>
                  <SelectItem value="TA">Teaching Assistant</SelectItem>
                  <SelectItem value="REVIEWER">Reviewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddInstructor}
              disabled={
                isSubmitting ||
                (addMode === "select" && !selectedLecturer) ||
                (addMode === "email" && !emailInput.trim())
              }
            >
              {isSubmitting ? "Adding..." : "Add Instructor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
