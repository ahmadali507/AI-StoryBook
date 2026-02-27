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

    return (
        <StoryGenerationContext.Provider value={{ startStoryGeneration }}>
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
