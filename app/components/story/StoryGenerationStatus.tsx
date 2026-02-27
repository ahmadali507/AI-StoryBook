"use client";

import { useState } from "react";
import { useStoryGenerationStore } from "@/stores/story-generation-store";
import { Loader2, BookOpen, ChevronUp, ChevronDown, X } from "lucide-react";
import Link from "next/link";

export default function StoryGenerationStatus() {
    const {
        isGenerating,
        storyTitle,
        progress,
        currentStep,
        error,
        completedStorybookId,
        clearCompleted,
        reset,
    } = useStoryGenerationStore();

    const [expanded, setExpanded] = useState(false);

    // Show nothing when idle
    if (!isGenerating && !error && !completedStorybookId) {
        return null;
    }

    // Error state — dismissible
    if (error && !isGenerating) {
        return (
            <div className="fixed bottom-20 left-4 z-[60] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
                <div className="bg-red-50 border border-red-200 rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-red-500 text-sm">✕</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-700 truncate">
                            Generation failed
                        </p>
                        <p className="text-xs text-red-500 truncate">{error}</p>
                    </div>
                    <button
                        onClick={reset}
                        className="text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                        aria-label="Dismiss"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    // Completed state — dismissible link to read
    if (completedStorybookId && !isGenerating) {
        return (
            <div className="fixed bottom-20 left-4 z-[60] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
                <div className="bg-green-50 border border-green-200 rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-700">
                            Book ready!
                        </p>
                        <Link
                            href={`/story/${completedStorybookId}`}
                            className="text-xs text-green-600 hover:underline"
                        >
                            Read now →
                        </Link>
                    </div>
                    <button
                        onClick={clearCompleted}
                        className="text-green-400 hover:text-green-600 transition-colors cursor-pointer"
                        aria-label="Dismiss"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    // Generating state — expandable pill
    return (
        <div className="fixed bottom-20 left-4 z-[60] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-surface border border-border rounded-2xl shadow-lg overflow-hidden">
                {/* Collapsed pill */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-surface-hover transition-colors"
                >
                    <div className="relative flex-shrink-0">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-foreground truncate">
                            {storyTitle
                                ? `Creating "${storyTitle}"`
                                : "Generating story..."}
                        </p>
                        <p className="text-xs text-text-muted">{progress}% complete</p>
                    </div>
                    {expanded ? (
                        <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
                    ) : (
                        <ChevronUp className="w-4 h-4 text-text-muted flex-shrink-0" />
                    )}
                </button>

                {/* Expanded details */}
                {expanded && (
                    <div className="px-4 pb-3 space-y-2 border-t border-border pt-2">
                        {/* Progress bar */}
                        <div className="w-full h-1.5 bg-surface-hover rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-text-muted animate-pulse">
                            {currentStep}
                        </p>
                        <p className="text-[10px] text-text-muted/60">
                            You can continue browsing — we'll notify you when it's done.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
