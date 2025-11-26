"use client";

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
    ArrowLeft,
    Plus,
    Mail,
    UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { DataTable } from "@/components/shared/data-table";
import { getEnrollmentColumns } from "./enrollment-columns";
import { Enrollment, EnrollmentsResponse, Student, Cohort, Group } from "./types";

interface EnrollmentsClientProps {
    courseId: string;
    courseTitle: string;
    initialData: EnrollmentsResponse;
    availableStudents: Student[];
    cohorts: Cohort[];
    groups: Group[];
}

export function EnrollmentsClient({
    courseId,
    courseTitle,
    initialData,
    availableStudents,
    cohorts: availableCohorts,
    groups: availableGroups,
}: EnrollmentsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

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

    // Change cohort dialog state
    const [isChangeCohortDialogOpen, setIsChangeCohortDialogOpen] = useState(false);
    const [enrollmentToChangeCohort, setEnrollmentToChangeCohort] = useState<Enrollment | null>(null);
    const [newCohortId, setNewCohortId] = useState<string | null>(null);

    // Filter out students who are already enrolled (from the current page, but ideally we should check against all. 
    // For now, we rely on the server validation for full check, but client side check is good for UX)
    // Since we are paginated, we can't check against ALL enrolled students easily on client.
    // We'll just check against availableStudents list if we can, or just rely on server error.
    // The old code filtered availableStudents. We can still do that if availableStudents is passed as a full list.
    // Assuming availableStudents is passed as a prop (it is).

    // Note: We don't have the full list of enrolled IDs anymore because of pagination.
    // So we can't easily filter availableStudents on the client side to hide already enrolled ones 
    // unless we fetch all enrolled IDs separately.
    // For now, we will show all and let the server return an error if already enrolled.

    const resetForm = () => {
        setSelectedStudent("");
        setEmailInput("");
        setSelectedCohort(undefined);
        setSelectedGroup(undefined);
        setEnrollMode("select");
    };

    const updateUrl = useCallback(
        (params: Record<string, string | number | null>) => {
            const newParams = new URLSearchParams(searchParams.toString());
            Object.entries(params).forEach(([key, value]) => {
                if (value === null || value === "" || value === "all") {
                    newParams.delete(key);
                } else {
                    newParams.set(key, String(value));
                }
            });
            startTransition(() => {
                router.push(`?${newParams.toString()}`, { scroll: false });
            });
        },
        [router, searchParams]
    );

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

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.trim())) {
            toast.error("Please enter a valid email address");
            return;
        }

        setIsSubmitting(true);
        try {
            // Find student by email
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

            // Enroll
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

    const handleUnenroll = async (enrollment: Enrollment) => {
        if (!confirm(`Remove ${enrollment.student.name} from this course?`)) return;

        try {
            const response = await fetch(
                `/api/business-owner/courses/${courseId}/enrollments/${enrollment.id}`,
                {
                    method: "DELETE",
                }
            );

            const result = await response.json();

            // Handle force delete if student has progress
            if (response.status === 409 && result.error?.message?.includes('progress')) {
                if (confirm(`${enrollment.student.name} has progress in this course. Are you sure you want to unenroll them? This will delete their progress.`)) {
                    const forceResponse = await fetch(
                        `/api/business-owner/courses/${courseId}/enrollments/${enrollment.id}?force=true`,
                        { method: "DELETE" }
                    );
                    const forceResult = await forceResponse.json();
                    if (!forceResponse.ok || !forceResult.success) {
                        throw new Error(forceResult.error?.message || "Failed to unenroll student");
                    }
                    toast.success("Student unenrolled");
                    router.refresh();
                    return;
                }
                return;
            }

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

    const handleChangeCohort = (enrollment: Enrollment) => {
        setEnrollmentToChangeCohort(enrollment);
        setNewCohortId(enrollment.cohort?.id || null);
        setIsChangeCohortDialogOpen(true);
    };

    const handleSaveCohortChange = async () => {
        if (!enrollmentToChangeCohort) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(
                `/api/business-owner/courses/${courseId}/enrollments/${enrollmentToChangeCohort.id}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ cohortId: newCohortId }),
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error?.message || "Failed to change cohort");
            }

            toast.success(result.message || "Cohort updated successfully");
            setIsChangeCohortDialogOpen(false);
            setEnrollmentToChangeCohort(null);
            router.refresh();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Failed to change cohort"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns = getEnrollmentColumns(handleUnenroll, handleChangeCohort);

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
                <div className="flex flex-col gap-4 mb-4">
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <Input
                                placeholder="Search students..."
                                defaultValue={searchParams.get("search") || ""}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    const timeoutId = setTimeout(() => {
                                        updateUrl({ search: value, page: 1 });
                                    }, 500);
                                    return () => clearTimeout(timeoutId);
                                }}
                            />
                        </div>
                        <Select
                            value={searchParams.get("cohortId") || "all"}
                            onValueChange={(value) => updateUrl({ cohortId: value, page: 1 })}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by Cohort" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Cohorts</SelectItem>
                                {availableCohorts.map((cohort) => (
                                    <SelectItem key={cohort.id} value={cohort.id}>
                                        {cohort.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={searchParams.get("groupId") || "all"}
                            onValueChange={(value) => updateUrl({ groupId: value, page: 1 })}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by Group" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Groups</SelectItem>
                                {availableGroups.map((group) => (
                                    <SelectItem key={group.id} value={group.id}>
                                        {group.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={searchParams.get("status") || "all"}
                            onValueChange={(value) => updateUrl({ status: value, page: 1 })}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="not_started">Not Started</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex gap-2 items-center">
                            <Input
                                type="date"
                                className="w-auto"
                                value={searchParams.get("startDate") || ""}
                                onChange={(e) => updateUrl({ startDate: e.target.value, page: 1 })}
                            />
                            <span>to</span>
                            <Input
                                type="date"
                                className="w-auto"
                                value={searchParams.get("endDate") || ""}
                                onChange={(e) => updateUrl({ endDate: e.target.value, page: 1 })}
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => {
                                const params = new URLSearchParams(searchParams);
                                params.delete("search");
                                params.delete("cohortId");
                                params.delete("groupId");
                                params.delete("status");
                                params.delete("startDate");
                                params.delete("endDate");
                                params.set("page", "1");
                                router.push(`${pathname}?${params.toString()}`);
                            }}
                        >
                            Clear
                        </Button>
                    </div>
                </div>
                <DataTable
                    columns={columns}
                    data={initialData.enrollments}
                    pageCount={initialData.pagination.totalPages}
                    pageIndex={initialData.pagination.page - 1} // DataTable is 0-indexed
                    manualPagination
                    isLoading={isPending}
                />
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
                                <Select
                                    value={selectedStudent}
                                    onValueChange={setSelectedStudent}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a student" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableStudents.map((student) => (
                                            <SelectItem key={student.id} value={student.id}>
                                                {student.name} ({student.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                        {availableCohorts.length > 0 && (
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
                                        {availableCohorts.map((cohort) => (
                                            <SelectItem key={cohort.id} value={cohort.id}>
                                                {cohort.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Optional: Group */}
                        {availableGroups.length > 0 && (
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
                                        {availableGroups.map((group) => (
                                            <SelectItem key={group.id} value={group.id}>
                                                {group.name}
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

            {/* Change Cohort Dialog */}
            <Dialog
                open={isChangeCohortDialogOpen}
                onOpenChange={(open) => {
                    setIsChangeCohortDialogOpen(open);
                    if (!open) {
                        setEnrollmentToChangeCohort(null);
                        setNewCohortId(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Change Cohort</DialogTitle>
                        <DialogDescription>
                            {enrollmentToChangeCohort && (
                                <>Move <strong>{enrollmentToChangeCohort.student.name}</strong> to a different cohort.</>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Current Cohort</Label>
                            <div className="text-sm text-muted-foreground">
                                {enrollmentToChangeCohort?.cohort?.name || "No cohort assigned"}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>New Cohort</Label>
                            <Select
                                value={newCohortId || "none"}
                                onValueChange={(val) => setNewCohortId(val === "none" ? null : val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select cohort" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No cohort</SelectItem>
                                    {availableCohorts.map((cohort) => (
                                        <SelectItem key={cohort.id} value={cohort.id}>
                                            {cohort.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsChangeCohortDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveCohortChange}
                            disabled={isSubmitting || newCohortId === (enrollmentToChangeCohort?.cohort?.id || null)}
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageLayout>
    );
}
