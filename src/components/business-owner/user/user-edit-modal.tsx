"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UserRole } from "@/types";
import { type UserColumnData } from "./user-columns";

const editUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.enum([UserRole.BUSINESS_OWNER, UserRole.LECTURER, UserRole.STUDENT]),
  isActive: z.boolean(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface UserEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserColumnData | null;
  onSuccess?: () => void;
}

export function UserEditModal({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserEditModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: "",
      role: UserRole.STUDENT,
      isActive: true,
    },
  });

  const selectedRole = watch("role");
  const isActive = watch("isActive");

  // Update form when user changes
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: EditUserFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to update user");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user?.email ?? ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              {...register("name")}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) => setValue("role", value as UserRole)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.STUDENT}>Student</SelectItem>
                <SelectItem value={UserRole.LECTURER}>Lecturer</SelectItem>
                <SelectItem value={UserRole.BUSINESS_OWNER}>Business Owner</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Account Status</Label>
              <p className="text-sm text-muted-foreground">
                {isActive ? "User can access the platform" : "User is blocked from accessing"}
              </p>
            </div>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked: boolean) => setValue("isActive", checked)}
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
