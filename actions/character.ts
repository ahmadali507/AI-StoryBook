"use server";

import { createClient } from "@/lib/supabase/server";
import { generateCharacterSheet as generateSheet } from "@/lib/replicate";
import {
    buildVisualPrompt,
    buildCharacterSheetPrompt,
    generateSeed,
} from "@/lib/character-builder";
import {
    Character,
    CharacterAppearance,
    ArtStyle,
    GenerateCharacterSheetRequest,
} from "@/types/storybook";

/**
 * Generate a character reference sheet image
 */
export async function generateCharacterSheet(
    data: GenerateCharacterSheetRequest
): Promise<{ imageUrl: string; seed: number; visualPrompt: string }> {
    const seed = generateSeed();
    const visualPrompt = buildVisualPrompt(
        data.name,
        data.appearance,
        data.personality
    );
    const sheetPrompt = buildCharacterSheetPrompt(
        data.name,
        data.appearance,
        data.personality,
        data.artStyle
    );

    const imageUrl = await generateSheet(sheetPrompt, seed);

    return {
        imageUrl,
        seed,
        visualPrompt,
    };
}

/**
 * Save a character to the database
 */
export async function saveCharacter(
    character: Omit<Character, "id" | "userId" | "createdAt">
): Promise<{ success: boolean; characterId?: string; error?: string }> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
        .from("characters")
        .insert({
            user_id: user.id,
            name: character.name,
            appearance: character.appearance,
            personality: character.personality,
            visual_prompt: character.visualPrompt,
            art_style: character.artStyle,
            seed_number: character.seedNumber,
            reference_image_url: character.referenceImageUrl,
        })
        .select("id")
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, characterId: data.id };
}

/**
 * Get all characters for the current user
 */
export async function getCharacters(): Promise<Character[]> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from("characters")
        .select("*")
        .order("created_at", { ascending: false });

    if (error || !data) {
        return [];
    }

    return data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        appearance: row.appearance as CharacterAppearance,
        personality: row.personality || [],
        visualPrompt: row.visual_prompt,
        artStyle: row.art_style as ArtStyle,
        seedNumber: row.seed_number,
        referenceImageUrl: row.reference_image_url,
        createdAt: new Date(row.created_at),
    }));
}

/**
 * Get a single character by ID
 */
export async function getCharacter(
    id: string
): Promise<Character | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) {
        return null;
    }

    return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        appearance: data.appearance as CharacterAppearance,
        personality: data.personality || [],
        visualPrompt: data.visual_prompt,
        artStyle: data.art_style as ArtStyle,
        seedNumber: data.seed_number,
        referenceImageUrl: data.reference_image_url,
        createdAt: new Date(data.created_at),
    };
}

/**
 * Delete a character
 */
export async function deleteCharacter(
    id: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase.from("characters").delete().eq("id", id);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}
