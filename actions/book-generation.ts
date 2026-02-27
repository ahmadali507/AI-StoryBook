"use server";



import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
    type CharacterVisualDescription,
    type PreviousSceneContext
} from "@/lib/text-generation";
import { generateWithSeedream, generateBookCover } from "@/lib/replicate";
import { persistGeneratedImageAdmin } from "@/lib/storage-utils";
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
    const supabase = createAdminClient();

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

    const { error } = await supabase
        .from("orders")
        .update({ generation_progress: currentProgress })
        .eq("id", orderId);

    if (error) {
        console.error(`[updateGenerationProgress] Error updating progress for order ${orderId}:`, error);
    }
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
    // Prompt metadata for image regeneration
    illustrationPrompt?: string;
    sceneSeed?: number;
    negativePrompt?: string;
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
    if (!style) return "Pixar style 3D cinematic scene, high quality 3D render, ultra detailed";

    switch (artStyle) {
        case 'pixar-3d':
            return "Pixar style 3D cinematic scene, high quality 3D render, ultra detailed, global illumination. No text, no logos.";
        case 'storybook':
            return "classic storybook illustration style, detailed linework, rich colors, timeless quality";
        default:
            return "children's book illustration style";
    }
}

/**
 * Build a structured prompt for Seedream 4.5 with character references
 */
function buildPixarPrompt(
    sceneDescription: string,
    characters: SimpleCharacter[],
    characterDescriptions: CharacterVisualDescription[],
    lighting: string = "Cinematic composition, soft shadows, depth of field, warm tones"
): string {
    // 1. Scene Setting
    let prompt = `Pixar style 3D cinematic scene. ${sceneDescription}, ${lighting}.\n\n`;

    // 2. Character Actions (Mapped to References)
    characters.forEach((char, index) => {
        // Find specific description for this character
        const charDesc = characterDescriptions.find(d => d.name === char.name);
        const appearance = charDesc ? charDesc.visualPrompt : char.appearance;

        // This format explicitly tells Seedream "Character X" corresponds to "reference image X"
        // provided in the `image_input` array
        prompt += `Character ${index + 1}: [reference image ${index + 1}] – ${char.name}, ${appearance}\n`;
    });

    // 3. Style enforcement
    prompt += `\nHigh quality 3D render, ultra detailed, global illumination. No text, no logos.`;

    return prompt;
}

/**
 * Generate the complete book for an order
 * This is the main entry point for book generation after payment
 */
