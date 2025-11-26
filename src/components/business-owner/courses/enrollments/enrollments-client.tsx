"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  GraduationCap,
  Trash2,
  CheckCircle,
  Mail,
  UserPlus,
} from "lucide-react";

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

interface Enrollment {
  id: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  cohort: { id: string; name: string } | null;
  groups: { id: string; name: string; type: string }[];
  progress: number;
  enrolledAt: string;
  completedAt: string | null;
  lastAccessedAt: string | null;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Cohort {
  id: string;
  name: string;
  enrolledCount: number;
  enrollmentLimit: number | null;
}

interface Group {
  id: string;
  name: string;
  type: string;
  memberCount: number;
  maxMembers: number | null;
}

interface EnrollmentsClientProps {
  courseId: string;
  courseTitle: string;
  initialEnrollments: Enrollment[];
  availableStudents: Student[];
  cohorts: Cohort[];
  groups: Group[];
}

export function EnrollmentsClient({
  courseId,
  courseTitle,
  initialEnrollments,
  availableStudents,
  cohorts,
  groups,
}: EnrollmentsClientProps) {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState(initialEnrollments);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enrollMode, setEnrollMode] = useState<"select" | "email">("select");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [selectedCohort, setSelectedCohort] = useState<string | undefined>(
    undefined
  );
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>(
    undefined
  );

  // Filter out students who are already enrolled
  const enrolledStudentIds = new Set(enrollments.map((e) => e.student.id));
  const availableToEnroll = availableStudents.filter(
    (s) => !enrolledStudentIds.has(s.id)
  );

  const resetForm = () => {
    setSelectedStudent("");
    setEmailInput("");
    setSelectedCohort(undefined);
    setSelectedGroup(undefined);
    setEnrollMode("select");
  };

  const handleEnrollBySelect = async () => {
    if (!selectedStudent) {
      toast.error("Please select a student");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/business-owner/courses/${courseId}/enrollments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: selectedStudent,
            cohortId: selectedCohort,
            groupId: selectedGroup,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Failed to enroll student");
      }

      toast.success(result.message || "Student enrolled successfully");
      setIsEnrollDialogOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to enroll student"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnrollByEmail = async () => {
    if (!emailInput.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      // First, find the student by email
      const searchResponse = await fetch(
        `/api/business-owner/users?role=STUDENT&search=${encodeURIComponent(
          emailInput.trim()
        )}&limit=1`
      );
      const searchResult = await searchResponse.json();

      if (!searchResponse.ok || !searchResult.success) {
        throw new Error("Failed to search for student");
      }

      const students = searchResult.data?.users || [];
      const student = students.find(
        (s: Student) =>
          s.email.toLowerCase() === emailInput.trim().toLowerCase()
      );

      if (!student) {
        throw new Error(`No student found with email: ${emailInput.trim()}`);
      }

      // Check if already enrolled
      if (enrolledStudentIds.has(student.id)) {
        throw new Error("This student is already enrolled in this course");
      }

      // Enroll the student
      const response = await fetch(
        `/api/business-owner/courses/${courseId}/enrollments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: student.id,
            cohortId: selectedCohort,
            groupId: selectedGroup,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Failed to enroll student");
      }

      toast.success(result.message || `${student.name} enrolled successfully`);
      setIsEnrollDialogOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to enroll student"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnrollStudent = () => {
    if (enrollMode === "email") {
      handleEnrollByEmail();
    } else {
      handleEnrollBySelect();
    }
  };

  const handleUnenroll = async (enrollmentId: string, studentName: string) => {
    if (!confirm(`Remove ${studentName} from this course?`)) return;

    try {
      const response = await fetch(
        `/api/business-owner/courses/${courseId}/enrollments/${enrollmentId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Failed to unenroll student");
      }

      toast.success("Student unenrolled");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to unenroll student"
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <PageLayout
      title={`Enrollments - ${courseTitle}`}
      description="Manage student enrollments for this course"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/business-owner/courses/${courseId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Link>
          </Button>
          <Button onClick={() => setIsEnrollDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Enroll Student
          </Button>
        </div>
      }
    >
      <PageSection>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Enrolled Students
            </CardTitle>
            <CardDescription>
              {enrollments.length} student(s) enrolled in this course
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No students enrolled yet. Enroll students to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {enrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{enrollment.student.name}</p>
                        {enrollment.completedAt && (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {enrollment.student.email}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>
                          Enrolled: {formatDate(enrollment.enrolledAt)}
                        </span>
                        <span>• Progress: {enrollment.progress}%</span>
                        {enrollment.cohort && (
                          <span>• Cohort: {enrollment.cohort.name}</span>
                        )}
                      </div>
                      {enrollment.groups.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {enrollment.groups.map((group) => (
                            <Badge
                              key={group.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {group.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleUnenroll(enrollment.id, enrollment.student.name)
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageSection>

      {/* Enroll Student Dialog */}
      <Dialog
        open={isEnrollDialogOpen}
        onOpenChange={(open) => {
          setIsEnrollDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Enroll Student</DialogTitle>
            <DialogDescription>
              Add a student to this course by selecting from the list or
              entering their email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={enrollMode === "select" ? "default" : "outline"}
                size="sm"
                onClick={() => setEnrollMode("select")}
                className="flex-1"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Select Student
              </Button>
              <Button
                type="button"
                variant={enrollMode === "email" ? "default" : "outline"}
                size="sm"
                onClick={() => setEnrollMode("email")}
                className="flex-1"
              >
                <Mail className="mr-2 h-4 w-4" />
                Add by Email
              </Button>
            </div>

            {/* Student Selection */}
            {enrollMode === "select" ? (
              <div className="space-y-2">
                <Label>Student *</Label>
                {availableToEnroll.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    All students are already enrolled. Use "Add by Email" to
                    enroll a student.
                  </p>
                ) : (
                  <Select
                    value={selectedStudent}
                    onValueChange={setSelectedStudent}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableToEnroll.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} ({student.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Student Email *</Label>
                <Input
                  type="email"
                  placeholder="student@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the email of an existing student account
                </p>
              </div>
            )}

            {/* Optional: Cohort */}
            {cohorts.length > 0 && (
              <div className="space-y-2">
                <Label>Cohort (Optional)</Label>
                <Select
                  value={selectedCohort || "none"}
                  onValueChange={(val) =>
                    setSelectedCohort(val === "none" ? undefined : val)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No cohort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No cohort</SelectItem>
                    {cohorts.map((cohort) => (
                      <SelectItem key={cohort.id} value={cohort.id}>
                        {cohort.name} ({cohort.enrolledCount}
                        {cohort.enrollmentLimit &&
                          `/${cohort.enrollmentLimit}`}{" "}
                        enrolled)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Optional: Group */}
            {groups.length > 0 && (
              <div className="space-y-2">
                <Label>Group (Optional)</Label>
                <Select
                  value={selectedGroup || "none"}
                  onValueChange={(val) =>
                    setSelectedGroup(val === "none" ? undefined : val)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No group</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} ({group.memberCount}
                        {group.maxMembers && `/${group.maxMembers}`} members)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEnrollDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEnrollStudent}
              disabled={
                isSubmitting ||
                (enrollMode === "select" && !selectedStudent) ||
                (enrollMode === "email" && !emailInput.trim())
              }
            >
              {isSubmitting ? "Enrolling..." : "Enroll Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
