import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StorySetting, ArtStyle, Character } from "@/types/storybook";

interface StoryWizardState {
    // Step tracking
    currentStep: number;
    totalSteps: number;

    // Selected characters
    selectedCharacterIds: string[];
    characters: Character[];

    // Story settings
    setting: StorySetting | null;
    theme: string;
    targetChapters: number;
    additionalDetails: string;
    artStyle: ArtStyle | null;

    // Generated data
    generatedTitle: string | null;
    outline: {
        number: number;
        title: string;
        summary: string;
        sceneDescription: string;
    }[] | null;

    // Generation status
    isGenerating: boolean;
    generationProgress: number;

    // Actions
    setStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    setCharacters: (characters: Character[]) => void;
    toggleCharacter: (characterId: string) => void;
    setSetting: (setting: StorySetting) => void;
    setTheme: (theme: string) => void;
    setTargetChapters: (chapters: number) => void;
    setAdditionalDetails: (details: string) => void;
    setArtStyle: (style: ArtStyle) => void;
    setOutline: (title: string, chapters: StoryWizardState["outline"]) => void;
    setGenerating: (generating: boolean, progress?: number) => void;
    reset: () => void;
}

const initialState = {
    currentStep: 1,
    totalSteps: 4,
    selectedCharacterIds: [] as string[],
    characters: [] as Character[],
    setting: null as StorySetting | null,
    theme: "",
    targetChapters: 7,
    additionalDetails: "",
    artStyle: null as ArtStyle | null,
    generatedTitle: null,
    outline: null,
    isGenerating: false,
    generationProgress: 0,
};

export const useStoryStore = create<StoryWizardState>()(
    persist(
        (set, get) => ({
            ...initialState,

            setStep: (step) => set({ currentStep: step }),
            nextStep: () => {
                const { currentStep, totalSteps } = get();
                if (currentStep < totalSteps) {
                    set({ currentStep: currentStep + 1 });
                }
            },
            prevStep: () => {
                const { currentStep } = get();
                if (currentStep > 1) {
                    set({ currentStep: currentStep - 1 });
                }
            },
            setCharacters: (characters) => set({ characters }),
            toggleCharacter: (characterId) =>
                set((state) => {
                    const ids = state.selectedCharacterIds;
                    if (ids.includes(characterId)) {
                        return {
                            selectedCharacterIds: ids.filter((id) => id !== characterId),
                        };
                    }
                    if (ids.length < 4) {
                        return {
                            selectedCharacterIds: [...ids, characterId],
                        };
                    }
                    return state;
                }),
            setSetting: (setting) => set({ setting }),
            setTheme: (theme) => set({ theme }),
            setTargetChapters: (targetChapters) => set({ targetChapters }),
            setAdditionalDetails: (additionalDetails) => set({ additionalDetails }),
            setArtStyle: (artStyle) => set({ artStyle }),
            setOutline: (generatedTitle, outline) => set({ generatedTitle, outline }),
            setGenerating: (isGenerating, progress = 0) =>
                set({ isGenerating, generationProgress: progress }),
            reset: () => set(initialState),
        }),
        {
            name: "story-wizard",
        }
    )
);
