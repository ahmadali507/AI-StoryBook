"use server";

import { createClient } from "@/lib/supabase/server";
import { generateSceneIllustration } from "@/lib/replicate";
import {
    buildScenePrompt,
    buildMultiCharacterScenePrompt,
    getNegativePrompt,
} from "@/lib/character-builder";
import {
    Character,
    ArtStyle,
    GenerateIllustrationRequest,
    Illustration,
} from "@/types/storybook";
import { syncStoryContent } from "./story";

/**
 * Generate an illustration for a scene
 */
export async function generateIllustration(
    data: GenerateIllustrationRequest
): Promise<{ imageUrl: string; promptUsed: string }> {
    let prompt: string;

    const negativePrompt = getNegativePrompt(data.artStyle);

    if (data.characters.length === 1) {
        prompt = buildScenePrompt(data.characters[0], data.sceneDescription);
    } else {
        prompt = buildMultiCharacterScenePrompt(
            data.characters,
            data.sceneDescription,
            data.artStyle
        );
    }

    // Extract reference images from all characters to ensure multi-character consistency
    const referenceImages = data.characters
        .map(c => c.referenceImageUrl)
        .filter((url): url is string => !!url && url.length > 0);

    const replicateUrl = await generateSceneIllustration(
        prompt,
        data.seedNumber,
        negativePrompt,
        referenceImages.length > 0 ? referenceImages : undefined
    );

    // Persist to Supabase Storage so the URL never expires
    let imageUrl = replicateUrl;
    try {
        const { persistGeneratedImage } = await import("@/lib/storage-utils");
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            imageUrl = await persistGeneratedImage(replicateUrl, user.id, "illustrations");
            console.log(`[generateIllustration] ✓ Illustration persisted to Supabase Storage`);
        }
    } catch (storageError) {
        console.error(`[generateIllustration] ⚠ Storage upload failed, using Replicate URL as fallback:`, storageError);
    }

    return {
        imageUrl,
        promptUsed: prompt,
    };
}

/**
 * Save an illustration to the database
 */
export async function saveIllustration(
    chapterId: string,
    imageUrl: string,
    promptUsed: string,
    seedUsed: number,
    position: number = 1
): Promise<{ success: boolean; illustrationId?: string; error?: string }> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("illustrations")
        .insert({
            chapter_id: chapterId,
            image_url: imageUrl,
            prompt_used: promptUsed,
            seed_used: seedUsed,
            position,
        })
        .select("id")
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    // NOTE: We don't sync content here anymore - it will be synced once at the end of story generation
    // to avoid Supabase client caching issues during concurrent chapter insertions

    return { success: true, illustrationId: data.id };
}

/**
 * Get illustrations for a chapter
 */
export async function getIllustrations(
    chapterId: string
): Promise<Illustration[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("illustrations")
        .select("*")
        .eq("chapter_id", chapterId)
        .order("position", { ascending: true });

    if (error || !data) {
        return [];
    }

    return data.map((row) => ({
        id: row.id,
        chapterId: row.chapter_id,
        imageUrl: row.image_url,
        promptUsed: row.prompt_used,
        seedUsed: row.seed_used,
        position: row.position,
        createdAt: new Date(row.created_at),
    }));
}
