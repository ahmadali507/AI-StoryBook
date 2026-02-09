"use server";

import { createClient } from "@/lib/supabase/server";
import {
    generateMVPStoryOutline,
    generatePageText,
    generateBackCoverSummary,
    generateIllustrationPromptForScene,
    generateCoverIllustrationPrompt,
    generateCharacterVisualDescription,
    getNegativePrompt,
    type StoryOutline,
    type SceneOutline,
    type CharacterVisualDescription
} from "@/lib/text-generation";
import { generateWithSeedream, generateBookCover } from "@/lib/replicate";
import { getOrderCharacters } from "@/actions/order";
import type { SimpleCharacter, AgeRange, Theme, MVPArtStyle } from "@/types/storybook";
import { MVP_ART_STYLES } from "@/types/storybook";

// ============================================
// GENERATION PROGRESS TRACKING
// ============================================

export type GenerationStage =
    | 'payment'
    | 'outline'
    | 'narrative'
    | 'cover'
    | 'illustrations'
    | 'layout'
    | 'complete'
    | 'failed';

export interface GenerationProgress {
    stage: GenerationStage;
    stageProgress: number; // 0-100
    currentScene?: number;
    totalScenes?: number;
    currentIllustration?: number;
    totalIllustrations?: number;
    message: string;
    startedAt: string;
    updatedAt: string;
}

/**
 * Update the generation progress for an order
 */
