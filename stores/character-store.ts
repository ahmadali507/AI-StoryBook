import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CharacterAppearance, ArtStyle } from "@/types/storybook";

interface CharacterWizardState {
    // Step tracking
    currentStep: number;
    totalSteps: number;

    // Character data
    name: string;
    appearance: Partial<CharacterAppearance>;
    personality: string[];
    artStyle: ArtStyle | null;

    // Generated data
    referenceImageUrl: string | null;
    visualPrompt: string | null;
    seedNumber: number | null;

    // Actions
    setStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    setName: (name: string) => void;
    setAppearance: (appearance: Partial<CharacterAppearance>) => void;
    updateAppearance: (key: keyof CharacterAppearance, value: string | string[]) => void;
    setPersonality: (traits: string[]) => void;
    togglePersonalityTrait: (trait: string) => void;
    setArtStyle: (style: ArtStyle) => void;
    setGeneratedData: (data: {
        referenceImageUrl: string;
        visualPrompt: string;
        seedNumber: number;
    }) => void;
    reset: () => void;
}

const initialState = {
    currentStep: 1,
    totalSteps: 3,
    name: "",
    appearance: {},
    personality: [],
    artStyle: null as ArtStyle | null,
    referenceImageUrl: null,
    visualPrompt: null,
    seedNumber: null,
};

export const useCharacterStore = create<CharacterWizardState>()(
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
            setName: (name) => set({ name }),
            setAppearance: (appearance) => set({ appearance }),
            updateAppearance: (key, value) =>
                set((state) => ({
                    appearance: { ...state.appearance, [key]: value },
                })),
            setPersonality: (traits) => set({ personality: traits }),
            togglePersonalityTrait: (trait) =>
                set((state) => {
                    const traits = state.personality;
                    if (traits.includes(trait)) {
                        return { personality: traits.filter((t) => t !== trait) };
                    }
                    if (traits.length < 5) {
                        return { personality: [...traits, trait] };
                    }
                    return state;
                }),
            setArtStyle: (artStyle) => set({ artStyle }),
            setGeneratedData: (data) =>
                set({
                    referenceImageUrl: data.referenceImageUrl,
                    visualPrompt: data.visualPrompt,
                    seedNumber: data.seedNumber,
                }),
            reset: () => set(initialState),
        }),
        {
            name: "character-wizard",
        }
    )
);
