"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

import { updateOrganization } from "./actions";
import {
  organizationFormSchema,
  type OrganizationFormValues,
} from "./organization-form";
import type { OrganizationListItem } from "./types";

interface OrganizationEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: OrganizationListItem | null;
  onSuccess?: () => void;
}

export function OrganizationEditDialog({
  open,
  onOpenChange,
  organization,
  onSuccess,
}: OrganizationEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
    },
  });

  useEffect(() => {
    if (organization && open) {
      form.reset({
        name: organization.name,
        slug: organization.slug,
        description: organization.description ?? "",
      });
    }
  }, [organization, open, form]);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset({
        name: "",
        slug: "",
        description: "",
      });
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (data: OrganizationFormValues) => {
    if (!organization) return;
    setIsSubmitting(true);

    try {
      const payload = {
        ...data,
        slug: data.slug || undefined,
      };
      const result = await updateOrganization(organization.id, payload);

      if (!result.success) {
        form.setError("root", {
          message: result.error || "Failed to update organization",
        });
        return;
      }

      onSuccess?.();
      handleClose(false);
    } catch (error) {
      console.error("Error updating organization:", error);
      form.setError("root", {
        message: "Unexpected error updating organization",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Organization</DialogTitle>
          <DialogDescription>
            Update the organization information below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Learning" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="acme-learning" {...field} />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Used in URLs. Leave blank to keep the current slug.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Short summary about the organization"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !organization}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