async function updateGenerationProgress(
    orderId: string,
    progress: Partial<GenerationProgress>
): Promise<void> {
    const supabase = await createClient();

    const currentProgress: GenerationProgress = {
        stage: progress.stage || 'outline',
        stageProgress: progress.stageProgress || 0,
        currentScene: progress.currentScene,
        totalScenes: progress.totalScenes || 12,
        currentIllustration: progress.currentIllustration,
        totalIllustrations: progress.totalIllustrations || 12,
        message: progress.message || '',
        startedAt: progress.startedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await supabase
        .from("orders")
        .update({ generation_progress: currentProgress })
        .eq("id", orderId);
}

/**
 * Get detailed generation progress for an order
 */
export async function getDetailedGenerationProgress(orderId: string): Promise<{
    status: string;
    progress: GenerationProgress | null;
    overallProgress: number;
}> {
    const supabase = await createClient();

    const { data: order } = await supabase
        .from("orders")
        .select("status, generation_progress")
        .eq("id", orderId)
        .single();

    if (!order) {
        return {
            status: 'unknown',
            progress: null,
            overallProgress: 0
        };
    }

    const progress = order.generation_progress as GenerationProgress | null;

    // Calculate overall progress based on stage
    let overallProgress = 0;
    if (progress) {
        switch (progress.stage) {
            case 'payment':
                overallProgress = 5;
                break;
            case 'outline':
                overallProgress = 10 + (progress.stageProgress * 0.05);
                break;
            case 'narrative':
                overallProgress = 15 + (progress.stageProgress * 0.15);
                break;
            case 'cover':
                overallProgress = 30 + (progress.stageProgress * 0.05);
                break;
            case 'illustrations':
                overallProgress = 35 + (progress.stageProgress * 0.55);
                break;
            case 'layout':
                overallProgress = 90 + (progress.stageProgress * 0.08);
                break;
            case 'complete':
                overallProgress = 100;
                break;
            case 'failed':
                overallProgress = 0;
                break;
        }
    }

    return {
        status: order.status,
        progress,
        overallProgress: Math.round(overallProgress)
    };
}

// ============================================
// BOOK GENERATION PIPELINE
// ============================================

interface BookPage {
    pageNumber: number;
    type: 'cover' | 'title' | 'story' | 'end' | 'back';
    text?: string;
    illustrationUrl?: string;
    sceneNumber?: number;
}

interface GeneratedBook {
    title: string;
    dedication: string;
    pages: BookPage[];
    pdfUrl?: string;
}

/**
 * Get the art style prompt modifier based on selected style
 */
function getArtStylePrompt(artStyle: MVPArtStyle): string {
    const style = MVP_ART_STYLES.find(s => s.id === artStyle);
    if (!style) return "children's book illustration style";

    switch (artStyle) {
        case 'watercolor':
            return "soft watercolor children's book illustration, gentle color washes, dreamy atmosphere, delicate brushstrokes";
        case 'soft-illustration':
            return "warm cozy illustration with rounded shapes, soft colors, gentle shading, Pixar-style warmth";
        case 'classic-storybook':
            return "classic storybook illustration style, detailed linework, rich colors, timeless quality";
        case 'modern-cartoon':
            return "modern cartoon style, vibrant colors, clean lines, expressive characters, contemporary children's book";
        default:
            return "children's book illustration style";
    }
}

/**
 * Generate the complete book for an order
 * This is the main entry point for book generation after payment
 */
export async function generateFullBook(orderId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    console.log(`[generateFullBook] Starting generation for order: ${orderId}`);

    try {
        // 1. Get order details
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select(`
                *,
                storybooks (
                    id,
                    title,
                    art_style,
                    theme,
                    age_range,
                    global_seed
                )
            `)
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            throw new Error("Order not found");
        }

        const storybook = order.storybooks;
        if (!storybook) {
            throw new Error("Storybook not found for order");
        }

        // 2. Get characters
        const characters = await getOrderCharacters(orderId);
        if (characters.length === 0) {
            throw new Error("No characters found for order");
        }

        const ageRange = (storybook.age_range || '5-8') as AgeRange;
        const theme = (storybook.theme || 'adventure') as Theme;
        const artStyle = (storybook.art_style || 'soft-illustration') as MVPArtStyle;
        const globalSeed = storybook.global_seed || Math.floor(Math.random() * 1000000);

        console.log(`[generateFullBook] Generating story for age ${ageRange}, theme ${theme}`);

        const startedAt = new Date().toISOString();

        // Track progress: Starting outline generation
        await updateGenerationProgress(orderId, {
            stage: 'outline',
            stageProgress: 0,
            message: 'Creating your story outline...',
            startedAt
        });

        // 3. Generate story outline
        const storyOutline = await generateMVPStoryOutline(
            characters,
            ageRange,
            theme,
            storybook.title
        );

        console.log(`[generateFullBook] Story outline generated: "${storyOutline.title}"`);

        await updateGenerationProgress(orderId, {
            stage: 'outline',
            stageProgress: 100,
            message: `Story outline complete: "${storyOutline.title}"`,
            startedAt
        });

        // Update storybook with title if generated
        if (storyOutline.title && storyOutline.title !== storybook.title) {
            await supabase
                .from("storybooks")
                .update({ title: storyOutline.title })
                .eq("id", storybook.id);
        }

        // 4. Generate all page texts
        const pageTexts: { sceneNumber: number; text: string; visualPrompt: string }[] = [];
        let previousText = '';

        // Track progress: Starting narrative generation
        await updateGenerationProgress(orderId, {
            stage: 'narrative',
            stageProgress: 0,
            currentScene: 0,
            totalScenes: 12,
            message: 'Writing your story...',
            startedAt
        });

        for (const scene of storyOutline.scenes) {
            console.log(`[generateFullBook] Generating text for scene ${scene.number}/12`);

            // Update progress for each scene
            await updateGenerationProgress(orderId, {
                stage: 'narrative',
                stageProgress: Math.round(((scene.number - 1) / 12) * 100),
                currentScene: scene.number,
                totalScenes: 12,
                message: `Writing scene ${scene.number} of 12...`,
                startedAt
            });

            const pageText = await generatePageText(
                scene,
                characters,
                ageRange,
                previousText
            );

            pageTexts.push({
                sceneNumber: scene.number,
                text: pageText.text,
                visualPrompt: pageText.visualPrompt
            });

            previousText = pageText.text;
        }

        // 5. Generate back cover summary
        const backCoverSummary = await generateBackCoverSummary(
            storyOutline.title,
            storyOutline,
            characters,
            ageRange
        );

        console.log(`[generateFullBook] All story text generated`);

        await updateGenerationProgress(orderId, {
            stage: 'narrative',
            stageProgress: 100,
            currentScene: 12,
            totalScenes: 12,
            message: 'All story text complete!',
            startedAt
        });

        // 6. Generate illustrations
        const artStylePrompt = getArtStylePrompt(artStyle);
        const illustrations: { sceneNumber: number; url: string }[] = [];

        // Track progress: Starting cover
        await updateGenerationProgress(orderId, {
            stage: 'cover',
            stageProgress: 0,
            message: 'Generating cover illustration...',
            startedAt
        });

        // Generate character visual descriptions for consistency FIRST
        // This is needed for both cover and scene illustrations
        console.log(`[generateFullBook] Generating character descriptions for consistency...`);
        const characterDescriptions: CharacterVisualDescription[] = [];
        for (const char of characters) {
            const desc = await generateCharacterVisualDescription(char);
            characterDescriptions.push(desc);
            console.log(`[generateFullBook] Character ${char.name}: ${desc.consistencyKeywords}`);
        }

        // Get appropriate negative prompt for the art style
        const negativePrompt = getNegativePrompt(artStylePrompt);

        // Generate cover first (or use existing if already generated)
        let coverUrl = storybook.cover_url;
        if (!coverUrl) {
            console.log(`[generateFullBook] Generating cover illustration`);
            const coverPrompt = await generateCoverIllustrationPrompt(
                storyOutline.title,
                characters,
                theme,
                artStylePrompt,
                characterDescriptions
            );
            coverUrl = await generateBookCover(coverPrompt, globalSeed, negativePrompt);
        }

        await updateGenerationProgress(orderId, {
            stage: 'cover',
            stageProgress: 100,
            message: 'Cover illustration complete!',
            startedAt
        });

        // Track progress: Starting illustrations
        await updateGenerationProgress(orderId, {
            stage: 'illustrations',
            stageProgress: 0,
            currentIllustration: 0,
            totalIllustrations: 12,
            message: 'Creating beautiful illustrations...',
            startedAt
        });

        // Generate scene illustrations
        for (let i = 0; i < storyOutline.scenes.length; i++) {
            const scene = storyOutline.scenes[i];
            const pageText = pageTexts[i];

            console.log(`[generateFullBook] Generating illustration ${i + 1}/12`);

            // Update progress for each illustration
            await updateGenerationProgress(orderId, {
                stage: 'illustrations',
                stageProgress: Math.round((i / 12) * 100),
                currentIllustration: i + 1,
                totalIllustrations: 12,
                message: `Creating illustration ${i + 1} of 12...`,
                startedAt
            });

            // Use character descriptions for consistent appearance
            const illustrationPrompt = await generateIllustrationPromptForScene(
                { ...scene, sceneDescription: pageText.visualPrompt },
                characters,
                artStylePrompt,
                globalSeed,
                characterDescriptions
            );

            // Use seed + scene number for consistency
            const sceneSeed = globalSeed + scene.number;
            const illustrationUrl = await generateWithSeedream(
                illustrationPrompt,
                sceneSeed,
                '4:3', // Landscape for scene illustrations
                negativePrompt
            );

            illustrations.push({
                sceneNumber: scene.number,
                url: illustrationUrl
            });
        }

        console.log(`[generateFullBook] All illustrations generated`);

        await updateGenerationProgress(orderId, {
            stage: 'illustrations',
            stageProgress: 100,
            currentIllustration: 12,
            totalIllustrations: 12,
            message: 'All illustrations complete!',
            startedAt
        });

        // Track progress: Starting layout
        await updateGenerationProgress(orderId, {
            stage: 'layout',
            stageProgress: 0,
            message: 'Compiling your beautiful book...',
            startedAt
        });

        // 7. Compile book structure
        const bookContent: GeneratedBook = {
            title: storyOutline.title,
            dedication: storyOutline.dedication,
            pages: []
        };

        // ... (pages compilation logic) ...

        await updateGenerationProgress(orderId, {
            stage: 'layout',
            stageProgress: 50,
            message: 'Finalizing pages...',
            startedAt
        });

        // Page 1: Cover
        bookContent.pages.push({
            pageNumber: 1,
            type: 'cover',
            illustrationUrl: coverUrl
        });

        // Page 2: Title + Dedication
        bookContent.pages.push({
            pageNumber: 2,
            type: 'title',
            text: `${storyOutline.title}\n\n${storyOutline.dedication}`
        });

        // Pages 3-14: Story pages (12 scenes = 12 illustration + text pairs)
        for (let i = 0; i < 12; i++) {
            const pageText = pageTexts[i];
            const illustration = illustrations[i];

            // Illustration page
            bookContent.pages.push({
                pageNumber: 3 + (i * 2),
                type: 'story',
                illustrationUrl: illustration?.url,
                sceneNumber: i + 1
            });

            // Text page
            bookContent.pages.push({
                pageNumber: 4 + (i * 2),
                type: 'story',
                text: pageText?.text,
                sceneNumber: i + 1
            });
        }

        // Page 23: "The End"
        bookContent.pages.push({
            pageNumber: 23,
            type: 'end',
            text: 'The End'
        });

        // Page 24: Back cover
        bookContent.pages.push({
            pageNumber: 24,
            type: 'back',
            text: backCoverSummary
        });

        // 8. Store book content in database
        const bookContentJson = JSON.stringify(bookContent);

        await supabase
            .from("storybooks")
            .update({
                content: bookContent,
                cover_url: coverUrl,
                status: 'complete'
            })
            .eq("id", storybook.id);

        // 9. Update order status
        await supabase
            .from("orders")
            .update({
                status: "complete",
                book_completed_at: new Date().toISOString()
            })
            .eq("id", orderId);

        console.log(`[generateFullBook] Book generation complete for order: ${orderId}`);

        await updateGenerationProgress(orderId, {
            stage: 'complete',
            stageProgress: 100,
            message: 'Book generation complete!',
            startedAt
        });

        // TODO: Generate PDF and upload
        // TODO: Send email notification

        return { success: true };

    } catch (error) {
        console.error("[generateFullBook] Error:", error);

        // Update progress to failed
        await updateGenerationProgress(orderId, {
            stage: 'failed',
            stageProgress: 0,
            message: 'Generation failed. Please contact support.',
            startedAt: new Date().toISOString() // New timestamp for error
        });

        // Update order with error status
        await supabase
            .from("orders")
            .update({
                status: "failed",
                // Store error for debugging
            })
            .eq("id", orderId);

        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        };
    }
}

