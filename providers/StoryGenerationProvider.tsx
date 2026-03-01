"use client";

import {
    createContext,
    useContext,
    useRef,
    useCallback,
    type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/providers/ToastProvider";
import {
    useStoryGenerationStore,
    type StoryGenerationParams,
} from "@/stores/story-generation-store";
import {
    generateStoryOutline,
    generateChapter,
    updateStorybook,
    syncStoryContent,
    getStorybookWithChapters,
} from "@/actions/story";
import { verifyPayment } from "@/actions/stripe";
import { generateIllustration, saveIllustration } from "@/actions/illustration";
import type { Character, StorySetting } from "@/types/storybook";

// ─── Context ─────────────────────────────────────────────────────────────────

interface StoryGenerationContextValue {
    startStoryGeneration: (params: StoryGenerationParams) => void;
    startMVPGeneration: (orderId: string, storybookId: string) => void;
}

const StoryGenerationContext = createContext<StoryGenerationContextValue | undefined>(
    undefined
);

// ─── Provider ────────────────────────────────────────────────────────────────

export function StoryGenerationProvider({ children }: { children: ReactNode }) {
    const toast = useToast();
    const queryClient = useQueryClient();
    const generationRef = useRef(false); // guard against double calls

    const {
        startGeneration,
        updateProgress,
        setTitle,
        completeGeneration,
        failGeneration,
    } = useStoryGenerationStore();

    const runGeneration = useCallback(
        async (params: StoryGenerationParams) => {
            const { storybookId, sessionId, characters } = params;

            try {
                // ── Step 1: Verify Payment ──────────────────────────────
                updateProgress(5, "Verifying payment...");
                const paymentResult = await verifyPayment(storybookId, sessionId);

                if (!paymentResult.success || !paymentResult.paid) {
                    throw new Error(paymentResult.error || "Payment verification failed");
                }

                // ── Step 2: Load Storybook Data ─────────────────────────
                updateProgress(8, "Loading storybook data...");
                const storybook = await getStorybookWithChapters(storybookId);
                if (!storybook) {
                    throw new Error("Could not load storybook");
                }
                setTitle(storybook.title);

                // ── Step 3: Generate Outline ────────────────────────────
                const effectiveSetting = (storybook.setting || "fantasy") as StorySetting;
                const targetChapters = storybook.targetChapters || 5;
                const themeString = storybook.theme || "Adventure";

                updateProgress(10, "Planning your adventure...");

                const outlineResult = await generateStoryOutline({
                    characterIds: storybook.characterIds || [],
                    setting: effectiveSetting,
                    targetChapters,
                    theme: themeString,
                    additionalDetails: storybook.description || "",
                });

                if (!outlineResult.success || !outlineResult.outline) {
                    throw new Error(outlineResult.error || "Failed to generate outline");
                }
                const outline = outlineResult.outline;

                // ── Step 4: Generate Chapters + Illustrations ───────────
                const totalSteps = outline.chapters.length * 2;
                let completedSteps = 0;

                for (const chapterOutline of outline.chapters) {
                    // Generate chapter text
                    updateProgress(
                        10 + Math.round((completedSteps / totalSteps) * 80),
                        `Writing Chapter ${chapterOutline.number}: ${chapterOutline.title}...`
                    );

                    const chapterResult = await generateChapter(
                        storybookId,
                        chapterOutline.number,
                        chapterOutline.title,
                        chapterOutline.summary,
                        chapterOutline.sceneDescription
                    );

                    if (!chapterResult.success || !chapterResult.chapterId) {
                        throw new Error(
                            chapterResult.error ||
                            `Failed to generate chapter ${chapterOutline.number}`
                        );
                    }
                    completedSteps++;

                    // Generate illustration
                    updateProgress(
                        10 + Math.round((completedSteps / totalSteps) * 80),
                        `Illustrating Chapter ${chapterOutline.number}...`
                    );

                    const activeCharacters = characters.filter(
                        (c) =>
                            storybook.characterIds?.includes(c.id)
                    );
                    const seed = Math.floor(Math.random() * 1000000);

                    const illustrationResult = await generateIllustration({
                        characters: activeCharacters.length > 0 ? activeCharacters : characters,
                        sceneDescription: chapterOutline.sceneDescription,
                        artStyle: "storybook",
                        seedNumber: seed,
                    });

                    await saveIllustration(
                        chapterResult.chapterId,
                        illustrationResult.imageUrl,
                        illustrationResult.promptUsed,
                        seed
                    );

                    completedSteps++;
                }

                // ── Step 5: Sync & Finalize ─────────────────────────────
                updateProgress(95, "Assembling your storybook...");
                await syncStoryContent(storybookId);
                await updateStorybook(storybookId, { status: "complete" });

                // ── Done! ───────────────────────────────────────────────
                completeGeneration(storybookId);
                toast.success(
                    `Your book "${storybook.title}" is ready! 📚`,
                    8000
                );

                // Invalidate relevant caches so library/orders pages refresh
                queryClient.invalidateQueries({ queryKey: ["orders"] });
                queryClient.invalidateQueries({ queryKey: ["library"] });
                queryClient.invalidateQueries({ queryKey: ["storybooks"] });
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "Failed to generate story";
                console.error("[StoryGenerationProvider] Generation failed:", err);
                failGeneration(message);
                toast.error(`Story generation failed: ${message}`, 8000);
            } finally {
                generationRef.current = false;
            }
        },
        [updateProgress, setTitle, completeGeneration, failGeneration, toast, queryClient]
    );

    const startStoryGeneration = useCallback(
        (params: StoryGenerationParams) => {
            // Prevent double-start
            if (generationRef.current) {
                toast.warning("A story is already being generated.");
                return;
            }
            generationRef.current = true;
            startGeneration(params.storybookId);

            // Fire and forget — this Promise runs in the background
            runGeneration(params);
        },
        [startGeneration, runGeneration, toast]
    );

    const runMVPChunkedGeneration = useCallback(
        async (orderId: string, storybookId: string) => {
            try {
                // Fetch current state to see if we are resuming
                const stateRes = await fetch(`/api/generate/state?orderId=${orderId}`);
                const stateData = await stateRes.json();
                if (!stateData.success) throw new Error(stateData.error || "Failed to fetch state");

                const generationData = stateData.data || {};

                // STEP 1: Outline
                updateProgress(5, "Planning your adventure...");
                let outline = generationData.outline;
                if (!outline) {
                    const outlineRes = await fetch("/api/generate/step", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderId, step: "outline" })
                    });
                    const outlineData = await outlineRes.json();
                    if (!outlineData.success) throw new Error(outlineData.error || "Failed outline");
                    outline = outlineData.outline;
                }
                setTitle(outline.title);

                // STEP 2: Scene Text Generation
                updateProgress(15, "Writing your story...");
                const allPreviousScenes: any[] = [];
                const bookPages: any[] = [];
                for (let i = 0; i < outline.scenes.length; i++) {
                    const sceneKey = `sceneText_${i}`;
                    let sceneData = generationData[sceneKey];

                    if (!sceneData) {
                        updateProgress(15 + Math.round((i / outline.scenes.length) * 15), `Writing Scene ${i + 1}...`);
                        const sceneRes = await fetch("/api/generate/step", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                orderId,
                                step: "scene_text",
                                data: { sceneIndex: i, outline, allPreviousScenes }
                            })
                        });
                        const resJson = await sceneRes.json();
                        if (!resJson.success) throw new Error(resJson.error || `Failed scene text ${i}`);
                        sceneData = { pageText: resJson.pageText, sceneNumber: resJson.sceneNumber, sceneTitle: resJson.sceneTitle };
                    }

                    allPreviousScenes.push({
                        sceneTitle: sceneData.sceneTitle,
                        text: sceneData.pageText.text
                    });

                    bookPages.push({
                        text: sceneData.pageText.text,
                        visualPrompt: sceneData.pageText.visualPrompt,
                        sceneNumber: sceneData.sceneNumber
                    });
                }

                // STEP 3: Character Consistency
                updateProgress(35, "Preparing characters...");
                let characterDescriptions = generationData.characterDescriptions;
                if (!characterDescriptions) {
                    const charRes = await fetch("/api/generate/step", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderId, step: "character_consistency" })
                    });
                    const charData = await charRes.json();
                    if (!charData.success) throw new Error(charData.error || "Failed character descriptions");
                    characterDescriptions = charData.characterDescriptions;
                }

                // STEP 4: Cover Generation
                updateProgress(40, "Designing the cover art...");
                let coverUrl = generationData.coverUrl;
                if (!coverUrl) {
                    const coverRes = await fetch("/api/generate/step", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            orderId,
                            step: "cover",
                            data: { outline, characterDescriptions }
                        })
                    });
                    const coverData = await coverRes.json();
                    if (!coverData.success) throw new Error(coverData.error || "Failed cover");
                    coverUrl = coverData.coverUrl; // Unused directly, but completes step
                }

                // STEP 5: Scene Images
                updateProgress(50, "Illustrating your story...");
                const existingImages = generationData.sceneImages || [];
                for (let i = 0; i < outline.scenes.length; i++) {
                    let imgData = existingImages[i];

                    if (!imgData) {
                        updateProgress(50 + Math.round((i / outline.scenes.length) * 40), `Illustrating Scene ${i + 1}...`);
                        const imgRes = await fetch("/api/generate/step", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                orderId,
                                step: "scene_image",
                                data: {
                                    sceneIndex: i,
                                    pageText: bookPages[i],
                                    outline,
                                    characterDescriptions
                                }
                            })
                        });
                        imgData = await imgRes.json();
                        if (!imgData.success) throw new Error(imgData.error || `Failed scene image ${i}`);
                    }

                    bookPages[i].illustrationUrl = imgData.url;
                    bookPages[i].illustrationPrompt = imgData.prompt;
                    bookPages[i].sceneSeed = imgData.seed;
                    bookPages[i].negativePrompt = imgData.negPrompt;
                }

                // STEP 6: Finalize (Layout & Assembly)
                updateProgress(95, "Assembling your storybook...");
                // We format the bookPages array into the final structure expected by generateFullBook
                const finalPagesMap: any[] = [];
                bookPages.forEach((page, index) => {
                    // Illustration spread (Left)
                    finalPagesMap.push({
                        pageNumber: 3 + (index * 2),
                        type: 'story',
                        illustrationUrl: page.illustrationUrl,
                        sceneNumber: page.sceneNumber,
                        illustrationPrompt: page.illustrationPrompt,
                        sceneSeed: page.sceneSeed,
                        negativePrompt: page.negativePrompt
                    });
                    // Text spread (Right)
                    finalPagesMap.push({
                        pageNumber: 4 + (index * 2),
                        type: 'story',
                        text: page.text,
                        sceneNumber: page.sceneNumber
                    });
                });

                const finalizeRes = await fetch("/api/generate/step", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        orderId,
                        step: "finalize",
                        data: { bookPages: finalPagesMap, outline }
                    })
                });
                const finalizeData = await finalizeRes.json();
                if (!finalizeData.success) throw new Error(finalizeData.error || "Failed finalizing book");

                // Done
                completeGeneration(storybookId);
                toast.success("Your book is ready! 📚", 8000);

                queryClient.invalidateQueries({ queryKey: ["orders"] });
                queryClient.invalidateQueries({ queryKey: ["library"] });
                queryClient.invalidateQueries({ queryKey: ["storybooks"] });

            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to generate story";
                console.error("[StoryGenerationProvider] MVP Chunked Generation failed:", err);
                failGeneration(message);
                toast.error(`Story generation failed: ${message}`, 8000);
            } finally {
                generationRef.current = false;
            }
        },
        [completeGeneration, failGeneration, toast, queryClient, setTitle, updateProgress]
    );

    const startMVPGeneration = useCallback(
        (orderId: string, storybookId: string) => {
            if (generationRef.current) {
                toast.warning("A story is already being generated.");
                return;
            }
            generationRef.current = true;

            // Set initial UI state immediately
            startGeneration(storybookId);

            // Fetch chunked orchestration loop instead of awaiting long-running server action
            runMVPChunkedGeneration(orderId, storybookId);
        },
        [startGeneration, runMVPChunkedGeneration, toast]
    );

    return (
        <StoryGenerationContext.Provider value={{ startStoryGeneration, startMVPGeneration }}>
            {children}
        </StoryGenerationContext.Provider>
    );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useStoryGeneration(): StoryGenerationContextValue {
    const context = useContext(StoryGenerationContext);
    if (!context) {
        throw new Error(
            "useStoryGeneration must be used within a StoryGenerationProvider"
        );
    }
    return context;
}
