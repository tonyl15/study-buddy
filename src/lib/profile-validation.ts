import { z } from "zod";

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Display name cannot be empty")
  .max(50, "Display name must be 50 characters or less")
  .regex(
    /^[a-zA-Z0-9 _.\-]+$/,
    "Display name can only contain letters, numbers, spaces, hyphens, underscores, and periods"
  );

export const avatarUrlSchema = z
  .string()
  .trim()
  .max(500, "Avatar URL must be 500 characters or less")
  .url("Must be a valid URL")
  .refine((url) => url.startsWith("https://"), "Avatar URL must use HTTPS");

export const profileSchema = z.object({
  displayName: displayNameSchema.optional(),
  avatarUrl: avatarUrlSchema.optional().or(z.literal("")),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

/** Sanitize a display name by stripping HTML tags */
export function sanitizeDisplayName(name: string): string {
  return name.replace(/<[^>]*>/g, "").trim();
}
