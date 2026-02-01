"use server";

import { createClient } from "@/lib/supabase/server";
import {
    generateStoryOutline as generateOutline,
    generateChapterContent as generateContent,
} from "@/lib/gemini";
import { generateSeed } from "@/lib/character-builder";
import { getCharacter } from "./character";
import {
    Character,
    Storybook,
    Chapter,
    StorySetting,
    ArtStyle,
    StoryStatus,
    GenerateStoryOutlineRequest,
} from "@/types/storybook";

interface StoryOutlineResult {
    title: string;
    chapters: {
        number: number;
        title: string;
        summary: string;
        sceneDescription: string;
    }[];
}

/**
 * Generate a story outline
 */
export async function generateStoryOutline(
    data: GenerateStoryOutlineRequest
): Promise<{ success: boolean; outline?: StoryOutlineResult; error?: string }> {
    try {
        // Fetch characters
        const characters: Character[] = [];
        for (const charId of data.characterIds) {
            const char = await getCharacter(charId);
            if (char) {
                characters.push(char);
            }
        }

        if (characters.length === 0) {
            return { success: false, error: "No valid characters found" };
        }

        const outline = await generateOutline(
            characters,
            data.setting,
            data.targetChapters,
            data.theme,
            data.additionalDetails
        );

        return { success: true, outline };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to generate outline",
        };
    }
}

/**
 * Create a new storybook
 */
export async function createStorybook(
    title: string,
    characterIds: string[],
    setting: StorySetting,
    artStyle: ArtStyle,
    targetChapters: number,
    theme?: string,
    description?: string
): Promise<{ success: boolean; storybookId?: string; error?: string }> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const globalSeed = generateSeed();

    const { data: storybook, error: sbError } = await supabase
        .from("storybooks")
        .insert({
            user_id: user.id,
            title,
            art_style: artStyle,
            global_seed: globalSeed,
            setting,
            theme,
            description,
            target_chapters: targetChapters,
            status: "draft",
        })
        .select("id")
        .single();

    if (sbError) {
        return { success: false, error: sbError.message };
    }

    // Link characters to storybook
    const characterLinks = characterIds.map((charId, index) => ({
        storybook_id: storybook.id,
        character_id: charId,
        position: index === 0 ? "main" : "supporting",
    }));

    const { error: linkError } = await supabase
        .from("storybook_characters")
        .insert(characterLinks);

    if (linkError) {
        return { success: false, error: linkError.message };
    }

    return { success: true, storybookId: storybook.id };
}

/**
 * Generate and save a chapter
 */
export async function generateChapter(
    storybookId: string,
    chapterNumber: number,
    chapterTitle: string,
    chapterSummary: string,
    sceneDescription: string
): Promise<{ success: boolean; chapterId?: string; content?: string; error?: string }> {
    const supabase = await createClient();

    // Get storybook with characters
    const { data: storybook, error: sbError } = await supabase
        .from("storybooks")
        .select(`
      *,
      storybook_characters (
        character_id,
        characters (*)
      )
    `)
        .eq("id", storybookId)
        .single();

    if (sbError || !storybook) {
        return { success: false, error: "Storybook not found" };
    }

    // Get previous chapter summary if exists
    let previousSummary: string | undefined;
    if (chapterNumber > 1) {
        const { data: prevChapter } = await supabase
            .from("chapters")
            .select("content")
            .eq("storybook_id", storybookId)
            .eq("chapter_number", chapterNumber - 1)
            .single();

        if (prevChapter) {
            previousSummary = prevChapter.content.substring(0, 200) + "...";
        }
    }

    // Extract characters from joined data
    const characters: Character[] = storybook.storybook_characters
        ?.map((sc: { characters: Record<string, unknown> }) => {
            const c = sc.characters;
            return {
                id: c.id as string,
                name: c.name as string,
                appearance: c.appearance as Character["appearance"],
                personality: (c.personality as string[]) || [],
                visualPrompt: c.visual_prompt as string,
                artStyle: c.art_style as ArtStyle,
                seedNumber: c.seed_number as number,
            };
        })
        .filter(Boolean) || [];

    try {
        const { content, sceneDescription: updatedScene } = await generateContent(
            characters,
            {
                number: chapterNumber,
                title: chapterTitle,
                summary: chapterSummary,
                sceneDescription,
            },
            previousSummary
        );

        // Save chapter
        const { data: chapter, error: chapterError } = await supabase
            .from("chapters")
            .insert({
                storybook_id: storybookId,
                chapter_number: chapterNumber,
                title: chapterTitle,
                content,
                scene_description: updatedScene,
            })
            .select("id")
            .single();

        if (chapterError) {
            return { success: false, error: chapterError.message };
        }

        return { success: true, chapterId: chapter.id, content };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to generate chapter",
        };
    }
}

