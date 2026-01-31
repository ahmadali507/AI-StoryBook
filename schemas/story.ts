import { z } from "zod";

export const storySettingSchema = z.union([
    z.literal("forest"),
    z.literal("castle"),
    z.literal("ocean"),
    z.literal("space"),
    z.literal("village"),
    z.literal("mountain"),
]);

export const storyOutlineSchema = z.object({
    characterIds: z
        .array(z.string().uuid())
        .min(1, "Select at least one character")
        .max(4, "Maximum 4 characters per story"),
    setting: storySettingSchema,
    theme: z
        .string()
        .min(10, "Please describe your story theme (at least 10 characters)")
        .max(500, "Theme description must be less than 500 characters")
        .optional(),
    targetChapters: z
        .number()
        .min(3, "Minimum 3 chapters")
        .max(20, "Maximum 20 chapters"),
    additionalDetails: z
        .string()
        .max(1000, "Additional details must be less than 1000 characters")
        .optional(),
});

export const storybookSchema = z.object({
    title: z
        .string()
        .min(1, "Title is required")
        .min(3, "Title must be at least 3 characters")
        .max(100, "Title must be less than 100 characters"),
    characterIds: z
        .array(z.string().uuid())
        .min(1, "Select at least one character"),
    setting: storySettingSchema,
    theme: z
        .string()
        .min(10, "Please describe your story theme")
        .max(500, "Theme description too long")
        .optional(),
    targetChapters: z
        .number()
        .min(3, "Minimum 3 chapters")
        .max(20, "Maximum 20 chapters"),
});

export type StorySettingInput = z.infer<typeof storySettingSchema>;
export type StoryOutlineInput = z.infer<typeof storyOutlineSchema>;
export type StorybookInput = z.infer<typeof storybookSchema>;
