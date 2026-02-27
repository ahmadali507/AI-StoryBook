"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useStoryGeneration } from "@/providers/StoryGenerationProvider";
import { useStoryGenerationStore } from "@/stores/story-generation-store";
import { ProgressSteps } from "@/app/components/shared";
import {
    ChevronLeft,
    ChevronRight,
    Check,
    Sparkles,
    Trees,
    Castle,
    Waves,
    Rocket,
    Home,
    Mountain,
    Loader2,
    BookOpen,
    PenTool,
    Plus,
    Palette,
    CreditCard,
    Image as ImageIcon,
    CheckCircle2
} from "lucide-react";

const settings = [
    { id: "forest", name: "Enchanted Forest", icon: Trees, color: "text-green-600" },
    { id: "castle", name: "Castle Kingdom", icon: Castle, color: "text-indigo-600" },
    { id: "ocean", name: "Under the Sea", icon: Waves, color: "text-blue-600" },
    { id: "space", name: "Outer Space", icon: Rocket, color: "text-indigo-600" },
    { id: "home", name: "Cozy Home", icon: Home, color: "text-orange-600" },
    { id: "mountain", name: "Mountain Adventure", icon: Mountain, color: "text-slate-600" },
    { id: "custom", name: "Create Your Own", icon: PenTool, color: "text-pink-600" },
];

const themes = [
    "Friendship", "Courage", "Kindness", "Discovery",
    "Family", "Magic", "Adventure", "Learning"
];

const storyLengths = [
    { id: "short", name: "Short", pages: "8-10 pages", duration: "5 min read" },
    { id: "medium", name: "Medium", pages: "12-15 pages", duration: "10 min read" },
    { id: "long", name: "Long", pages: "18-20 pages", duration: "15 min read" },
];

const steps = [
    { id: 1, label: "Basics", key: "basics" },
    { id: 2, label: "Characters", key: "characters" },
    { id: 3, label: "Themes", key: "themes" },
    { id: 4, label: "Generate", key: "generate" },
];

// Generation progress messages
const GENERATION_MESSAGES = [
    "Planning your adventure...",
    "Crafting the story outline...",
    "Writing chapter content...",
    "Creating magical illustrations...",
    "Adding finishing touches...",
    "Assembling your storybook...",
];

import {
    generateStoryOutline,
    createStorybook,
    updateStorybook,
    generateAndSaveCover,
    getStorybookWithChapters
} from "@/actions/story";
import { createCheckoutSession } from "@/actions/stripe";
import { Character, StorySetting, ArtStyle } from "@/types/storybook";

interface StoryGeneratorContentProps {
    characters: Character[];
}

// Step 4 phases
type Step4Phase = "preview" | "cover_generating" | "cover_ready" | "paying" | "generating" | "complete";