export async function generateFullBook(orderId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const adminSupabase = createAdminClient(); // Use admin client for writes

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
                    global_seed,
                    global_seed,
                    cover_url,
                    description
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
        const artStyle = (storybook.art_style || 'pixar-3d') as MVPArtStyle;
        const globalSeed = storybook.global_seed || Math.floor(Math.random() * 1000000);
        const referenceImages = characters.map(c => c.photoUrl).filter(url => !!url) as string[];

        console.log(`[generateFullBook] Generating story for age ${ageRange}, theme ${theme}`);

        const startedAt = new Date().toISOString();

        // Track progress: Starting outline generation
        await updateGenerationProgress(orderId, {
            stage: 'outline',
            stageProgress: 0,
            message: 'Creating your story outline...',
            startedAt
        });

        // Extract Subject from description if present (format: "Subject: [Subject Name]. [User Description]")
        let subject = '';
        let userContext = storybook.description || '';

        if (userContext.startsWith('Subject: ')) {
            const subjectEndIndex = userContext.indexOf('.');
            if (subjectEndIndex !== -1) {
                subject = userContext.substring(9, subjectEndIndex).trim();
                userContext = userContext.substring(subjectEndIndex + 1).trim();
            }
        }

        // 3. Generate story outline
        const storyOutline = await generateMVPStoryOutline(
            characters,
            ageRange,
            theme,
            storybook.title,
            userContext, // Pass cleaned user description
            subject // Pass extracted subject
        );

        console.log(`[generateFullBook] Story outline generated: "${storyOutline.title}"`);

        await updateGenerationProgress(orderId, {
            stage: 'outline',
            stageProgress: 100,
            message: `Story outline complete: "${storyOutline.title}"`,
            startedAt
        });

        // Update storybook with title if generated (Using admin client)
        if (storyOutline.title && storyOutline.title !== storybook.title) {
            const { error: titleError } = await adminSupabase
                .from("storybooks")
                .update({ title: storyOutline.title })
                .eq("id", storybook.id);

            if (titleError) {
                console.error(`[generateFullBook] Error updating title for storybook ${storybook.id}:`, titleError);
            }
        }

        // 4. Generate all page texts with cumulative context
        const pageTexts: { sceneNumber: number; text: string; visualPrompt: string }[] = [];
        const allPreviousScenes: PreviousSceneContext[] = [];

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

            // Add small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 100));

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
                allPreviousScenes.length > 0 ? allPreviousScenes : undefined,
                storyOutline
            );

            pageTexts.push({
                sceneNumber: scene.number,
                text: pageText.text,
                visualPrompt: pageText.visualPrompt
            });

            // Add to cumulative context for next scene
            allPreviousScenes.push({
                sceneTitle: scene.title,
                text: pageText.text
            });
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
        const illustrations: { sceneNumber: number; url: string; prompt: string; seed: number; negPrompt: string; refImages: string[] }[] = [];

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
            console.log(`[generateFullBook] Generating cover illustration (no existing cover found)`);

            // Use EXACTLY ONE reference image per character to match the 1-to-1 prompt mapping
            // This is critical for index alignment in the prompt: "Character N ... (reference image N)"
            const referenceImages: string[] = [];
            const characterImageCounts: number[] = [];

            for (const c of characters) {
                let charImage: string | null = null;

                if (c.aiAvatarUrl) {
                    try {
                        const parsed = JSON.parse(c.aiAvatarUrl);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            // Use the FIRST image (Front/Closeup) as the canonical reference
                            charImage = parsed[0];
                        } else if (typeof parsed === 'string') {
                            charImage = parsed;
                        }
                    } catch {
                        charImage = c.aiAvatarUrl;
                    }
                }

                if (!charImage && c.photoUrl) {
                    charImage = c.photoUrl;
                }

                if (charImage) {
                    referenceImages.push(charImage);
                    characterImageCounts.push(1);
                } else {
                    console.warn(`[generateFullBook] Cover: No reference image found for character ${c.name}, skipping visual ref`);
                    // We must push a placeholder or duplicate to maintain index alignment if possible, 
                    // or just accept prompt will be off. 
                    // Better to push the photoUrl even if raw.
                    if (c.photoUrl) {
                        referenceImages.push(c.photoUrl);
                        characterImageCounts.push(1);
                    } else {
                        // Critical failure for alignment. 
                        console.error(`[generateFullBook] Cover: CRITICAL - Character ${c.name} has NO images. Indices will be misaligned.`);
                        // Attempt to maintain alignment by pushing a dummy? Replicate might fail.
                        // Best effort:
                        referenceImages.push("https://via.placeholder.com/512"); // Placeholder to keep index
                        characterImageCounts.push(1);
                    }
                }
            }

            const coverPrompt = await generateCoverIllustrationPrompt(
                storyOutline.title,
                characters,
                theme,
                artStylePrompt,
                characterDescriptions,
                characterImageCounts
            );

            console.log(`[generateFullBook] ------------------------------------------------------------`);
            console.log(`[generateFullBook] Cover Prompt:\n${coverPrompt}`);
            console.log(`[generateFullBook] ------------------------------------------------------------`);

            coverUrl = await generateBookCover(coverPrompt, globalSeed, negativePrompt, referenceImages);

            // Persist cover to Supabase Storage so URL never expires
            try {
                coverUrl = await persistGeneratedImageAdmin(coverUrl, order.user_id, "covers");
                console.log(`[generateFullBook] ✓ Cover persisted to Supabase Storage`);
            } catch (storageError) {
                console.error(`[generateFullBook] ⚠ Cover storage upload failed, using Replicate URL as fallback:`, storageError);
            }

            // Should also save this new cover URL to DB if generated here
            const { error: coverUpdateError } = await adminSupabase
                .from("storybooks")
                .update({ cover_url: coverUrl })
                .eq("id", storybook.id);

            if (coverUpdateError) {
                console.error(`[generateFullBook] Error updating cover URL for storybook ${storybook.id}:`, coverUpdateError);
            }
        } else {
            console.log(`[generateFullBook] Reusing existing cover illustration: ${coverUrl}`);
        }

        await updateGenerationProgress(orderId, {
            stage: 'cover',
            stageProgress: 100,
            message: 'Cover illustration verified!',
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

            // 1. Collect Character Reference Images
            // Strategy: Use EXACTLY ONE reference image per character to match the 1-to-1 prompt mapping
            const referenceImages: string[] = [];

            for (const c of characters) {
                let charImage: string | null = null;

                if (c.aiAvatarUrl) {
                    try {
                        const parsed = JSON.parse(c.aiAvatarUrl);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            // Use the FIRST image (Front/Closeup) as the canonical reference
                            charImage = parsed[0];
                        } else if (typeof parsed === 'string') {
                            charImage = parsed;
                        } else if (Array.isArray(parsed)) {
                            // Fallback check
                            charImage = parsed[0];
                        }
                    } catch {
                        charImage = c.aiAvatarUrl;
                    }
                }

                if (!charImage && c.photoUrl) {
                    charImage = c.photoUrl;
                }

                if (charImage) {
                    referenceImages.push(charImage);
                } else {
                    // Critical: We MUST have an image for every character to keep indices aligned.
                    // If a character has no image, we might need a placeholder or just skip them in the PROMPT too.
                    // For now, let's assume valid characters have images. If not, this might misalign.
                    // However, the upstream logic ensures characters created have avatars.
                    // To be safe, if we miss an image, we should probably warn or push a placeholder if the API supports it.
                    // But strictly, we'll just push the best we have.
                    console.warn(`[generateFullBook] No reference image found for character ${c.name}`);
                    // We still push something to maintain index alignment if possible, but empty string might fail API.
                    // Let's rely on standard flow.
                }
            }

            // Verify alignment
            if (referenceImages.length !== characters.length) {
                console.warn(`[generateFullBook] Mismatch between characters (${characters.length}) and reference images (${referenceImages.length}). Character mapping may be incorrect.`);
            }

            console.log(`[generateFullBook] Using ${referenceImages.length} reference images for scene ${i + 1} (1-to-full mapping)`);

            // Use seed + scene number for consistency
            const sceneSeed = globalSeed + scene.number;

            // Construct specific prompt using the structured builder
            const illustrationPrompt = await generateIllustrationPromptForScene(
                scene,
                characters,
                artStyle, // Pass the ID string e.g 'pixar-3d'
                sceneSeed,
                characterDescriptions,
                pageText.visualPrompt // Use the text-derived visual prompt for better text-image sync
            );

            console.log(`[generateFullBook] ------------------------------------------------------------`);
            console.log(`[generateFullBook] Scene ${i + 1} Prompt:\n${illustrationPrompt}`);
            console.log(`[generateFullBook] ------------------------------------------------------------`);

            const illustrationUrl = await generateWithSeedream(
                illustrationPrompt,
                sceneSeed,
                '3:4', // Portrait for scene illustrations
                negativePrompt,
                referenceImages // Pass ONLY character avatars
            );

            // Persist illustration to Supabase Storage so URL never expires
            let permanentIllustrationUrl = illustrationUrl;
            try {
                permanentIllustrationUrl = await persistGeneratedImageAdmin(illustrationUrl, order.user_id, "illustrations");
                console.log(`[generateFullBook] ✓ Illustration ${i + 1} persisted to Supabase Storage`);
            } catch (storageError) {
                console.error(`[generateFullBook] ⚠ Illustration ${i + 1} storage upload failed, using Replicate URL as fallback:`, storageError);
            }

            illustrations.push({
                sceneNumber: scene.number,
                url: permanentIllustrationUrl,
                prompt: illustrationPrompt,
                seed: sceneSeed,
                negPrompt: negativePrompt,
                refImages: referenceImages
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

            // Illustration page (left side of spread)
            bookContent.pages.push({
                pageNumber: 3 + (i * 2),
                type: 'story',
                illustrationUrl: illustration?.url,
                sceneNumber: i + 1,
                illustrationPrompt: illustration?.prompt,
                sceneSeed: illustration?.seed,
                negativePrompt: illustration?.negPrompt
            });

            // Text page (right side of spread)
            bookContent.pages.push({
                pageNumber: 4 + (i * 2),
                type: 'story',
                text: pageText?.text,
                sceneNumber: i + 1
            });
        }

        // Back cover (last page)
        bookContent.pages.push({
            pageNumber: bookContent.pages.length + 1,
            type: 'back',
            text: backCoverSummary
        });

        // Build illustration metadata for regeneration
        const illustrationMetadata = illustrations.map(ill => ({
            sceneNumber: ill.sceneNumber,
            illustrationPrompt: ill.prompt,
            sceneSeed: ill.seed,
            negativePrompt: ill.negPrompt,
            referenceImages: ill.refImages
        }));

        const { error: contentError } = await adminSupabase
            .from("storybooks")
            .update({
                content: bookContent,
                cover_url: coverUrl,
                status: 'complete',
                regeneration_credits: 10,
                illustration_metadata: illustrationMetadata
            })
            .eq("id", storybook.id);

        if (contentError) {
            console.error(`[generateFullBook] Error saving book content for storybook ${storybook.id}:`, contentError);
            // Don't throw here, try to update order status anyway, but log critical error
        }

        // 9. Update order status - USING ADMIN CLIENT FOR ROBUSTNESS
        const { error: orderUpdateError } = await adminSupabase
            .from("orders")
            .update({
                status: "complete",
                book_completed_at: new Date().toISOString()
            })
            .eq("id", orderId);

        if (orderUpdateError) {
            console.error(`[generateFullBook] Error updating order status to complete for order ${orderId}:`, orderUpdateError);
        }

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

        // Update order with error status - USING ADMIN CLIENT
        const adminSupabase = createAdminClient();
        await adminSupabase
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
