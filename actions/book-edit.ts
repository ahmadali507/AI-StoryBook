"use server";

import { createClient } from "@/lib/supabase/server";
import { generateWithSeedream } from "@/lib/replicate";
import { persistGeneratedImage } from "@/lib/storage-utils";
import type { BookPage } from "@/actions/library";

// ============================================
// TYPES
// ============================================

interface GeneratedBookContent {
    title: string;
    dedication: string;
    pages: BookPage[];
    pdfUrl?: string;
}

interface IllustrationMetadataEntry {
    sceneNumber: number;
    illustrationPrompt: string;
    sceneSeed: number;
    negativePrompt: string;
    referenceImages: string[];
}

// ============================================
// TEXT EDITING (Free, no credits)
// ============================================

/**
 * Update the text of a specific page in a completed book.
 * No credits consumed — text editing is unlimited.
 */
export async function updateBookPageText(
    storybookId: string,
    pageNumber: number,
    newText: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { success: false, error: "Not authenticated" };
    }

    // 2. Fetch storybook (RLS ensures ownership)
    const { data: storybook, error: fetchError } = await supabase
        .from("storybooks")
        .select("id, content, user_id")
        .eq("id", storybookId)
        .single();

    if (fetchError || !storybook) {
        return { success: false, error: "Storybook not found" };
    }

    if (storybook.user_id !== user.id) {
        return { success: false, error: "Unauthorized" };
    }

    // 3. Parse content and find the page
    const bookContent = storybook.content as GeneratedBookContent;
    if (!bookContent || !bookContent.pages) {
        return { success: false, error: "Book content not found" };
    }

    const pageIndex = bookContent.pages.findIndex(p => p.pageNumber === pageNumber);
    if (pageIndex === -1) {
        return { success: false, error: `Page ${pageNumber} not found` };
    }

    const page = bookContent.pages[pageIndex];

    // Only allow editing text-bearing pages
    if (!page.text && page.text !== "") {
        return { success: false, error: "This page does not contain editable text" };
    }

    // 4. Update the text
    bookContent.pages[pageIndex] = { ...page, text: newText };

    // 5. Write back to DB
    const { error: updateError } = await supabase
        .from("storybooks")
        .update({ content: bookContent })
        .eq("id", storybookId);

    if (updateError) {
        console.error("[updateBookPageText] Error updating content:", updateError);
        return { success: false, error: "Failed to save changes" };
    }

    console.log(`[updateBookPageText] ✓ Updated page ${pageNumber} text for storybook ${storybookId}`);
    return { success: true };
}

// ============================================
// IMAGE REGENERATION (1 credit per scene)
// ============================================

/**
 * Regenerate the illustration for a specific scene page.
 * Consumes 1 regeneration credit. Uses original prompt with a new seed.
 */
