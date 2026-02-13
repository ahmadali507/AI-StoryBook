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

// ─────────────────────────────────────────────────────────────────────────────
// generateCharacterSheet
// ─────────────────────────────────────────────────────────────────────────────

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

    const imageInput = data.referenceImageUrl ? [data.referenceImageUrl] : undefined;
    const imageUrl = await generateSheet(sheetPrompt, seed, undefined, imageInput);

    return { imageUrl, seed, visualPrompt };
}

// ─────────────────────────────────────────────────────────────────────────────
// saveCharacter
// ─────────────────────────────────────────────────────────────────────────────

export async function saveCharacter(
    character: Omit<Character, "id" | "userId" | "createdAt">
): Promise<{ success: boolean; characterId?: string; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated" };

    const characterId = randomUUID();
    let permReferenceUrl = character.referenceImageUrl;

    if (character.referenceImageUrl) {
        try {
            permReferenceUrl = await uploadImageFromUrl(
                character.referenceImageUrl,
                'characters',
                user.id
            );
        } catch (uploadError) {
            console.error('Failed to upload character image:', uploadError);
            return { success: false, error: "Failed to save character image to storage" };
        }
    }

    const { error } = await supabase.from("characters").insert({
        id: characterId,
        user_id: user.id,
        name: character.name,
        appearance: character.appearance,
        personality: character.personality,
        visual_prompt: character.visualPrompt,
        art_style: character.artStyle,
        seed_number: character.seedNumber,
        reference_image_url: permReferenceUrl,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, characterId };
}

// ─────────────────────────────────────────────────────────────────────────────
// getCharacters / getCharacter / deleteCharacter
// ─────────────────────────────────────────────────────────────────────────────

export async function getCharacters(): Promise<Character[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("characters")
        .select("*")
        .order("created_at", { ascending: false });

    if (error || !data) return [];

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

export async function getCharacter(id: string): Promise<Character | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) return null;

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

export async function deleteCharacter(
    id: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { error } = await supabase.from("characters").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR GENERATION — FIXED
//
// ROOT CAUSE (revised understanding):
//   The reference photo is correct — a dog photo for dog, human photo for human.
//   The bug was entirely in the PROMPT, not the reference image.
//
//   The original prompt used Pixar character / "named pet" framing for animals.
//   In Pixar/Disney training data, animals are almost always depicted alongside
//   their human companion (think Dug in Up, Bolt, Dory). That framing pattern
//   is what caused the model to generate a human figure next to the animal —
//   it was completing a learned compositional pattern, not ignoring the negatives.
//
// FIX STRATEGY:
//   1. ALWAYS pass the reference photo — it is correct for every entity type.
//   2. Gate prompt structure entirely on entityType — animal/object prompts use
//      wildlife/nature photography framing, never Pixar duo / character-sheet framing.
//   3. Open every non-human prompt with a hard SOLO anchor ("ONE [animal] ONLY")
//      to override the compositional default before the model fills space.
//   4. Front-weight the negative prompt with human exclusions (positional token
//      weighting means earlier tokens carry more guidance weight in most models).
//   5. Remove gender/human-identity tokens from non-human prompts entirely.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds prompt config for a HUMAN avatar.
 * Reference photo is passed so the model matches face, hair, and skin tone.
 */
function buildHumanPromptConfig(
    photoUrl: string,
    name: string,
    gender: string,
    age?: string,
    clothingStyle?: string,
    description?: string
): { prompt: string; negativePrompt: string; imageInput: string[] } {
    const parts = [`${gender}`];
    if (age) parts.push(`${age} years old`);
    if (clothingStyle) parts.push(`wearing ${clothingStyle}`);
    if (description) parts.push(description);
    const subjectDetails = parts.join(", ");

    const prompt =
`Pixar-style 3D animated character portrait of ${name}, a ${subjectDetails}.
Single subject, looking directly at camera, neutral expression.
STRICTLY MATCH the face shape, hair color, hair style, and skin tone from the reference photo.
Natural average build. Simple light gradient background.
Soft global illumination, high quality, ultra detailed render.`;

    const negativePrompt = [
        "animals", "pets", "dogs", "cats", "second person", "multiple people",
        "crowd", "group", "blurry", "low quality", "distorted", "watermark",
        "bad anatomy", "extra limbs", "text",
    ].join(", ");

    return { prompt, negativePrompt, imageInput: [photoUrl] };
}

/**
 * Builds prompt config for an ANIMAL avatar.
 *
 * KEY CHANGES vs original:
 * - Uses wildlife/nature photography framing — NOT Pixar character / "named pet" framing.
 *   Pixar framing activates "pet + owner" compositional patterns from training data.
 * - Opens with a hard SOLO anchor token so the model doesn't fill compositional
 *   space with a contextually expected human companion.
 * - No gender/human-identity language in the subject description.
 * - Reference photo IS still passed — it's a photo of the animal, which is correct.
 */
function buildAnimalPromptConfig(
    photoUrl: string,
    name: string,
    gender: string,
    description?: string,
): { prompt: string; negativePrompt: string; imageInput: string[] } {
    // Build a clean species description — gender is fine here, just not human-framed
    const speciesDesc = description
        ? `${gender} ${description}`
        : `${gender} animal`;

    const prompt =
`ONE ANIMAL ONLY. SOLO SUBJECT. NO HUMANS.
Wildlife photography close-up portrait of a single ${speciesDesc}.
The subject's name is ${name}.
Pixar-style 3D render. Accurately match the breed, coloring, markings, and fur texture from the reference photo.
Centered single-animal composition. Looking at camera. Warm studio lighting.
Simple neutral background. No other subjects in frame. Ultra detailed, 8k resolution.`;

    // Front-weighted negative prompt — human exclusions come first because
    // positional token weighting gives more guidance weight to earlier tokens.
    const negativePrompt = [
        // ── Human presence (most critical — front of list) ──
        "human", "person", "man", "woman", "boy", "girl", "child", "people",
        "owner", "rider", "handler", "trainer", "companion",
        "two subjects", "multiple subjects", "duo", "pair",
        // ── Human body parts ──
        "human face", "human hands", "human feet", "human skin",
        "human hair", "human ears", "human eyes", "human nose", "makeup",
        // ── Human clothing/accessories on the animal ──
        "clothes", "clothing", "shirt", "dress", "pants", "hat",
        "wig", "hairstyle", "styled hair",
        // ── Anthropomorphism ──
        "anthropomorphic", "humanoid", "standing upright like a human",
        "cartoon human features", "disney character",
        // ── General quality ──
        "blurry", "low quality", "distorted", "watermark", "text",
        "bad anatomy", "extra limbs", "extra animals", "multiple animals",
    ].join(", ");

    // ✅ Reference photo is the animal's own photo — pass it so the model
    //    matches breed, coloring, and markings accurately.
    return { prompt, negativePrompt, imageInput: [photoUrl] };
}

/**
 * Builds prompt config for an OBJECT avatar.
 * Reference photo of the object is passed. Product photography framing.
 */
function buildObjectPromptConfig(
    photoUrl: string,
    name: string,
    description?: string,
): { prompt: string; negativePrompt: string; imageInput: string[] } {
    const subjectDesc = description ? description : "object";

    const prompt =
`SINGLE OBJECT ONLY. NO HUMANS. NO ANIMALS.
Professional product photography of a ${subjectDesc} named "${name}".
Match the shape, color, texture, and details from the reference photo exactly.
Isolated on a clean white background. Studio lighting. Sharp focus. Ultra detailed. 8k.`;

    const negativePrompt = [
        "human", "person", "man", "woman", "child", "people", "hands",
        "animal", "pet", "multiple objects",
        "blurry", "low quality", "distorted", "watermark", "text",
    ].join(", ");

    return { prompt, negativePrompt, imageInput: [photoUrl] };
}

/**
 * Selects the correct prompt builder based on entityType, then generates
 * a single high-quality avatar image via Seedream.
 *
 * The reference photo is ALWAYS passed — it is the correct subject for every
 * entity type (human photo for human, animal photo for animal, etc.).
 * The fix is entirely in how we prompt the model around that reference.
 */
export async function generateMultiAngleAvatars(
    photoUrl: string,
    name: string,
    gender: string,
    entityType: string,
    artStyle: string,
    age?: string,
    clothingStyle?: string,
    description?: string
): Promise<string[]> {
    const { generateWithSeedream } = await import("@/lib/replicate");

    // ── Select prompt config based on entity type ────────────────────────────
    let config: { prompt: string; negativePrompt: string; imageInput: string[] };

    if (entityType === "human") {
        config = buildHumanPromptConfig(photoUrl, name, gender, age, clothingStyle, description);
    } else if (entityType === "animal") {
        config = buildAnimalPromptConfig(photoUrl, name, gender, description);
    } else {
        // "object" or any future entity type
        config = buildObjectPromptConfig(photoUrl, name, description);
    }

    const seed = Math.floor(Math.random() * 1000000);
    const aspectRatio = "1:1";

    console.log(`[generateAvatar] ─────────────────────────────────────`);
    console.log(`[generateAvatar] Name: ${name} | Entity: ${entityType}`);
    console.log(`[generateAvatar] Reference image passed: ${config.imageInput.length > 0} (${config.imageInput[0] ?? "none"})`);
    console.log(`[generateAvatar] Prompt:\n${config.prompt}`);
    console.log(`[generateAvatar] Negative:\n${config.negativePrompt}`);
    console.log(`[generateAvatar] ─────────────────────────────────────`);

    try {
        const url = await generateWithSeedream(
            config.prompt,
            seed,
            aspectRatio,
            config.negativePrompt,
            config.imageInput
        );

        if (!url) throw new Error("Seedream returned no image URL");

        console.log(`[generateAvatar] ✓ Avatar generated for ${name}`);
        return [url];

    } catch (error) {
        console.error(`[generateAvatar] ✗ Failed to generate avatar for ${name}:`, error);
        throw error;
    }
}

/**
 * Legacy wrapper — returns the first generated URL.
 */
export async function generateAvatarFromPhoto(
    photoUrl: string,
    name: string,
    gender: string,
    entityType: string,
    artStyle: string,
    age?: string,
    clothingStyle?: string,
    description?: string
): Promise<string> {
    const urls = await generateMultiAngleAvatars(
        photoUrl, name, gender, entityType, artStyle, age, clothingStyle, description
    );
    return urls[0];
}