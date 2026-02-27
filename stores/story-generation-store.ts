import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Character, StorySetting, ArtStyle } from "@/types/storybook";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StoryGenerationParams {
    storybookId: string;
    sessionId: string;
    characters: Character[];
}

interface StoryGenerationState {
    // Generation status
    isGenerating: boolean;
    storybookId: string | null;
    storyTitle: string | null;
    progress: number;
    currentStep: string;
    error: string | null;
    completedStorybookId: string | null;

    // Actions
    startGeneration: (storybookId: string) => void;
    updateProgress: (progress: number, currentStep: string) => void;
    setTitle: (title: string) => void;
    completeGeneration: (storybookId: string) => void;
    failGeneration: (error: string) => void;
    reset: () => void;
    clearCompleted: () => void;
}

const initialState = {
    isGenerating: false,
    storybookId: null as string | null,
    storyTitle: null as string | null,
    progress: 0,
    currentStep: "",
    error: null as string | null,
    completedStorybookId: null as string | null,
};

// ─── Store ───────────────────────────────────────────────────────────────────

export const useStoryGenerationStore = create<StoryGenerationState>()(
    persist(
        (set) => ({
            ...initialState,

            startGeneration: (storybookId: string) =>
                set({
                    isGenerating: true,
                    storybookId,
                    storyTitle: null,
                    progress: 0,
                    currentStep: "Starting generation...",
                    error: null,
                    completedStorybookId: null,
                }),

            updateProgress: (progress: number, currentStep: string) =>
                set({ progress, currentStep }),

            setTitle: (storyTitle: string) =>
                set({ storyTitle }),

            completeGeneration: (storybookId: string) =>
                set({
                    isGenerating: false,
                    progress: 100,
                    currentStep: "Complete!",
                    error: null,
                    completedStorybookId: storybookId,
                }),

            failGeneration: (error: string) =>
                set({
                    isGenerating: false,
                    progress: 0,
                    currentStep: "",
                    error,
                }),

            reset: () => set(initialState),

            clearCompleted: () =>
                set({ completedStorybookId: null }),
        }),
        {
            name: "story-generation",
            storage: createJSONStorage(() => {
                // Use sessionStorage so state clears on tab close
                // but survives soft navigations
                if (typeof window !== "undefined") {
                    return sessionStorage;
                }
                // SSR fallback — no-op storage
                return {
                    getItem: () => null,
                    setItem: () => { },
                    removeItem: () => { },
                };
            }),
        }
    )
);
