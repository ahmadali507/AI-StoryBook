import { z } from "zod";

export const characterAppearanceSchema = z.object({
    hairStyle: z.string().min(1, "Hair style is required"),
    hairColor: z.string().min(1, "Hair color is required"),
    eyeColor: z.string().min(1, "Eye color is required"),
    skinTone: z.string().min(1, "Skin tone is required"),
    clothing: z.string().optional(),
    accessories: z.array(z.string()).optional(),
    distinctiveFeatures: z.array(z.string()).optional(),
});

const artStyleValues = [
    "watercolor",
    "cartoon",
    "storybook",
    "anime",
    "3d-clay",
    "fantasy",
] as const;

type ArtStyleValue = (typeof artStyleValues)[number];

export const artStyleSchema = z.union([
    z.literal("watercolor"),
    z.literal("cartoon"),
    z.literal("storybook"),
    z.literal("anime"),
    z.literal("3d-clay"),
    z.literal("fantasy"),
]);

export const characterSchema = z.object({
    name: z
        .string()
        .min(1, "Name is required")
        .min(2, "Name must be at least 2 characters")
        .max(50, "Name must be less than 50 characters"),
    appearance: characterAppearanceSchema,
    personality: z
        .array(z.string())
        .min(1, "Select at least one personality trait")
        .max(5, "Maximum 5 personality traits"),
    artStyle: artStyleSchema,
});

export const generateCharacterSheetSchema = characterSchema;

export type CharacterAppearanceInput = z.infer<typeof characterAppearanceSchema>;
export type CharacterInput = z.infer<typeof characterSchema>;
export type ArtStyleInput = ArtStyleValue;