/**
 * Generate just the cover for preview before payment
 */
export async function generateCoverForOrder(orderId: string): Promise<{ success: boolean; coverUrl?: string; error?: string }> {
    const supabase = await createClient();

    try {
        // Get order details
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select(`
                *,
                storybooks (
                    id,
                    title,
                    art_style,
                    theme,
                    age_range,
                    global_seed
                )
            `)
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            return { success: false, error: "Order not found" };
        }

        const storybook = order.storybooks;
        if (!storybook) {
            return { success: false, error: "Storybook not found" };
        }

        // Get characters
        const characters = await getOrderCharacters(orderId);
        if (characters.length === 0) {
            return { success: false, error: "No characters found" };
        }

        const theme = (storybook.theme || 'adventure') as Theme;
        const artStyle = (storybook.art_style || 'soft-illustration') as MVPArtStyle;
        const globalSeed = storybook.global_seed || Math.floor(Math.random() * 1000000);

        // Generate title if not provided
        let title = storybook.title || "My Personalized Story";
        if (title === "My Personalized Story") {
            // Generate a better title based on theme and main character
            const mainChar = characters.find(c => c.role === 'main') || characters[0];
            title = `${mainChar.name}'s ${theme.charAt(0).toUpperCase() + theme.slice(1)} Adventure`;

            await supabase
                .from("storybooks")
                .update({ title })
                .eq("id", storybook.id);
        }

        // Generate cover illustration prompt
        const artStylePrompt = getArtStylePrompt(artStyle);
        const coverPrompt = await generateCoverIllustrationPrompt(
            title,
            characters,
            theme,
            artStylePrompt
        );

        // Generate cover image
        const coverUrl = await generateBookCover(
            coverPrompt,
            globalSeed,
            'blurry, bad quality, distorted, text, words, letters'
        );

        // Update storybook with cover
        await supabase
            .from("storybooks")
            .update({ cover_url: coverUrl })
            .eq("id", storybook.id);

        // Update order status
        await supabase
            .from("orders")
            .update({
                status: "cover_preview",
                cover_generated_at: new Date().toISOString()
            })
            .eq("id", orderId);

        return { success: true, coverUrl };

    } catch (error) {
        console.error("[generateCoverForOrder] Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to generate cover"
        };
    }
}

