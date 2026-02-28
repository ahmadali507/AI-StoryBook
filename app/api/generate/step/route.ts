import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrderCharacters } from "@/actions/order";
import { updateGenerationProgress } from "@/actions/book-generation";
import {
    generateMVPStoryOutline,
    generatePageText,
    generateBackCoverSummary,
    generateIllustrationPromptForScene,
    generateCoverIllustrationPrompt,
    generateCharacterVisualDescription,
    getNegativePrompt,
} from "@/lib/text-generation";
import { generateWithSeedream as generateImageWithSeedream } from "@/lib/replicate";
import { AgeRange, Theme, MVPArtStyle } from "@/types/storybook";

// Make sure supabase has this RPC or we simply select and update
async function updateGenerationData(supabase: any, orderId: string, newData: any) {
    const { data: order } = await supabase.from('orders').select('generation_progress').eq('id', orderId).single();
    const currentProgress = order?.generation_progress || {};
    const currentData = currentProgress.data || {};
    await supabase.from('orders').update({
        generation_progress: { ...currentProgress, data: { ...currentData, ...newData } }
    }).eq('id', orderId);
}

async function getGenerationData(supabase: any, orderId: string): Promise<any> {
    const { data: order } = await supabase.from('orders').select('generation_progress').eq('id', orderId).single();
    return order?.generation_progress?.data || {};
}

// Ensure max Vercel timeout just in case
export const maxDuration = 300;

