"use server";

import { createClient } from "@/lib/supabase/server";
import { generateSceneIllustration } from "@/lib/replicate";
import {
    buildScenePrompt,
    buildMultiCharacterScenePrompt,
} from "@/lib/character-builder";
import {
    Character,
    ArtStyle,
    GenerateIllustrationRequest,
    Illustration,
} from "@/types/storybook";

/**
 * Generate an illustration for a scene
 */
export async function generateIllustration(
    data: GenerateIllustrationRequest
): Promise<{ imageUrl: string; promptUsed: string }> {
    let prompt: string;

    if (data.characters.length === 1) {
        prompt = buildScenePrompt(data.characters[0], data.sceneDescription);
    } else {
        prompt = buildMultiCharacterScenePrompt(
            data.characters,
            data.sceneDescription,
            data.artStyle
        );
    }

    const imageUrl = await generateSceneIllustration(prompt, data.seedNumber);

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
