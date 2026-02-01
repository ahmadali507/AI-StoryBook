"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
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
    Palette
} from "lucide-react";

const settings = [
    { id: "forest", name: "Enchanted Forest", icon: Trees, color: "text-green-600" },
    { id: "castle", name: "Castle Kingdom", icon: Castle, color: "text-purple-600" },
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

import { generateStoryOutline, createStorybook, generateChapter } from "@/actions/story";
import { generateIllustration, saveIllustration } from "@/actions/illustration";
import { Character, StorySetting, ArtStyle } from "@/types/storybook";

interface StoryGeneratorContentProps {
    characters: Character[];
}

export default function StoryGeneratorContent({ characters: userCharacters }: StoryGeneratorContentProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedSetting, setSelectedSetting] = useState("");
    const [customSetting, setCustomSetting] = useState("");
    const [storyDescription, setStoryDescription] = useState("");
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
    const [customTheme, setCustomTheme] = useState("");
    const [storyLength, setStoryLength] = useState("medium");

    // Character selection state
    const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([]);

    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);
    const [generationStep, setGenerationStep] = useState("");
    const [generatedStoryId, setGeneratedStoryId] = useState<string | null>(null);

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

    const generateChapterMutation = useMutation({
        mutationFn: async (data: {
            storybookId: string;
            chapterNumber: number;
            title: string;
            summary: string;
            sceneDescription: string;
        }) => {
            return await generateChapter(
                data.storybookId,
                data.chapterNumber,
                data.title,
                data.summary,
                data.sceneDescription
            );
        }
    });

    const generateIllustrationMutation = useMutation({
        mutationFn: async (data: {
            characters: Character[];
            sceneDescription: string;
            artStyle: ArtStyle;
            seedNumber: number;
        }) => {
            return await generateIllustration({
                characters: data.characters,
                sceneDescription: data.sceneDescription,
                artStyle: data.artStyle,
                seedNumber: data.seedNumber
            });
        }
    });

    const saveIllustrationMutation = useMutation({
        mutationFn: async (data: {
            chapterId: string;
            imageUrl: string;
            promptUsed: string;
            seedUsed: number;
        }) => {
            return await saveIllustration(
                data.chapterId,
                data.imageUrl,
                data.promptUsed,
                data.seedUsed
            );
        }
    });

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

    const handleGenerate = async () => {
        setIsGenerating(true);
        setGenerationStep("Initializing storybook...");

        try {
            const effectiveSetting = selectedSetting === "custom" ? "fantasy" : selectedSetting as StorySetting;
            const customDetails = selectedSetting === "custom"
                ? `Custom Setting: ${customSetting}. ${storyDescription}`
                : storyDescription;
            const themeString = selectedThemes.join(", ");
            const targetChapters = storyLength === "short" ? 3 : storyLength === "medium" ? 5 : 7; // Reduced for demo/testing, adjustable

            // 1. Create Storybook Record
            const sbResult = await createStorybookMutation.mutateAsync({
                title: "New Adventure", // Temporary title until outline
                characterIds: selectedCharacterIds,
                setting: effectiveSetting,
                artStyle: "storybook", // Default for now
                targetChapters,
                theme: themeString,
                description: customDetails
            });

            if (!sbResult.success || !sbResult.storybookId) {
                throw new Error(sbResult.error || "Failed to create storybook");
            }
            const storybookId = sbResult.storybookId;
            setGeneratedStoryId(storybookId);

            // 2. Generate Outline
            setGenerationStep("Planning structure...");
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

            // 3. Generate Chapters & Illustrations Loop
            // We do this sequentially to maintain context and allow progress updates
            for (const chapterOutline of outline.chapters) {
                setGenerationStep(`Writing Chapter ${chapterOutline.number}: ${chapterOutline.title}...`);

                // Generate Text
                const chapterResult = await generateChapterMutation.mutateAsync({
                    storybookId,
                    chapterNumber: chapterOutline.number,
                    title: chapterOutline.title,
                    summary: chapterOutline.summary,
                    sceneDescription: chapterOutline.sceneDescription
                });

                if (!chapterResult.success || !chapterResult.chapterId) {
                    throw new Error(chapterResult.error || `Failed to generate chapter ${chapterOutline.number}`);
                }
                const chapterId = chapterResult.chapterId;

                // Generate Illustration
                setGenerationStep(`Illustrating Chapter ${chapterOutline.number}...`);

                // Filter characters present in this scene? For now use all selected or main
                const activeCharacters = userCharacters.filter(c => selectedCharacterIds.includes(c.id));
                const seed = Math.floor(Math.random() * 1000000);

                const illustrationResult = await generateIllustrationMutation.mutateAsync({
                    characters: activeCharacters,
                    sceneDescription: chapterResult.content ? chapterOutline.sceneDescription : chapterOutline.sceneDescription, // Use outline description as base
                    artStyle: "storybook",
                    seedNumber: seed
                });

                // Save Illustration
                await saveIllustrationMutation.mutateAsync({
                    chapterId,
                    imageUrl: illustrationResult.imageUrl,
                    promptUsed: illustrationResult.promptUsed,
                    seedUsed: seed
                });
            }

            setGenerationStep("Finalizing...");
            setIsGenerated(true);
        } catch (error) {
            console.error("Generation error:", error);
            setGenerationStep("Error: " + (error instanceof Error ? error.message : "Unknown error"));
            // Keep generating state to show error? or reset?
            // For now let's just alert
            alert("Failed to generate story. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <main className="pt-24 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
                    <Link href="/dashboard" className="hover:text-foreground cursor-pointer">
                        Dashboard
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
                                            href="/character-creator"
                                            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-all"
                                        >
                                            <Plus className="w-5 h-5" />
                                            Create Character
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
                                                href="/character-creator"
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

                        {currentStep === 4 && !isGenerated && (
                            <>
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        {isGenerating ? (
                                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                        ) : (
                                            <Sparkles className="w-10 h-10 text-primary" />
                                        )}
                                    </div>
                                    <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
                                        {isGenerating ? "Creating Your Story..." : "Ready to Generate!"}
                                    </h2>
                                    <p className="text-text-muted mb-8">
                                        {isGenerating
                                            ? generationStep
                                            : "Your story will be created with these settings"}
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

                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                        className="inline-flex items-center gap-2 bg-secondary text-white px-8 py-4 rounded-full font-semibold hover:opacity-90 transition-all cursor-pointer disabled:opacity-70"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                Generate My Story
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Success State */}
                        {isGenerated && (
                            <div className="text-center">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Check className="w-10 h-10 text-green-600" />
                                </div>
                                <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
                                    Story Created!
                                </h2>
                                <p className="text-text-muted mb-8">
                                    Your personalized storybook is ready to view
                                </p>

                                <div className="bg-background rounded-xl p-6 mb-8">
                                    <div className="flex items-center justify-center gap-4">
                                        <div className="w-16 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                                            <BookOpen className="w-8 h-8 text-primary" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold text-foreground">
                                                The {selectedSetting === "custom" ? "Custom" : settings.find((s) => s.id === selectedSetting)?.name} Adventure
                                            </p>
                                            <p className="text-sm text-text-muted">
                                                {storyLengths.find((l) => l.id === storyLength)?.pages} • {selectedThemes.join(" & ") || "Adventure"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link
                                        href={generatedStoryId ? `/library/${generatedStoryId}` : "/library"}
                                        className="inline-flex items-center justify-center gap-2 bg-secondary text-white px-8 py-4 rounded-full font-semibold hover:opacity-90 transition-all cursor-pointer"
                                    >
                                        <BookOpen className="w-5 h-5" />
                                        Read Story
                                    </Link>
                                    <button
                                        onClick={() => {
                                            setIsGenerated(false);
                                            setCurrentStep(1);
                                            setSelectedSetting("");
                                            setSelectedThemes([]);
                                        }}
                                        className="inline-flex items-center justify-center gap-2 border border-border text-foreground px-8 py-4 rounded-full font-semibold hover:bg-background transition-all cursor-pointer"
                                    >
                                        Create Another
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between items-center mt-6">
                        <button
                            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                            disabled={currentStep === 1 || isGenerating || isGenerated}
                            className="flex items-center gap-2 text-text-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Back
                        </button>

                        {currentStep < 4 && !isGenerated && (
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