/**
 * Step-by-step API for book generation. By breaking the 15-minute generation
 * into discrete client-orchestrated steps, we bypass Vercel's 5-minute timeout.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId, step, data } = body;

        if (!orderId || !step) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Get order details to ensure it exists
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
                    cover_url,
                    description
                )
            `)
            .eq("id", orderId)
            .single();

        if (orderError || !order) throw new Error("Order not found");
        const storybook = order.storybooks;
        if (!storybook) throw new Error("Storybook not found");

        const characters = await getOrderCharacters(orderId);
        if (characters.length === 0) throw new Error("No characters found");

        const ageRange = (storybook.age_range || '5-8') as AgeRange;
        const theme = (storybook.theme || 'adventure') as Theme;
        const artStyle = (storybook.art_style || 'pixar-3d') as MVPArtStyle;
        const startedAt = order.book_generation_started_at || new Date().toISOString();

        let subject = '';
        let userContext = storybook.description || '';
        if (userContext.startsWith('Subject: ')) {
            const subjectEndIndex = userContext.indexOf('.');
            if (subjectEndIndex !== -1) {
                subject = userContext.substring(9, subjectEndIndex).trim();
                userContext = userContext.substring(subjectEndIndex + 1).trim();
            }
        }

        switch (step) {
            case "outline": {
                await updateGenerationProgress(orderId, {
                    stage: 'outline',
                    stageProgress: 0,
                    message: 'Creating your story outline...',
                    startedAt
                });

                const storyOutline = await generateMVPStoryOutline(
                    characters,
                    ageRange,
                    theme,
                    storybook.title,
                    userContext,
                    subject
                );

                await updateGenerationProgress(orderId, {
                    stage: 'outline',
                    stageProgress: 100,
                    message: `Story outline complete: "${storyOutline.title}"`,
                    startedAt
                });

                // Save outline to order temporarily so next steps can use it
                await updateGenerationData(supabase, orderId, { outline: storyOutline });

                if (storyOutline.title && storyOutline.title !== storybook.title) {
                    await supabase.from("storybooks").update({ title: storyOutline.title }).eq("id", storybook.id);
                }

                return NextResponse.json({ success: true, outline: storyOutline });
            }

            case "scene_text": {
                const { sceneIndex, outline, allPreviousScenes } = data;
                const scene = outline.scenes[sceneIndex];

                await updateGenerationProgress(orderId, {
                    stage: 'narrative',
                    stageProgress: Math.round((sceneIndex / 12) * 100),
                    currentScene: scene.number,
                    totalScenes: 12,
                    message: `Writing scene ${scene.number} of 12...`,
                    startedAt
                });

                const pageText = await generatePageText(scene, characters, ageRange, allPreviousScenes, outline);

                // Save to DB
                await updateGenerationData(supabase, orderId, {
                    [`sceneText_${sceneIndex}`]: { pageText, sceneNumber: scene.number, sceneTitle: scene.title }
                });

                return NextResponse.json({ success: true, pageText, sceneNumber: scene.number, sceneTitle: scene.title });
            }

            case "character_consistency": {
                // Generate visual descriptions for all characters to use in prompts
                const characterDescriptions = [];
                for (const char of characters) {
                    const desc = await generateCharacterVisualDescription(char);
                    characterDescriptions.push(desc);
                }

                await updateGenerationData(supabase, orderId, { characterDescriptions });

                return NextResponse.json({ success: true, characterDescriptions });
            }

            case "cover": {
                const { outline, characterDescriptions } = data;

                await updateGenerationProgress(orderId, {
                    stage: 'cover',
                    stageProgress: 0,
                    message: 'Generating cover illustration...',
                    startedAt
                });

                let coverUrl = storybook.cover_url;
                let coverPrompt = "";
                let coverSeed = storybook.global_seed || Math.floor(Math.random() * 1000000);

                if (!coverUrl) {
                    const referenceImages: string[] = [];
                    const characterImageCounts: number[] = [];

                    for (const c of characters) {
                        let charImage: string | null = null;
                        if (c.aiAvatarUrl) {
                            try {
                                const parsed = JSON.parse(c.aiAvatarUrl);
                                if (Array.isArray(parsed) && parsed.length > 0) {
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
                            if (c.photoUrl) {
                                referenceImages.push(c.photoUrl);
                                characterImageCounts.push(1);
                            } else {
                                referenceImages.push("https://via.placeholder.com/512");
                                characterImageCounts.push(1);
                            }
                        }
                    }

                    const artStylePrompt = await getArtStylePrompt(artStyle);
                    coverPrompt = await generateCoverIllustrationPrompt(
                        outline.title,
                        characters,
                        theme,
                        artStylePrompt,
                        characterDescriptions,
                        characterImageCounts
                    );

                    console.log(`[generate-step] Cover Prompt:\n${coverPrompt}`);

                    const negativePrompt = getNegativePrompt(artStylePrompt);

                    coverUrl = await generateImageWithSeedream(
                        coverPrompt,
                        coverSeed,
                        "3:4",
                        negativePrompt,
                        referenceImages.length > 0 ? referenceImages : undefined
                    );

                    await supabase.from("storybooks").update({ cover_url: coverUrl }).eq("id", storybook.id);

                    await supabase.rpc('jsonb_set_generation_data', {
                        p_order_id: orderId,
                        p_key: 'coverUrl',
                        p_value: coverUrl
                    });
                }

                await updateGenerationProgress(orderId, {
                    stage: 'cover',
                    stageProgress: 100,
                    message: 'Cover generated!',
                    startedAt
                });

                return NextResponse.json({ success: true, coverUrl, coverPrompt, coverSeed });
            }

            case "scene_image": {
                const { sceneIndex, pageText, outline, characterDescriptions } = data;
                const scene = outline.scenes[sceneIndex];
                const artStylePrompt = await getArtStylePrompt(artStyle);

                await updateGenerationProgress(orderId, {
                    stage: 'illustrations',
                    stageProgress: Math.round((sceneIndex / 12) * 100),
                    currentIllustration: scene.number,
                    totalIllustrations: 12,
                    message: `Illustrating scene ${scene.number} of 12...`,
                    startedAt
                });

                const sceneSeed = Math.floor(Math.random() * 1000000);

                const illustrationPrompt = await generateIllustrationPromptForScene(
                    scene,
                    characters,
                    artStyle,
                    sceneSeed,
                    characterDescriptions,
                    pageText.visualPrompt
                );

                console.log(`[generate-step] Scene ${scene.number} Prompt:\n${illustrationPrompt}`);

                // Use exactly ONE reference image per character to match the 1-to-1 prompt mapping
                const referenceImages: string[] = [];

                for (const c of characters) {
                    let charImage: string | null = null;
                    if (c.aiAvatarUrl) {
                        try {
                            const parsed = JSON.parse(c.aiAvatarUrl);
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                charImage = parsed[0];
                            } else if (typeof parsed === 'string') {
                                charImage = parsed;
                            }
                        } catch {
                            charImage = c.aiAvatarUrl;
                        }
                    }
                    if (!charImage && c.photoUrl) charImage = c.photoUrl;
                    if (charImage) referenceImages.push(charImage);
                }

                const negativePrompt = getNegativePrompt(artStylePrompt);

                const imageUrl = await generateImageWithSeedream(
                    illustrationPrompt,
                    sceneSeed,
                    "3:4",
                    negativePrompt,
                    referenceImages.length > 0 ? referenceImages : undefined
                );

                const result = {
                    sceneNumber: scene.number,
                    url: imageUrl,
                    prompt: illustrationPrompt,
                    seed: sceneSeed,
                    negPrompt: negativePrompt
                };

                // Append to existing images
                const currentData = await getGenerationData(supabase, orderId);
                const sceneImages = currentData.sceneImages || [];
                sceneImages[sceneIndex] = result;
                await updateGenerationData(supabase, orderId, { sceneImages });

                return NextResponse.json({
                    success: true,
                    ...result
                });
            }

            case "finalize": {
                const { bookPages, outline } = data;

                await updateGenerationProgress(orderId, {
                    stage: 'layout',
                    stageProgress: 50,
                    message: 'Compiling final storybook...',
                    startedAt
                });

                const backCoverSummary = await generateBackCoverSummary(
                    outline.title,
                    outline,
                    characters,
                    ageRange
                );

                const finalPages = [
                    { type: 'cover', pageNumber: 0, illustrationUrl: storybook.cover_url || '' },
                    { type: 'title', pageNumber: 1, text: outline.title },
                    ...bookPages,
                    { type: 'back', pageNumber: bookPages.length + 2, text: backCoverSummary }
                ];

                const bookContent = {
                    title: outline.title,
                    dedication: `To ${characters[0]?.name || 'You'}, a brave adventurer.`,
                    pages: finalPages
                };

                // Build illustration metadata for regeneration
                // Extract from bookPages — illustration pages have illustrationPrompt, sceneSeed, negativePrompt
                const charRefImages: string[] = [];
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
                    if (charImage) charRefImages.push(charImage);
                }

                // Extract metadata from illustration pages in bookPages
                const illustrationMetadata = bookPages
                    .filter((p: any) => p.illustrationPrompt && p.sceneNumber)
                    .map((p: any) => ({
                        sceneNumber: p.sceneNumber,
                        illustrationPrompt: p.illustrationPrompt,
                        sceneSeed: p.sceneSeed,
                        negativePrompt: p.negativePrompt || '',
                        referenceImages: charRefImages
                    }));

                console.log(`[generate-step] Saving illustration_metadata with ${illustrationMetadata.length} entries and 10 regeneration credits`);

                // Update storybook content WITH illustration metadata and regeneration credits
                const { error: updateErr } = await supabase.from("storybooks").update({
                    content: bookContent,
                    status: "complete",
                    regeneration_credits: 10,
                    illustration_metadata: illustrationMetadata
                }).eq("id", storybook.id);

                if (updateErr) {
                    console.error(`[generate-step] Error saving storybook:`, updateErr);
                }

                // Mark order complete
                await supabase.from("orders").update({
                    status: "complete",
                    generation_progress: {
                        stage: 'complete',
                        stageProgress: 100,
                        message: 'Generation complete',
                        startedAt,
                        updatedAt: new Date().toISOString()
                    }
                }).eq("id", orderId);

                return NextResponse.json({ success: true, bookContent });
            }

            default:
                return NextResponse.json({ success: false, error: "Unknown step" }, { status: 400 });
        }
    } catch (error) {
        console.error("[generate-step] API Error:", error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}

// Map styles exactly as done in generation actions
function getArtStylePrompt(artStyle: MVPArtStyle): string {
    switch (artStyle) {
        case 'storybook':
            return "classic storybook illustration style, detailed linework, rich colors, timeless quality";
        case 'pixar-3d':
        default:
            return "Pixar style 3D cinematic scene, high quality 3D render, ultra detailed, global illumination. No text, no logos.";
    }
}
