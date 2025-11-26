"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";

import { getOrganizationMembers, addOrganizationMember } from "./actions";
import type {
  OrganizationListItem,
  OrganizationMember,
  OrganizationMemberRole,
} from "./types";
import { UserRole } from "@/types";

interface OrganizationMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: OrganizationListItem | null;
}

const roleOptions: { label: string; value: OrganizationMemberRole }[] = [
  { label: "Owner", value: "OWNER" },
  { label: "Admin", value: "ADMIN" },
  { label: "Lecturer", value: "LECTURER" },
];

export function OrganizationMembersDialog({
  open,
  onOpenChange,
  organization,
}: OrganizationMembersDialogProps) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingExisting, setIsAddingExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrganizationMemberRole>("LECTURER");
  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);
  const [isLoadingLecturers, setIsLoadingLecturers] = useState(false);
  const [selectedLecturerId, setSelectedLecturerId] = useState("");
  const [lecturerError, setLecturerError] = useState<string | null>(null);

  interface LecturerOption {
    id: string;
    name: string | null;
    email: string;
    role: UserRole;
    isActive: boolean;
  }

  const dialogTitle = useMemo(() => {
    if (!organization) return "Organization Members";
    return `${organization.name} Members`;
  }, [organization]);

  useEffect(() => {
    if (open && organization) {
      void fetchMembers();
      void fetchLecturers();
    } else if (!open) {
      setMembers([]);
      setEmail("");
      setRole("LECTURER");
      setError(null);
      setLecturerError(null);
      setSelectedLecturerId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, organization?.id]);

  const fetchMembers = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await getOrganizationMembers(organization.id);
      setMembers(response.members);
    } catch (err) {
      console.error("Failed to load members", err);
      setError("Failed to load members. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLecturers = async () => {
    setIsLoadingLecturers(true);
    setLecturerError(null);
    try {
      const response = await fetch(
        `/api/business-owner/users?role=${UserRole.LECTURER}&limit=100&isActive=true`
      );
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error?.message || "Failed to load lecturers");
      }
      const options: LecturerOption[] = result.data.users?.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        isActive: user.isActive,
      }));
      setLecturers(options || []);
    } catch (err) {
      console.error("Failed to load lecturers", err);
      setLecturerError("Unable to fetch lecturers. Try refreshing.");
    } finally {
      setIsLoadingLecturers(false);
    }
  };

  const handleAddMember = async () => {
    if (!organization || !email.trim()) {
      toast.error("Email is required to add a member");
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      const result = await addOrganizationMember(organization.id, {
        email: email.trim(),
        role,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to add member");
      }

      toast.success("Member added successfully");
      setEmail("");
      setRole("LECTURER");
      await fetchMembers();
    } catch (err) {
      console.error("Failed to add member", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to add member. Please try again."
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddExistingMember = async () => {
    if (!organization || !selectedLecturerId) {
      toast.error("Please select an existing user");
      return;
    }

    const selectedLecturer = lecturers.find(
      (lecturer) => lecturer.id === selectedLecturerId
    );

    if (!selectedLecturer) {
      toast.error("Selected user is no longer available");
      return;
    }

    setIsAddingExisting(true);
    try {
      const result = await addOrganizationMember(organization.id, {
        email: selectedLecturer.email,
        role,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to add member");
      }

      toast.success(`${selectedLecturer.name ?? selectedLecturer.email} added`);
      setSelectedLecturerId("");
      await fetchMembers();
    } catch (err) {
      console.error("Failed to add existing member", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to add existing member. Please try again."
      );
    } finally {
      setIsAddingExisting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            View and manage the members that are part of this organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="rounded-lg border p-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Member Email
                </label>
                <Input
                  placeholder="user@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isAdding}
                />
                <Button
                  className="w-full lg:w-auto"
                  onClick={handleAddMember}
                  disabled={isAdding || !organization}
                >
                  {isAdding && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Invite by Email
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Select Existing Lecturer
                </label>
                <Select
                  value={selectedLecturerId}
                  onValueChange={setSelectedLecturerId}
                  disabled={isLoadingLecturers || lecturers.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingLecturers
                          ? "Loading lecturers..."
                          : lecturers.length
                          ? "Select lecturer"
                          : "No lecturers available"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {lecturers.map((lecturer) => (
                      <SelectItem key={lecturer.id} value={lecturer.id}>
                        {lecturer.name || "Unnamed"} ({lecturer.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-col gap-2 lg:flex-row">
                  <Button
                    className="w-full lg:w-auto"
                    variant="outline"
                    onClick={fetchLecturers}
                    disabled={isLoadingLecturers}
                  >
                    {isLoadingLecturers && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Refresh List
                  </Button>
                  <Button
                    className="w-full lg:w-auto"
                    variant="secondary"
                    onClick={handleAddExistingMember}
                    disabled={
                      isAddingExisting || !selectedLecturerId || !organization
                    }
                  >
                    {isAddingExisting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Selected User
                  </Button>
                </div>
                {lecturerError && (
                  <p className="text-xs text-destructive">{lecturerError}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="w-full lg:w-48">
                <label className="text-sm font-medium text-muted-foreground">
                  Role
                </label>
                <Select
                  value={role}
                  onValueChange={(value) =>
                    setRole(value as OrganizationMemberRole)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Role applies to both email invitations and selected users. Only
                business owners and admins can invite new members.
              </p>
            </div>
          </section>

          <section className="rounded-lg border">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="font-medium">Organization Members</p>
                <p className="text-sm text-muted-foreground">
                  {members.length} member{members.length === 1 ? "" : "s"} total
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMembers}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Refresh
              </Button>
            </div>

            {error && (
              <p className="px-4 py-2 text-sm text-destructive">{error}</p>
            )}

            <div className="max-h-[400px] overflow-auto">
              {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : members.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="w-32">Role</TableHead>
                      <TableHead className="w-40">Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          {member.user.name ?? "Unnamed User"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {member.user.email}
                        </TableCell>
                        <TableCell className="font-medium">
                          {member.role}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(member.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex h-40 flex-col items-center justify-center text-center text-sm text-muted-foreground">
                  <p>No members yet.</p>
                  <p>Add a user using the form above to get started.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