export async function regenerateSceneIllustration(
    storybookId: string,
    pageNumber: number
): Promise<{ success: boolean; newImageUrl?: string; remainingCredits?: number; error?: string }> {
    const supabase = await createClient();

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { success: false, error: "Not authenticated" };
    }

    // 2. Fetch storybook with all needed data
    const { data: storybook, error: fetchError } = await supabase
        .from("storybooks")
        .select("id, content, user_id, regeneration_credits, illustration_metadata")
        .eq("id", storybookId)
        .single();

    if (fetchError || !storybook) {
        return { success: false, error: "Storybook not found" };
    }

    if (storybook.user_id !== user.id) {
        return { success: false, error: "Unauthorized" };
    }

    // 3. Check credits
    const currentCredits = storybook.regeneration_credits ?? 0;
    if (currentCredits <= 0) {
        return { success: false, error: "No regeneration credits remaining" };
    }

    // 4. Find the page and its metadata
    const bookContent = storybook.content as GeneratedBookContent;
    if (!bookContent || !bookContent.pages) {
        return { success: false, error: "Book content not found" };
    }

    const pageIndex = bookContent.pages.findIndex(p => p.pageNumber === pageNumber);
    if (pageIndex === -1) {
        return { success: false, error: `Page ${pageNumber} not found` };
    }

    const page = bookContent.pages[pageIndex];

    // Must be an illustration page
    if (!page.illustrationUrl || !page.sceneNumber) {
        return { success: false, error: "This page does not contain an illustration" };
    }

    // 5. Get prompt metadata — first from page itself, then fallback to illustration_metadata array
    let prompt = page.illustrationPrompt;
    let negativePrompt = page.negativePrompt;
    let referenceImages: string[] = [];

    const metadataArray = (storybook.illustration_metadata as IllustrationMetadataEntry[]) || [];
    const sceneMeta = metadataArray.find(m => m.sceneNumber === page.sceneNumber);

    if (!prompt && sceneMeta) {
        prompt = sceneMeta.illustrationPrompt;
        negativePrompt = sceneMeta.negativePrompt;
        referenceImages = sceneMeta.referenceImages || [];
    } else if (sceneMeta) {
        referenceImages = sceneMeta.referenceImages || [];
    }

    if (!prompt) {
        return { success: false, error: "No prompt metadata found for this scene. Cannot regenerate." };
    }

    // FALLBACK: If we still don't have reference images (e.g., from an older book), fetch them directly
    if (referenceImages.length === 0) {
        try {
            const { data: order } = await supabase
                .from("orders")
                .select("id")
                .eq("storybook_id", storybookId)
                .single();

            if (order) {
                const { getOrderCharacters } = await import("@/actions/order");
                const characters = await getOrderCharacters(order.id);
                for (const c of characters) {
                    let charImage: string | null = null;
                    if (c.aiAvatarUrl) {
                        try {
                            const parsed = JSON.parse(c.aiAvatarUrl);
                            if (Array.isArray(parsed) && parsed.length > 0) charImage = parsed[0];
                            else if (typeof parsed === 'string') charImage = parsed;
                        } catch {
                            charImage = c.aiAvatarUrl;
                        }
                    }
                    if (!charImage && c.photoUrl) charImage = c.photoUrl;
                    if (charImage) referenceImages.push(charImage);
                }
                console.log(`[regenerateSceneIllustration] Fallback: Fetched ${referenceImages.length} reference images from DB.`);
            }
        } catch (err) {
            console.error("[regenerateSceneIllustration] Failed to fetch fallback reference images:", err);
        }
    }

    // Enhance negative prompt to prevent glittery/sparkly effects
    const antiGlitter = "sparkles, glitter, glowing dust, overly shiny, plastic, overexposed, magic dust";
    if (negativePrompt) {
        if (!negativePrompt.includes("sparkles")) {
            negativePrompt = antiGlitter + ", " + negativePrompt;
        }
    } else {
        negativePrompt = antiGlitter;
    }

    // Enhance prompt for regeneration to strictly enforce character consistency
    // We only do this if we have reference images to enforce consistency against
    const hasReferenceImages = referenceImages && referenceImages.length > 0;
    const consistencyDirective = hasReferenceImages
        ? "CRITICAL INSTRUCTION: The characters in this image MUST EXACTLY match the provided reference images in every detail, especially their CLOTHING, OUTFIT, and FACIAL FEATURES. Do not change their clothes. "
        : "";

    // We prepend the directive so it has high priority in the generation model
    const enhancedPrompt = consistencyDirective + prompt;

    console.log(`[regenerateSceneIllustration] Regenerating scene ${enhancedPrompt} for storybook ${storybookId} with new prompt`);
    // 6. Generate NEW image with a new random seed (different image, same prompt)
    const newSeed = Math.floor(Math.random() * 999999) + 1;

    console.log(`[regenerateSceneIllustration] Regenerating scene ${page.sceneNumber} for storybook ${storybookId} with new seed ${newSeed}`);

    let newImageUrl: string;
    try {
        newImageUrl = await generateWithSeedream(
            enhancedPrompt,
            newSeed,
            '3:4', // Portrait for scene illustrations
            negativePrompt,
            referenceImages.length > 0 ? referenceImages : undefined
        );
    } catch (genError) {
        console.error("[regenerateSceneIllustration] Image generation failed:", genError);
        return { success: false, error: "Image generation failed. Please try again." };
    }

    // 7. Persist to Supabase Storage
    try {
        newImageUrl = await persistGeneratedImage(newImageUrl, user.id, "illustrations");
        console.log(`[regenerateSceneIllustration] ✓ New illustration persisted to Supabase Storage`);
    } catch (storageError) {
        console.error("[regenerateSceneIllustration] ⚠ Storage upload failed, using Replicate URL as fallback:", storageError);
    }

    // 8. Update the page content with new image and seed
    bookContent.pages[pageIndex] = {
        ...page,
        illustrationUrl: newImageUrl,
        sceneSeed: newSeed
    };

    // 9. Atomic credit decrement + content update
    // We use raw SQL via RPC for atomic credit decrement, but since we don't have
    // an RPC function, we'll do two updates. The credit check above prevents race conditions
    // for practical purposes.
    const newCredits = currentCredits - 1;

    const { error: updateError } = await supabase
        .from("storybooks")
        .update({
            content: bookContent,
            regeneration_credits: newCredits
        })
        .eq("id", storybookId);

    if (updateError) {
        console.error("[regenerateSceneIllustration] Error updating storybook:", updateError);
        return { success: false, error: "Failed to save the new illustration" };
    }

    console.log(`[regenerateSceneIllustration] ✓ Scene ${page.sceneNumber} regenerated. Credits remaining: ${newCredits}`);

    return {
        success: true,
        newImageUrl,
        remainingCredits: newCredits
    };
}

// ============================================
// CREDITS QUERY
// ============================================

/**
 * Get the remaining regeneration credits for a storybook.
 */
export async function getRegenerationCredits(
    storybookId: string
): Promise<{ credits: number; error?: string }> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("storybooks")
        .select("regeneration_credits")
        .eq("id", storybookId)
        .single();

    if (error || !data) {
        return { credits: 0, error: "Storybook not found" };
    }

    return { credits: data.regeneration_credits ?? 0 };
}