/**
 * Get the current generation progress
 */
export async function getGenerationProgress(orderId: string): Promise<{
    status: string;
    progress: number;
    message: string;
}> {
    const supabase = await createClient();

    const { data: order } = await supabase
        .from("orders")
        .select("status, book_generation_started_at, book_completed_at")
        .eq("id", orderId)
        .single();

    if (!order) {
        return { status: 'unknown', progress: 0, message: 'Order not found' };
    }

    switch (order.status) {
        case 'draft':
            return { status: 'draft', progress: 0, message: 'Order not started' };
        case 'cover_preview':
            return { status: 'cover_preview', progress: 10, message: 'Cover ready, awaiting payment' };
        case 'paid':
            return { status: 'paid', progress: 15, message: 'Payment received, starting generation' };
        case 'generating':
            // Estimate progress based on time elapsed
            const startTime = order.book_generation_started_at ? new Date(order.book_generation_started_at).getTime() : Date.now();
            const elapsed = (Date.now() - startTime) / 1000 / 60; // minutes
            const estimatedTotal = 15; // 15 minutes estimated
            const progress = Math.min(20 + (elapsed / estimatedTotal) * 75, 95);
            return {
                status: 'generating',
                progress: Math.round(progress),
                message: 'Generating your personalized book...'
            };
        case 'complete':
            return { status: 'complete', progress: 100, message: 'Your book is ready!' };
        case 'failed':
            return { status: 'failed', progress: 0, message: 'Generation failed, please contact support' };
        default:
            return { status: order.status, progress: 50, message: 'Processing...' };
    }
}
