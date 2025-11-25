"use client";

import { useState, useEffect } from "react";
import { Loader2, Shield, GraduationCap, BookOpen, Crown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { type UserColumnData } from "./user-columns";

interface UserRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserColumnData | null;
  onSuccess?: () => void;
}

const roleOptions = [
  {
    value: UserRole.STUDENT,
    label: "Student",
    description: "Can enroll in courses and take quizzes",
    icon: GraduationCap,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  {
    value: UserRole.LECTURER,
    label: "Lecturer",
    description: "Can create and manage courses, view student progress",
    icon: BookOpen,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  {
    value: UserRole.BUSINESS_OWNER,
    label: "Business Owner",
    description: "Full platform access, can manage users and settings",
    icon: Crown,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  },
];

export function UserRoleModal({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserRoleModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT);

  // Update selected role when user changes
  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user || selectedRole === user.role) {
      onOpenChange(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to update role");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating role:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const currentRoleOption = roleOptions.find((r) => r.value === user?.role);
  const hasChanged = user && selectedRole !== user.role;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Change User Role
          </DialogTitle>
          <DialogDescription>
            Update the role and permissions for this user.
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="space-y-4">
            {/* User Info */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                {currentRoleOption && (
                  <Badge className={cn("font-normal", currentRoleOption.color)}>
                    Current: {currentRoleOption.label}
                  </Badge>
                )}
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-3">
              <Label>Select New Role</Label>
              <RadioGroup
                value={selectedRole}
                onValueChange={(value: string) => setSelectedRole(value as UserRole)}
                className="space-y-3"
                disabled={isLoading}
              >
                {roleOptions.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.value;
                  const isCurrent = user.role === role.value;

                  return (
                    <label
                      key={role.value}
                      className={cn(
                        "flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50",
                        isLoading && "cursor-not-allowed opacity-50"
                      )}
                    >
                      <RadioGroupItem
                        value={role.value}
                        id={role.value}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{role.label}</span>
                          {isCurrent && (
                            <Badge variant="outline" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {role.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </RadioGroup>
            </div>

            {/* Warning for role change */}
            {hasChanged && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> Changing the role will immediately update the user's
                  permissions. They may lose access to certain features.
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !hasChanged}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {hasChanged ? "Save Changes" : "No Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
