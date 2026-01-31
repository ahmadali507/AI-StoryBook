"use client";

import { useState } from "react";
import Link from "next/link";
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
    BookOpen
} from "lucide-react";

const settings = [
    { id: "forest", name: "Enchanted Forest", icon: Trees, color: "text-green-600" },
    { id: "castle", name: "Castle Kingdom", icon: Castle, color: "text-purple-600" },
    { id: "ocean", name: "Under the Sea", icon: Waves, color: "text-blue-600" },
    { id: "space", name: "Outer Space", icon: Rocket, color: "text-indigo-600" },
    { id: "home", name: "Cozy Home", icon: Home, color: "text-orange-600" },
    { id: "mountain", name: "Mountain Adventure", icon: Mountain, color: "text-slate-600" },
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
    { id: 1, label: "Setting", key: "setting" },
    { id: 2, label: "Theme", key: "theme" },
    { id: 3, label: "Generate", key: "generate" },
];

export default function StoryGeneratorContent() {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedSetting, setSelectedSetting] = useState("");
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
    const [storyLength, setStoryLength] = useState("medium");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);

    const toggleTheme = (theme: string) => {
        setSelectedThemes((prev) =>
            prev.includes(theme)
                ? prev.filter((t) => t !== theme)
                : prev.length < 2
                    ? [...prev, theme]
                    : prev
        );
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        // Simulate generation delay (will be replaced with real API call later)
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsGenerating(false);
        setIsGenerated(true);
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
                                    Choose Your Setting
                                </h2>
                                <p className="text-text-muted text-center mb-8">
                                    Where will your adventure take place?
                                </p>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {settings.map((setting) => {
                                        const Icon = setting.icon;
                                        return (
                                            <button
                                                key={setting.id}
                                                onClick={() => setSelectedSetting(setting.id)}
                                                className={`p-6 rounded-2xl border-2 transition-all text-center cursor-pointer ${selectedSetting === setting.id
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-primary/50"
                                                    }`}
                                            >
                                                <div className={`w-14 h-14 mx-auto rounded-2xl bg-background flex items-center justify-center mb-3 ${setting.color}`}>
                                                    <Icon className="w-7 h-7" />
                                                </div>
                                                <p className="font-medium text-foreground">{setting.name}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {currentStep === 2 && (
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

                                <h3 className="font-heading font-semibold text-foreground mb-4 text-center">
                                    Story Length
                                </h3>
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
                                            <p className="font-semibold text-foreground">{length.name}</p>
                                            <p className="text-sm text-text-muted">{length.pages}</p>
                                            <p className="text-xs text-text-muted">{length.duration}</p>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {currentStep === 3 && !isGenerated && (
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
                                            ? "Our AI is crafting your personalized story"
                                            : "Your story will be created with these settings"}
                                    </p>

                                    <div className="bg-background rounded-xl p-6 text-left mb-8">
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-text-muted">Setting</span>
                                                <span className="text-foreground font-medium">
                                                    {settings.find((s) => s.id === selectedSetting)?.name}
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
                                                The {settings.find((s) => s.id === selectedSetting)?.name} Adventure
                                            </p>
                                            <p className="text-sm text-text-muted">
                                                {storyLengths.find((l) => l.id === storyLength)?.pages} • {selectedThemes.join(" & ") || "Adventure"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link
                                        href="/library"
                                        className="inline-flex items-center justify-center gap-2 bg-secondary text-white px-8 py-4 rounded-full font-semibold hover:opacity-90 transition-all cursor-pointer"
                                    >
                                        <BookOpen className="w-5 h-5" />
                                        View in Library
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
                            disabled={currentStep === 1}
                            className="flex items-center gap-2 text-text-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Back
                        </button>

                        {currentStep < 3 && (
                            <button
                                onClick={() => setCurrentStep((s) => Math.min(3, s + 1))}
                                disabled={currentStep === 1 && !selectedSetting}
                                className="flex items-center gap-2 bg-secondary text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
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
