"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

import { deleteOrganization } from "./actions";
import type { OrganizationListItem } from "./types";

interface OrganizationDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: OrganizationListItem | null;
  onSuccess?: () => void;
}

export function OrganizationDeleteDialog({
  open,
  onOpenChange,
  organization,
  onSuccess,
}: OrganizationDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!organization) return;

    setIsDeleting(true);
    try {
      const result = await deleteOrganization(organization.id);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete organization");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting organization:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Organization</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            <strong>{organization?.name}</strong>? This action cannot be undone
            and will remove all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
