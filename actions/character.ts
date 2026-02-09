"use server";

import { randomUUID } from 'crypto';
import { createClient } from "@/lib/supabase/server";
import { generateCharacterSheet as generateSheet } from "@/lib/replicate";
import { uploadImageFromUrl } from "@/lib/storage-utils";
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
        data.personality,
        data.additionalDetails
    );
    const sheetPrompt = buildCharacterSheetPrompt(
        data.name,
        data.appearance,
        data.personality,
        data.artStyle,
        data.additionalDetails
    );

    // Pass the user uploaded image as a reference if available
    const imageInput = data.referenceImageUrl ? [data.referenceImageUrl] : undefined;

    const imageUrl = await generateSheet(sheetPrompt, seed, undefined, imageInput);

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
    console.log('[saveCharacter] ========================================');
    console.log('[saveCharacter] Received character data:', {
        name: character.name,
        appearance: character.appearance,
        personality: character.personality,
        artStyle: character.artStyle,
        seedNumber: character.seedNumber,
        hasVisualPrompt: !!character.visualPrompt,
        hasReferenceImageUrl: !!character.referenceImageUrl,
    });
    console.log('[saveCharacter] ========================================');

    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        console.error('[saveCharacter] Not authenticated');
        return { success: false, error: "Not authenticated" };
    }

    console.log('[saveCharacter] User authenticated:', user.id);

    const characterId = randomUUID(); // Generate UUID for character
    let permReferenceUrl = character.referenceImageUrl;

    // Upload reference image to Supabase Storage if it exists
    if (character.referenceImageUrl) {
        try {
            permReferenceUrl = await uploadImageFromUrl(
                character.referenceImageUrl,
                'characters',
                user.id
            );
        } catch (uploadError) {
            console.error('Failed to upload character image:', uploadError);
            // Fallback to original URL or fail?
            // Let's fail for now as per "must use storage" requirement
            return { success: false, error: "Failed to save character image to storage" };
        }
    }

    const characterInsertData = {
        id: characterId, // Use our pre-generated UUID
        user_id: user.id,
        name: character.name,
        appearance: character.appearance,
        personality: character.personality,
        visual_prompt: character.visualPrompt,
        art_style: character.artStyle,
        seed_number: character.seedNumber,
        reference_image_url: permReferenceUrl,
    };

    console.log('[saveCharacter] Inserting into database with ID:', characterId);
    console.log('[saveCharacter] Full insert data:', JSON.stringify(characterInsertData, null, 2));

    const { error } = await supabase
        .from("characters")
        .insert(characterInsertData);

    if (error) {
        console.error('[saveCharacter] Database error:', error);
        console.error('[saveCharacter] Failed to insert character with ID:', characterId);
        return { success: false, error: error.message };
    }

    console.log('[saveCharacter] ========================================');
    console.log('[saveCharacter] ✓ Successfully saved character');
    console.log('[saveCharacter] Character ID:', characterId);
    console.log('[saveCharacter] Character Name:', character.name);
    console.log('[saveCharacter] ========================================');

    return { success: true, characterId };
}

/**
 * Get all characters for the current user
 */
export async function getCharacters(): Promise<Character[]> {
    console.log('[getCharacters] ========================================');
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    console.log('[getCharacters] User:', user ? user.id : 'NOT AUTHENTICATED');

    if (!user) {
        console.log('[getCharacters] No user found, returning empty array');
        return [];
    }

    const { data, error } = await supabase
        .from("characters")
        .select("*")
        .order("created_at", { ascending: false });

    console.log('[getCharacters] Query result:', {
        success: !error,
        count: data?.length || 0,
        error: error?.message
    });

    if (error || !data) {
        console.log('[getCharacters] Error or no data:', error);
        return [];
    }

    console.log('[getCharacters] Returning', data.length, 'characters');
    console.log('[getCharacters] ========================================');
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

/**
 * Generate a specialized avatar from a photo for book consistency
 */
export async function generateAvatarFromPhoto(
    photoUrl: string,
    name: string,
    gender: string,
    entityType: string,
    artStyle: string
): Promise<string> {
    const { generateWithSeedream } = await import("@/lib/replicate");

    // Construct a specific prompt for the avatar
    // We want a clean, neutral background character portrait that defines the style
    const prompt = `Pixar style 3D render of ${name}, a cute ${gender} ${entityType}. 
    Close-up character portrait, neutral expression, facing forward.
    High quality, ultra detailed, global illumination.
    [reference image 1]
    `;

    const seed = Math.floor(Math.random() * 1000000);

    const avatarUrl = await generateWithSeedream(
        prompt,
        seed,
        '1:1', // Square for avatar
        'blurry, low quality, distorted, text, watermark',
        [photoUrl] // Pass the original photo as reference
    );

    return avatarUrl;
}