export default function StoryGeneratorContent({ characters: userCharacters }: StoryGeneratorContentProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { startStoryGeneration } = useStoryGeneration();
    const bgGeneration = useStoryGenerationStore();

    const [currentStep, setCurrentStep] = useState(1);
    const [selectedSetting, setSelectedSetting] = useState("");
    const [customSetting, setCustomSetting] = useState("");
    const [storyDescription, setStoryDescription] = useState("");
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
    const [customTheme, setCustomTheme] = useState("");
    const [storyLength, setStoryLength] = useState("medium");

    // Character selection state
    const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);

    // Step 4 states
    const [step4Phase, setStep4Phase] = useState<Step4Phase>("preview");
    const [generatedStoryId, setGeneratedStoryId] = useState<string | null>(null);
    const [coverUrl, setCoverUrl] = useState<string | null>(null);
    const [storyTitle, setStoryTitle] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [coverGenerationStep, setCoverGenerationStep] = useState("");

    // Handle URL params for returning from Stripe
    useEffect(() => {
        const sessionId = searchParams.get("session_id");
        const storybookId = searchParams.get("storybookId");
        const paid = searchParams.get("paid");
        const cancelled = searchParams.get("cancelled");

        if (storybookId && sessionId && paid === "true") {
            // Returning from successful Stripe payment
            // Delegate generation to the background provider
            startStoryGeneration({
                storybookId,
                sessionId,
                characters: userCharacters,
            });

            // Redirect user to orders page so they can browse freely
            router.replace("/orders");
        } else if (storybookId && cancelled === "true") {
            // User cancelled payment
            setGeneratedStoryId(storybookId);
            setCurrentStep(4);
            setStep4Phase("cover_ready");
            loadExistingCover(storybookId);
        }
    }, [searchParams]);

    // Load existing cover if returning to page
    const loadExistingCover = async (storybookId: string) => {
        try {
            const storybook = await getStorybookWithChapters(storybookId);
            if (storybook?.coverUrl) {
                setCoverUrl(storybook.coverUrl);
                setStoryTitle(storybook.title);
            }
        } catch (err) {
            console.error("Failed to load existing cover:", err);
        }
    };

    // Mutations
    const createStorybookMutation = useMutation({
        mutationFn: async (data: {
            title: string;
            characterIds: string[];
            setting: StorySetting;
            artStyle: ArtStyle;
            targetChapters: number;
            theme: string;
            description: string;
        }) => {
            return await createStorybook(
                data.title,
                data.characterIds,
                data.setting,
                data.artStyle,
                data.targetChapters,
                data.theme,
                data.description
            );
        }
    });

    const generateOutlineMutation = useMutation({
        mutationFn: async (data: {
            characterIds: string[];
            setting: StorySetting;
            targetChapters: number;
            theme: string;
            additionalDetails: string;
        }) => {
            return await generateStoryOutline({
                characterIds: data.characterIds,
                setting: data.setting,
                targetChapters: data.targetChapters,
                theme: data.theme,
                additionalDetails: data.additionalDetails
            });
        }
    });

    // NOTE: generateChapterMutation, generateIllustrationMutation, and
    // saveIllustrationMutation have been moved to StoryGenerationProvider
    // so they can run in the background across route changes.

    const toggleCharacter = (charId: string) => {
        setSelectedCharacterIds(prev =>
            prev.includes(charId)
                ? prev.filter(id => id !== charId)
                : [...prev, charId]
        );
    };

    const toggleTheme = (theme: string) => {
        setSelectedThemes((prev) =>
            prev.includes(theme)
                ? prev.filter((t) => t !== theme)
                : prev.length < 2
                    ? [...prev, theme]
                    : prev
        );
    };

    const addCustomTheme = () => {
        if (customTheme.trim() && !selectedThemes.includes(customTheme.trim())) {
            if (selectedThemes.length < 2) {
                setSelectedThemes([...selectedThemes, customTheme.trim()]);
                setCustomTheme("");
            }
        }
    };

    // Phase 1: Generate cover preview
    const handleGenerateCover = async () => {
        setStep4Phase("cover_generating");
        setError(null);

        try {
            const effectiveSetting = selectedSetting === "custom" ? "fantasy" : selectedSetting as StorySetting;
            const customDetails = selectedSetting === "custom"
                ? `Custom Setting: ${customSetting}. ${storyDescription}`
                : storyDescription;
            const themeString = selectedThemes.join(", ");
            const targetChapters = storyLength === "short" ? 3 : storyLength === "medium" ? 5 : 7;

            // 1. Create Storybook Record
            setCoverGenerationStep("Creating storybook...");
            const sbResult = await createStorybookMutation.mutateAsync({
                title: "New Adventure",
                characterIds: selectedCharacterIds,
                setting: effectiveSetting,
                artStyle: "storybook",
                targetChapters,
                theme: themeString,
                description: customDetails
            });

            if (!sbResult.success || !sbResult.storybookId) {
                throw new Error(sbResult.error || "Failed to create storybook");
            }
            const storybookId = sbResult.storybookId;
            setGeneratedStoryId(storybookId);

            // 2. Generate Outline to get title
            setCoverGenerationStep("Planning story structure...");
            const outlineResult = await generateOutlineMutation.mutateAsync({
                characterIds: selectedCharacterIds,
                setting: effectiveSetting,
                targetChapters,
                theme: themeString,
                additionalDetails: customDetails
            });

            if (!outlineResult.success || !outlineResult.outline) {
                throw new Error(outlineResult.error || "Failed to generate outline");
            }
            const outline = outlineResult.outline;

            // Update title
            await updateStorybook(storybookId, { title: outline.title });
            setStoryTitle(outline.title);

            // 3. Generate cover
            setCoverGenerationStep("Generating cover artwork...");
            await generateAndSaveCover(storybookId);

            // Fetch the cover URL
            const storybook = await getStorybookWithChapters(storybookId);
            if (storybook?.coverUrl) {
                setCoverUrl(storybook.coverUrl);
            }

            setStep4Phase("cover_ready");
        } catch (err) {
            console.error("Cover generation error:", err);
            setError(err instanceof Error ? err.message : "Failed to generate cover");
            setStep4Phase("preview");
        }
    };

    // Phase 2: Redirect to Stripe checkout
    const handlePayment = async () => {
        if (!generatedStoryId) return;

        setStep4Phase("paying");
        setError(null);

        try {
            const result = await createCheckoutSession(generatedStoryId);

            if (!result.success || !result.checkoutUrl) {
                throw new Error(result.error || "Failed to create checkout session");
            }

            // Redirect to Stripe
            window.location.href = result.checkoutUrl;
        } catch (err) {
            console.error("Payment error:", err);
            setError(err instanceof Error ? err.message : "Failed to start payment");
            setStep4Phase("cover_ready");
        }
    };

    // NOTE: handlePostPaymentGeneration has been moved to StoryGenerationProvider
    // so generation runs in the background and survives route changes.

    // Render Step 4 content based on phase
    const renderStep4Content = () => {
        // Preview phase - show settings summary and generate cover button
        if (step4Phase === "preview") {
            return (
                <div className="text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ImageIcon className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
                        Generate Cover Preview
                    </h2>
                    <p className="text-text-muted mb-8">
                        First, let's create a beautiful cover for your story
                    </p>

                    <div className="bg-background rounded-xl p-6 text-left mb-8">
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-text-muted">Setting</span>
                                <span className="text-foreground font-medium">
                                    {selectedSetting === "custom"
                                        ? "Custom Setting"
                                        : settings.find((s) => s.id === selectedSetting)?.name}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-muted">Themes</span>
                                <span className="text-foreground font-medium">
                                    {selectedThemes.join(", ") || "None selected"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-muted">Length</span>
                                <span className="text-foreground font-medium">
                                    {storyLengths.find((l) => l.id === storyLength)?.name}
                                </span>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleGenerateCover}
                        className="inline-flex items-center gap-2 bg-secondary text-white px-8 py-4 rounded-full font-semibold hover:opacity-90 transition-all cursor-pointer"
                    >
                        <Palette className="w-5 h-5" />
                        Generate Cover Preview
                    </button>
                </div>
            );
        }

        // Cover generating phase
        if (step4Phase === "cover_generating") {
            return (
                <div className="text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                    <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
                        Creating Your Cover...
                    </h2>
                    <p className="text-text-muted mb-4">
                        {coverGenerationStep}
                    </p>
                    <p className="text-xs text-text-muted">
                        This usually takes about 30 seconds
                    </p>
                </div>
            );
        }

        // Cover ready - show cover and payment button
        if (step4Phase === "cover_ready" || step4Phase === "paying") {
            return (
                <div className="text-center">
                    <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
                        Your Cover is Ready!
                    </h2>
                    <p className="text-lg text-primary font-medium mb-6">
                        "{storyTitle}"
                    </p>

                    {/* Cover preview */}
                    <div className="mb-8">
                        {coverUrl ? (
                            <div className="relative inline-block">
                                <img
                                    src={coverUrl}
                                    alt="Book Cover Preview"
                                    className="w-48 h-64 object-cover rounded-lg shadow-2xl mx-auto"
                                />
                                <div className="absolute inset-0 rounded-lg ring-2 ring-primary/20" />
                            </div>
                        ) : (
                            <div className="w-48 h-64 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mx-auto flex items-center justify-center">
                                <BookOpen className="w-12 h-12 text-primary/50" />
                            </div>
                        )}
                    </div>

                    {/* What's included */}
                    <div className="bg-background rounded-xl p-6 text-left mb-6 max-w-md mx-auto">
                        <h3 className="font-semibold text-foreground mb-3">What's included:</h3>
                        <ul className="space-y-2 text-sm text-text-muted">
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                Full illustrated storybook ({storyLengths.find(l => l.id === storyLength)?.pages})
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                Custom AI-generated illustrations
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                Personalized story with your characters
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-500" />
                                Instant digital access
                            </li>
                        </ul>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm max-w-md mx-auto">
                            {error}
                        </div>
                    )}

                    {/* Payment button */}
                    <button
                        onClick={handlePayment}
                        disabled={step4Phase === "paying"}
                        className="inline-flex items-center gap-3 bg-gradient-to-r from-primary to-secondary text-white px-10 py-5 rounded-full font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {step4Phase === "paying" ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                Redirecting to checkout...
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-6 h-6" />
                                $7.99 - Generate My Book
                            </>
                        )}
                    </button>

                    <p className="text-xs text-text-muted mt-4">
                        Secure checkout powered by Stripe
                    </p>
                </div>
            );
        }

        // Generating phase — should not appear anymore since we redirect,
        // but kept as a fallback showing the background status
        if (step4Phase === "generating") {
            return (
                <div className="text-center">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto">
                            <Sparkles className="w-10 h-10 text-primary" />
                            <Loader2 className="absolute w-24 h-24 text-primary/30 animate-spin" />
                        </div>
                    </div>

                    <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
                        Creating Your Storybook
                    </h2>
                    <p className="text-lg text-primary font-medium mb-6">
                        "{bgGeneration.storyTitle || storyTitle}"
                    </p>

                    {/* Progress bar */}
                    <div className="w-full max-w-md mx-auto mb-4">
                        <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
                                style={{ width: `${bgGeneration.progress}%` }}
                            />
                        </div>
                        <p className="text-sm text-text-muted text-center mt-2">
                            {bgGeneration.progress}% complete
                        </p>
                    </div>

                    <p className="text-text-muted animate-pulse mb-8">
                        {bgGeneration.currentStep}
                    </p>

                    {bgGeneration.error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm max-w-md mx-auto">
                            {bgGeneration.error}
                        </div>
                    )}

                    <p className="text-xs text-text-muted max-w-sm mx-auto">
                        This usually takes 2-5 minutes. You can navigate away — we'll notify you when it's done!
                    </p>
                </div>
            );
        }

        // Complete phase
        if (step4Phase === "complete") {
            return (
                <div className="text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
                        Your Book is Ready!
                    </h2>
                    <p className="text-lg text-primary font-medium mb-6">
                        "{storyTitle}"
                    </p>

                    {coverUrl && (
                        <div className="mb-8">
                            <img
                                src={coverUrl}
                                alt="Book Cover"
                                className="w-40 h-56 object-cover rounded-lg shadow-xl mx-auto"
                            />
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href={generatedStoryId ? `/story/${generatedStoryId}` : "/library"}
                            className="inline-flex items-center justify-center gap-2 bg-secondary text-white px-8 py-4 rounded-full font-semibold hover:opacity-90 transition-all cursor-pointer"
                        >
                            <BookOpen className="w-5 h-5" />
                            Read Your Story
                        </Link>
                        <button
                            onClick={() => {
                                setStep4Phase("preview");
                                setCurrentStep(1);
                                setSelectedSetting("");
                                setSelectedThemes([]);
                                setGeneratedStoryId(null);
                                setCoverUrl(null);
                                setStoryTitle("");
                                router.replace("/generate");
                            }}
                            className="inline-flex items-center justify-center gap-2 border border-border text-foreground px-8 py-4 rounded-full font-semibold hover:bg-background transition-all cursor-pointer"
                        >
                            Create Another
                        </button>
                    </div>
                </div>
            );
        }

        return null;
    };

    const isStep4InProgress = step4Phase !== "preview" && step4Phase !== "complete";

    // ── Guard: block new story creation while one is generating ──
    if (bgGeneration.isGenerating) {
        return (
            <main className="pt-24 pb-16">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-surface border border-border rounded-2xl p-8 text-center">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mx-auto">
                                <Sparkles className="w-8 h-8 text-primary" />
                                <Loader2 className="absolute w-20 h-20 text-primary/30 animate-spin" />
                            </div>
                        </div>
                        <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
                            Story Generation in Progress
                        </h2>
                        <p className="text-text-muted mb-4">
                            {bgGeneration.storyTitle
                                ? `"${bgGeneration.storyTitle}" is being created (${bgGeneration.progress}%)`
                                : `A story is being generated (${bgGeneration.progress}%)`}
                        </p>
                        <p className="text-sm text-text-muted mb-6">
                            {bgGeneration.currentStep}
                        </p>
                        <div className="w-full max-w-md mx-auto mb-6">
                            <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
                                    style={{ width: `${bgGeneration.progress}%` }}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-text-muted">
                            You can create a new story once the current one is complete.
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="pt-24 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
                    <Link href="/" className="hover:text-foreground cursor-pointer">
                        Home
                    </Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-foreground">Story Generator</span>
                </div>

                {/* Progress Steps */}
                <ProgressSteps steps={steps} currentStep={currentStep} />

                {/* Main Content */}
                <div className="max-w-3xl mx-auto">
                    <div className="bg-surface border border-border rounded-2xl p-8">
                        {currentStep === 1 && (
                            <>
                                <h2 className="font-heading text-2xl font-bold text-foreground mb-2 text-center">
                                    Story Basics
                                </h2>
                                <p className="text-text-muted text-center mb-8">
                                    Set the stage for your adventure
                                </p>

                                <div className="space-y-8">
                                    {/* Setting Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-4">
                                            Choose a Setting
                                        </label>
                                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {settings.map((setting) => {
                                                const Icon = setting.icon;
                                                return (
                                                    <button
                                                        key={setting.id}
                                                        onClick={() => setSelectedSetting(setting.id)}
                                                        className={`p-4 rounded-2xl border-2 transition-all text-center cursor-pointer ${selectedSetting === setting.id
                                                            ? "border-primary bg-primary/5"
                                                            : "border-border hover:border-primary/50"
                                                            }`}
                                                    >
                                                        <div className={`w-10 h-10 mx-auto rounded-xl bg-background flex items-center justify-center mb-2 ${setting.color}`}>
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <p className="font-medium text-sm text-foreground">{setting.name}</p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Custom Setting Input */}
                                    {selectedSetting === "custom" && (
                                        <div className="animate-in fade-in slide-in-from-bottom-4">
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                Describe your setting
                                            </label>
                                            <textarea
                                                value={customSetting}
                                                onChange={(e) => setCustomSetting(e.target.value)}
                                                placeholder="e.g., A floating city in the clouds made of candy..."
                                                className="w-full h-24 px-4 py-3 rounded-xl border border-border bg-background focus:border-primary outline-none transition-all resize-none"
                                            />
                                        </div>
                                    )}

                                    {/* Story Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            What happens in the story? (Optional)
                                        </label>
                                        <textarea
                                            value={storyDescription}
                                            onChange={(e) => setStoryDescription(e.target.value)}
                                            placeholder="e.g., The hero finds a lost puppy and tries to find its home..."
                                            className="w-full h-24 px-4 py-3 rounded-xl border border-border bg-background focus:border-primary outline-none transition-all resize-none"
                                        />
                                    </div>

                                    {/* Story Length */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-4">
                                            Story Length
                                        </label>
                                        <div className="grid sm:grid-cols-3 gap-4">
                                            {storyLengths.map((length) => (
                                                <button
                                                    key={length.id}
                                                    onClick={() => setStoryLength(length.id)}
                                                    className={`p-4 rounded-xl border-2 transition-all text-center cursor-pointer ${storyLength === length.id
                                                        ? "border-primary bg-primary/5"
                                                        : "border-border hover:border-primary/50"
                                                        }`}
                                                >
                                                    <p className="font-semibold text-foreground text-sm">{length.name}</p>
                                                    <p className="text-xs text-text-muted">{length.pages}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}


                        {currentStep === 2 && (
                            <>
                                <h2 className="font-heading text-2xl font-bold text-foreground mb-2 text-center">
                                    Choose Characters
                                </h2>
                                <p className="text-text-muted text-center mb-8">
                                    Select who will be in this story
                                </p>

                                {userCharacters.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="text-3xl">👤</span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-foreground mb-2">No characters yet</h3>
                                        <p className="text-text-muted mb-6">Create characters to add them to your stories.</p>
                                        <Link
                                            href="/create"
                                            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-all"
                                        >
                                            <Plus className="w-5 h-5" />
                                            Create Book
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {userCharacters.map((char) => (
                                                <button
                                                    key={char.id}
                                                    onClick={() => toggleCharacter(char.id)}
                                                    className={`relative p-4 rounded-2xl border-2 transition-all text-left cursor-pointer group ${selectedCharacterIds.includes(char.id)
                                                        ? "border-primary bg-primary/5"
                                                        : "border-border hover:border-primary/30"
                                                        }`}
                                                >
                                                    {selectedCharacterIds.includes(char.id) && (
                                                        <div className="absolute top-2 right-2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center">
                                                            <Check className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                    <div className="aspect-square bg-surface-hover rounded-xl mb-3 overflow-hidden">
                                                        {char.referenceImageUrl ? (
                                                            <img src={char.referenceImageUrl} alt={char.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                                                        )}
                                                    </div>
                                                    <p className="font-semibold text-foreground truncate">{char.name}</p>
                                                    <p className="text-xs text-text-muted truncate">{char.appearance.age || "Unknown"} years old</p>
                                                </button>
                                            ))}

                                            <Link
                                                href="/create"
                                                className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-surface-hover transition-all cursor-pointer min-h-[180px]"
                                            >
                                                <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mb-3">
                                                    <Plus className="w-6 h-6" />
                                                </div>
                                                <p className="font-medium text-foreground">Create New</p>
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {currentStep === 3 && (
                            <>
                                <h2 className="font-heading text-2xl font-bold text-foreground mb-2 text-center">
                                    Select Story Themes
                                </h2>
                                <p className="text-text-muted text-center mb-8">
                                    Choose up to 2 themes for your story
                                </p>
                                <div className="flex flex-wrap gap-3 justify-center mb-8">
                                    {themes.map((theme) => (
                                        <button
                                            key={theme}
                                            onClick={() => toggleTheme(theme)}
                                            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all cursor-pointer ${selectedThemes.includes(theme)
                                                ? "bg-primary text-white"
                                                : "bg-background border border-border text-foreground hover:border-primary"
                                                }`}
                                        >
                                            {selectedThemes.includes(theme) && <Check className="w-4 h-4 inline mr-1" />}
                                            {theme}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-2 max-w-md mx-auto mb-8">
                                    <input
                                        type="text"
                                        value={customTheme}
                                        onChange={(e) => setCustomTheme(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && addCustomTheme()}
                                        placeholder="Add a custom theme..."
                                        className="flex-1 px-4 py-2 rounded-xl border border-border bg-background focus:border-primary outline-none transition-all"
                                        disabled={selectedThemes.length >= 2}
                                    />
                                    <button
                                        onClick={addCustomTheme}
                                        disabled={!customTheme.trim() || selectedThemes.length >= 2}
                                        className="p-2 rounded-xl bg-secondary text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>

                                <h3 className="font-heading font-semibold text-foreground mb-4 text-center">
                                    Selected Characters: {userCharacters.filter(c => selectedCharacterIds.includes(c.id)).map(c => c.name).join(", ") || "None"}
                                </h3>
                            </>
                        )}

                        {currentStep === 4 && renderStep4Content()}
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between items-center mt-6">
                        <button
                            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                            disabled={currentStep === 1 || isStep4InProgress}
                            className="flex items-center gap-2 text-text-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Back
                        </button>

                        {currentStep < 4 && (
                            <button
                                onClick={() => setCurrentStep((s) => Math.min(4, s + 1))}
                                disabled={
                                    (currentStep === 1 && (!selectedSetting || (selectedSetting === "custom" && !customSetting.trim()))) ||
                                    (currentStep === 2 && selectedCharacterIds.length === 0) ||
                                    (currentStep === 3 && selectedThemes.length === 0)
                                }
                                className="flex items-center gap-2 bg-secondary text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                Continue
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
