"use client";

import React, { useState, useTransition, useCallback } from "react";
import { Loader2, Check, RefreshCw, Sparkles, ArrowLeft, Save } from "lucide-react";
import type { BookPage, PageBasedStory } from "@/actions/library";
import { updateBookPageText, regenerateSceneIllustration } from "@/actions/book-edit";
import Link from "next/link";

interface BookEditorProps {
    story: PageBasedStory;
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene Spread Component (illustration + text side by side)
// ─────────────────────────────────────────────────────────────────────────────

function SceneSpread({
    illustrationPage,
    textPage,
    storybookId,
    credits,
    onTextSaved,
    onImageRegenerated,
}: {
    illustrationPage: BookPage;
    textPage: BookPage;
    storybookId: string;
    credits: number;
    onTextSaved: (pageNumber: number, newText: string) => void;
    onImageRegenerated: (pageNumber: number, newUrl: string, remainingCredits: number) => void;
}) {
    const [editText, setEditText] = useState(textPage.text || "");
    const [isSaving, startSaving] = useTransition();
    const [isRegenerating, startRegenerating] = useTransition();
    const [showRegenConfirm, setShowRegenConfirm] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState(illustrationPage.illustrationUrl);
    const [saved, setSaved] = useState(false);

    const isDirty = editText !== (textPage.text || "");

    const handleSave = () => {
        startSaving(async () => {
            const result = await updateBookPageText(storybookId, textPage.pageNumber, editText);
            if (result.success) {
                onTextSaved(textPage.pageNumber, editText);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            } else {
                alert(result.error || "Failed to save. Please try again.");
            }
        });
    };

    const handleRegenerate = () => {
        setShowRegenConfirm(false);
        startRegenerating(async () => {
            const result = await regenerateSceneIllustration(storybookId, illustrationPage.pageNumber);
            if (result.success && result.newImageUrl) {
                setCurrentImageUrl(result.newImageUrl);
                onImageRegenerated(illustrationPage.pageNumber, result.newImageUrl, result.remainingCredits ?? 0);
            } else {
                alert(result.error || "Image regeneration failed. Please try again.");
            }
        });
    };

    const canRegenerate = credits > 0;

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Scene Header */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                    Scene {illustrationPage.sceneNumber}
                </span>
                <div className="flex items-center gap-2">
                    {saved && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium animate-in fade-in">
                            <Check className="w-3 h-3" /> Saved
                        </span>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={!isDirty || isSaving}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        {isSaving ? "Saving..." : "Save Text"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Left: Illustration */}
                <div className="relative aspect-[3/4] bg-slate-100 border-r border-slate-200">
                    {currentImageUrl ? (
                        <img
                            src={currentImageUrl}
                            alt={`Scene ${illustrationPage.sceneNumber}`}
                            className={`w-full h-full object-cover transition-opacity duration-300 ${isRegenerating ? 'opacity-30' : ''}`}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <span className="text-xs uppercase tracking-widest">No illustration</span>
                        </div>
                    )}

                    {/* Regenerating overlay */}
                    {isRegenerating && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-3 p-6 bg-white/90 rounded-2xl shadow-lg border border-sky-100">
                                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
                                <p className="text-sm font-medium text-slate-700">Regenerating...</p>
                                <p className="text-xs text-slate-400">This may take a minute</p>
                            </div>
                        </div>
                    )}

                    {/* Regenerate button */}
                    {canRegenerate && !isRegenerating && (
                        <div className="absolute bottom-3 right-3">
                            {showRegenConfirm ? (
                                <div className="bg-white rounded-xl shadow-lg p-4 border border-slate-200 max-w-[200px]">
                                    <p className="text-xs text-slate-600 mb-3">
                                        Use <strong>1 credit</strong> to regenerate? ({credits} left)
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowRegenConfirm(false)}
                                            className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleRegenerate}
                                            className="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium text-white bg-sky-600 hover:bg-sky-700"
                                        >
                                            Confirm
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowRegenConfirm(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/90 shadow-md border border-slate-200 text-slate-600 hover:text-sky-600 hover:border-sky-300 hover:shadow-lg transition-all text-xs font-medium"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    Regenerate
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Editable Text */}
                <div className="p-6 flex flex-col min-h-[300px]">
                    <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 w-full resize-none border border-slate-200 rounded-xl p-4 text-sm leading-relaxed text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-300 transition-colors bg-slate-50/50 hover:border-slate-300"
                        style={{ fontFamily: "'Georgia', 'Times New Roman', serif", minHeight: '200px' }}
                        placeholder="Edit your story text..."
                    />
                    {isDirty && (
                        <p className="text-xs text-amber-600 mt-2 font-medium">
                            Unsaved changes
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main BookEditor Component
// ─────────────────────────────────────────────────────────────────────────────

export default function BookEditor({ story }: BookEditorProps) {
    const [livePages, setLivePages] = useState<BookPage[]>(story.pages);
    const [credits, setCredits] = useState<number>(story.regenerationCredits ?? 10);

    const handleTextSaved = useCallback((pageNumber: number, newText: string) => {
        setLivePages(prev =>
            prev.map(p => p.pageNumber === pageNumber ? { ...p, text: newText } : p)
        );
    }, []);

    const handleImageRegenerated = useCallback((pageNumber: number, newUrl: string, remainingCredits: number) => {
        setLivePages(prev =>
            prev.map(p => p.pageNumber === pageNumber ? { ...p, illustrationUrl: newUrl } : p)
        );
        setCredits(remainingCredits);
    }, []);

    // Extract scene spreads: pairs of (illustration page, text page) with matching sceneNumber
    const sceneSpreads: { illustration: BookPage; text: BookPage }[] = [];
    const storyPages = livePages.filter(p => p.type === 'story');

    for (let i = 0; i < storyPages.length; i++) {
        const page = storyPages[i];
        if (page.illustrationUrl && page.sceneNumber) {
            // Find the matching text page
            const textPage = storyPages.find(
                p => p.sceneNumber === page.sceneNumber && p.text && !p.illustrationUrl
            );
            if (textPage) {
                sceneSpreads.push({ illustration: page, text: textPage });
            }
        }
    }

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Sticky Header */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/story/${story.storybookId}`}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Reader
                        </Link>
                        <div className="h-6 w-px bg-slate-200" />
                        <h1 className="text-lg font-bold text-slate-900 truncate max-w-[300px]">
                            {story.title}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Credits Badge */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold">{credits} credit{credits !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scene Spreads */}
            <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
                {/* Info banner */}
                <div className="bg-sky-50 border border-sky-200 rounded-xl px-5 py-4 flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm text-sky-800 font-medium">Edit your story</p>
                        <p className="text-xs text-sky-600 mt-0.5">
                            Text edits are free and unlimited. Image regeneration costs 1 credit per scene.
                        </p>
                    </div>
                </div>

                {sceneSpreads.map((spread, index) => (
                    <SceneSpread
                        key={`scene-${spread.illustration.sceneNumber}`}
                        illustrationPage={spread.illustration}
                        textPage={spread.text}
                        storybookId={story.storybookId}
                        credits={credits}
                        onTextSaved={handleTextSaved}
                        onImageRegenerated={handleImageRegenerated}
                    />
                ))}
            </div>
        </div>
    );
}