/**
 * Get all storybooks for the current user
 */
export async function getStorybooks(): Promise<Storybook[]> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from("storybooks")
        .select("*")
        .order("created_at", { ascending: false });

    if (error || !data) {
        return [];
    }

    return data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        artStyle: row.art_style as ArtStyle,
        globalSeed: row.global_seed,
        setting: row.setting as StorySetting,
        theme: row.theme,
        description: row.description,
        targetChapters: row.target_chapters,
        status: row.status as StoryStatus,
        createdAt: new Date(row.created_at),
    }));
}

/**
 * Get a storybook with all chapters
 */
export async function getStorybookWithChapters(
    id: string
): Promise<Storybook | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("storybooks")
        .select(`
      *,
      chapters (
        *,
        illustrations (*)
      ),
      storybook_characters (
        character_id,
        position,
        characters (*)
      )
    `)
        .eq("id", id)
        .single();

    if (error || !data) {
        return null;
    }

    const chapters: Chapter[] = (data.chapters || [])
        .sort((a: { chapter_number: number }, b: { chapter_number: number }) =>
            a.chapter_number - b.chapter_number
        )
        .map((ch: Record<string, unknown>) => ({
            id: ch.id as string,
            storybookId: ch.storybook_id as string,
            chapterNumber: ch.chapter_number as number,
            title: ch.title as string,
            content: ch.content as string,
            sceneDescription: ch.scene_description as string,
            illustrations: ((ch.illustrations as Array<Record<string, unknown>>) || []).map(
                (ill) => ({
                    id: ill.id as string,
                    chapterId: ill.chapter_id as string,
                    imageUrl: ill.image_url as string,
                    promptUsed: ill.prompt_used as string,
                    seedUsed: ill.seed_used as number,
                    position: ill.position as number,
                })
            ),
        }));

    const characters: Character[] = (data.storybook_characters || [])
        .map((sc: { characters: Record<string, unknown> }) => {
            const c = sc.characters;
            return {
                id: c.id as string,
                name: c.name as string,
                appearance: c.appearance as Character["appearance"],
                personality: (c.personality as string[]) || [],
                visualPrompt: c.visual_prompt as string,
                artStyle: c.art_style as ArtStyle,
                seedNumber: c.seed_number as number,
                referenceImageUrl: c.reference_image_url as string,
            };
        })
        .filter(Boolean);

    return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        artStyle: data.art_style as ArtStyle,
        globalSeed: data.global_seed,
        setting: data.setting as StorySetting,
        theme: data.theme,
        description: data.description,
        targetChapters: data.target_chapters,
        status: data.status as StoryStatus,
        chapters,
        characters,
        createdAt: new Date(data.created_at),
    };
}

/**
 * Update storybook status
 */
export async function updateStorybookStatus(
    id: string,
    status: StoryStatus
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("storybooks")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Extend a storybook with more chapters
 */
export async function extendStory(
    storybookId: string,
    additionalChapters: number
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { data: storybook, error } = await supabase
        .from("storybooks")
        .select("target_chapters")
        .eq("id", storybookId)
        .single();

    if (error || !storybook) {
        return { success: false, error: "Storybook not found" };
    }

    const { error: updateError } = await supabase
        .from("storybooks")
        .update({
            target_chapters: storybook.target_chapters + additionalChapters,
            status: "draft",
            updated_at: new Date().toISOString(),
        })
        .eq("id", storybookId);

    if (updateError) {
        return { success: false, error: updateError.message };
    }

    return { success: true };
}
