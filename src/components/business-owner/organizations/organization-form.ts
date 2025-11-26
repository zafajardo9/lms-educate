import { z } from "zod";

export const organizationFormSchema = z.object({
  name: z.string().min(3, "Name is required"),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase and dashed")
    .optional()
    .or(z.literal("")),
  description: z.string().max(2000).optional(),
});

export type OrganizationFormValues = z.infer<typeof organizationFormSchema>;
