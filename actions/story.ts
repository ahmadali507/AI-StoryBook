"use server";

import { createClient } from "@/lib/supabase/server";
import {
    generateStoryOutline as generateOutline,
    generateChapterContent as generateContent,
    generateCoverPrompt,
} from "@/lib/gemini";
import { generateBookCover } from "@/lib/replicate";
import { generateSeed, getNegativePrompt } from "@/lib/character-builder";
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

    // Start cover generation in background (or await if needed)
    // For now, valid to await to ensure it starts, or just fire and forget if platform supports it.
    // Given Next.js server actions, best to await or let client trigger. 
    // I'll await it for simplicity ensuring it exists when they land on the page.
    // But it might be slow. Let's try fire-and-forget style but catch errors so it doesn't block response?
    // Actually, I'll await it but ignore errors so creation succeeds even if cover fails.
    generateAndSaveCover(storybook.id).catch(console.error);

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
    sceneDescription: string,
    providedClient?: Awaited<ReturnType<typeof createClient>>
): Promise<{ success: boolean; chapterId?: string; content?: string; error?: string }> {
    const supabase = providedClient || await createClient();

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

        // Save chapter to database
        const { data: chapter, error: chapterError } = await supabase
            .from("chapters")
            .insert([{
                storybook_id: storybookId,
                chapter_number: chapterNumber,
                title: chapterTitle,
                content: content,
                scene_description: updatedScene,
            }])
            .select()
            .single();

        if (chapterError) {
            console.error(`[generateChapter] Failed to save chapter ${chapterNumber}:`, chapterError.message);
            return { success: false, error: chapterError.message };
        }

        if (!chapter) {
            console.error(`[generateChapter] No chapter returned after insert`);
            return { success: false, error: 'Failed to create chapter' };
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
    id: string,
    providedClient?: Awaited<ReturnType<typeof createClient>>
): Promise<Storybook | null> {
    try {
        console.log('[getStorybookWithChapters] Fetching:', id);
        const supabase = providedClient || await createClient();
        
        // Query storybook
        const { data, error } = await supabase
            .from("storybooks")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !data) {
            return null;
        }

        // Query chapters directly (no joins to avoid RLS issues)
        // First try: Use Supabase client
        const { data: chaptersData, error: chaptersError } = await supabase
            .from("chapters")
            .select("*")
            .eq("storybook_id", id)
            .order("chapter_number", { ascending: true });

        console.log('[getStorybookWithChapters] Supabase client query:', {
            found: chaptersData?.length || 0,
            error: chaptersError?.message,
            storybookId: id
        });

        // If Supabase client returns 0, try RAW HTTP fetch to bypass all caching
        let finalChaptersData = chaptersData;
        if (!chaptersData || chaptersData.length === 0) {
            console.log('[getStorybookWithChapters] Trying raw HTTP fetch...');
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/chapters?storybook_id=eq.${id}&order=chapter_number.asc`,
                    {
                        headers: {
                            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=representation'
                        },
                        cache: 'no-store'
                    }
                );
                
                if (response.ok) {
                    const rawData = await response.json();
                    console.log('[getStorybookWithChapters] Raw HTTP found:', rawData.length, 'chapters');
                    finalChaptersData = rawData;
                } else {
                    console.log('[getStorybookWithChapters] Raw HTTP failed:', response.status, response.statusText);
                }
            } catch (fetchError) {
                console.error('[getStorybookWithChapters] Raw fetch error:', fetchError);
            }
        }

        console.log('[getStorybookWithChapters] FINAL chapters count:', finalChaptersData?.length || 0);
        
        // Query illustrations for all chapters
        let illustrationsData: any[] = [];
        if (finalChaptersData && finalChaptersData.length > 0) {
            const chapterIds = finalChaptersData.map(ch => ch.id);
            const { data: illustrations } = await supabase
                .from("illustrations")
                .select("*")
                .in("chapter_id", chapterIds);
            
            illustrationsData = illustrations || [];
        }

        // Query storybook_characters
        const { data: storyCharacters } = await supabase
            .from("storybook_characters")
            .select("character_id, position")
            .eq("storybook_id", id);

        // Query actual characters
        let characters: Character[] = [];
        if (storyCharacters && storyCharacters.length > 0) {
            const characterIds = storyCharacters.map(sc => sc.character_id);
            const { data: charsData } = await supabase
                .from("characters")
                .select("*")
                .in("id", characterIds);
            
            if (charsData) {
                characters = charsData.map((c: any) => ({
                    id: c.id,
                    userId: c.user_id,
                    name: c.name,
                    appearance: c.appearance,
                    personality: c.personality || [],
                    visualPrompt: c.visual_prompt,
                    artStyle: c.art_style,
                    seedNumber: c.seed_number,
                    referenceImageUrl: c.reference_image_url,
                    createdAt: c.created_at,
                }));
            }
        }
    
        const chapters: Chapter[] = (finalChaptersData || []).map((ch: any) => ({
            id: ch.id,
            storybookId: ch.storybook_id,
            chapterNumber: ch.chapter_number,
            title: ch.title,
            content: ch.content,
            sceneDescription: ch.scene_description,
            illustrations: illustrationsData
                .filter((ill: any) => ill.chapter_id === ch.id)
                .map((ill: any) => ({
                    id: ill.id,
                    chapterId: ill.chapter_id,
                    imageUrl: ill.image_url,
                    promptUsed: ill.prompt_used,
                    seedUsed: ill.seed_used,
                    position: ill.position,
                })),
        }));


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
    } catch (error) {
        console.error(`[getStorybookWithChapters] ❌ EXCEPTION:`, error);
        return null;
    }
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

/**
 * Sync story content to JSON column for easy retrieval
 */
export async function syncStoryContent(
    storybookId: string,
    providedClient?: Awaited<ReturnType<typeof createClient>>
) {
    try {
        // Use provided client (same connection) or create new one
        const supabase = providedClient || await createClient();
        
        // Query chapters directly using the same client connection
        const { data: directChapters, error: directError } = await supabase
            .from("chapters")
            .select("id, chapter_number, title, content")
            .eq("storybook_id", storybookId)
            .order("chapter_number", { ascending: true});
        
        console.log('[syncStoryContent] Found', directChapters?.length || 0, 'chapters via direct query');
        
        // If direct query fails, try getStorybookWithChapters
        if (!directChapters || directChapters.length === 0) {
            console.log('[syncStoryContent] Direct query failed, trying getStorybookWithChapters...');
            const storybook = await getStorybookWithChapters(storybookId, supabase);
            
            if (!storybook) {
                return { success: false, error: "Storybook not found" };
            }
            
            const content = {
                title: storybook.title,
                author: "AI Storybook",
                chapters: storybook.chapters?.map(ch => ({
                    title: ch.title,
                    content: ch.content,
                    illustrationUrl: ch.illustrations?.[0]?.imageUrl
                })) || []
            };
            
            console.log('[syncStoryContent] Synced', content.chapters.length, 'chapters (from getStorybookWithChapters)');
            
            const { error } = await supabase
                .from("storybooks")
                .update({ content })
                .eq("id", storybookId);

            if (error) {
                console.error('[syncStoryContent] Error:', error.message);
                return { success: false, error: error.message };
            }
            
            return { success: true, chaptersCount: content.chapters.length };
        }
        
        // Get storybook info
        const { data: storybookData } = await supabase
            .from("storybooks")
            .select("title")
            .eq("id", storybookId)
            .single();
        
        // Fetch illustrations for all chapters
        const chapterIds = directChapters.map(ch => ch.id);
        const { data: illustrations } = await supabase
            .from("illustrations")
            .select("chapter_id, image_url, position")
            .in("chapter_id", chapterIds)
            .order("position", { ascending: true });
        
        // Create a map of chapter_id to illustration URL
        const illustrationMap = new Map<string, string>();
        if (illustrations) {
            illustrations.forEach(ill => {
                // Store the first/primary illustration for each chapter
                if (!illustrationMap.has(ill.chapter_id)) {
                    illustrationMap.set(ill.chapter_id, ill.image_url);
                }
            });
        }
        
        // Build content from direct query results with illustrations
        const content = {
            title: storybookData?.title || "Untitled",
            author: "AI Storybook",
            chapters: directChapters.map(ch => ({
                title: ch.title,
                content: ch.content,
                illustrationUrl: illustrationMap.get(ch.id) || undefined
            }))
        };
        
        console.log('[syncStoryContent] ✓ Synced', content.chapters.length, 'chapters with', illustrationMap.size, 'illustrations (from direct query)');
        
        const { error } = await supabase
            .from("storybooks")
            .update({ content })
            .eq("id", storybookId);

        if (error) {
            console.error('[syncStoryContent] Error:', error.message);
            return { success: false, error: error.message };
        }
        
        return { success: true, chaptersCount: content.chapters.length };
    } catch (error) {
        console.error('[syncStoryContent] Exception:', error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

/**
 * Generate and save a cover image for the storybook
 */
export async function generateAndSaveCover(storybookId: string) {
    const storybook = await getStorybookWithChapters(storybookId);
    if (!storybook) return { success: false, error: "Storybook not found" };

    try {
        const prompt = await generateCoverPrompt(
            storybook.title,
            storybook.setting,
            storybook.artStyle,
            storybook.theme
        );

        // Using generateBookCover for better aspect ratio (3:4)
        const negativePrompt = getNegativePrompt(storybook.artStyle);
        const imageUrl = await generateBookCover(prompt, storybook.globalSeed, negativePrompt);

        const supabase = await createClient();
        await supabase.from("storybooks").update({ cover_image_url: imageUrl }).eq("id", storybookId);

        return { success: true, imageUrl };
    } catch (e) {
        console.error("Cover generation failed:", e);
        return { success: false, error: "Failed to generate cover" };
    }
}

/**
 * Update storybook details
 */
export async function updateStorybook(
    id: string,
    updates: { title?: string; status?: StoryStatus }
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("storybooks")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) {
        return { success: false, error: error.message };
    }

    // If title changed, sync content again to update the JSON
    if (updates.title) {
        await syncStoryContent(id);
    }

    return { success: true };
}
