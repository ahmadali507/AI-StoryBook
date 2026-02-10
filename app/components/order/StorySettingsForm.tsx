
"use client";

// import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    AGE_RANGE_LABELS,
    THEME_OPTIONS,
    MVP_ART_STYLES,
    type AgeRange,
    type Theme,
    type MVPArtStyle
} from "@/types/storybook";
import { Sparkles, BookOpen, Palette, Baby } from "lucide-react";

interface StorySettingsFormProps {
    ageRange: AgeRange | null;
    setAgeRange: (range: AgeRange) => void;
    theme: Theme | null;
    setTheme: (theme: Theme) => void;
    artStyle: MVPArtStyle | null;
    setArtStyle: (style: MVPArtStyle) => void;
    title: string;
    setTitle: (title: string) => void;
    description: string;
    setDescription: (desc: string) => void;
}

export default function StorySettingsForm({
    ageRange,
    setAgeRange,
    theme,
    setTheme,
    artStyle,
    setArtStyle,
    title,
    setTitle,
    description,
    setDescription,
}: StorySettingsFormProps) {

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* 1. Story Title */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <BookOpen className="w-4 h-4" />
                    </div>
                    <Label className="text-xl font-bold text-slate-800">Story Title</Label>
                </div>
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. The Magical Forest Adventure"
                    className="text-lg py-6 px-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold"
                />
                <p className="text-sm text-slate-500 ml-1">
                    Leave blank and we&apos;ll generate a title for you.
                </p>
            </div>

            {/* 2. Age Group */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                        <Baby className="w-4 h-4" />
                    </div>
                    <Label className="text-xl font-bold text-slate-800">Age Group</Label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(Object.entries(AGE_RANGE_LABELS) as [AgeRange, typeof AGE_RANGE_LABELS[AgeRange]][]).map(([range, info]) => (
                        <button
                            key={range}
                            onClick={() => setAgeRange(range)}
                            className={cn(
                                "relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 gap-2 group hover:scale-[1.02]",
                                ageRange === range
                                    ? "border-rose-500 bg-rose-50 shadow-lg shadow-rose-500/10"
                                    : "border-slate-200 bg-white hover:border-rose-200 hover:bg-rose-50/50"
                            )}
                        >
                            <span className="text-3xl filter drop-shadow-sm">{info.emoji}</span>
                            <span className={cn(
                                "text-lg font-bold",
                                ageRange === range ? "text-rose-600" : "text-slate-700"
                            )}>{range}</span>
                            <span className="text-xs font-medium text-slate-400 capitalize">{info.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. Story Theme */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <Label className="text-xl font-bold text-slate-800">Story Theme</Label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {THEME_OPTIONS.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setTheme(item.id)}
                            className={cn(
                                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left hover:scale-[1.02]",
                                theme === item.id
                                    ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10"
                                    : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
                            )}
                        >
                            <span className="text-2xl">{item.emoji}</span>
                            <span className={cn(
                                "font-semibold text-sm",
                                theme === item.id ? "text-emerald-700" : "text-slate-700"
                            )}>{item.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 4. Description */}
            <div className="space-y-4">
                <Label className="text-xl font-bold text-slate-800">Description</Label>
                <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell us a bit more about the story you want... (e.g. Make it about a dinosaur who loves ice cream)"
                    className="min-h-[120px] p-4 text-base rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 resize-none font-medium text-slate-700 placeholder:text-slate-400"
                />
            </div>

            {/* 5. Art Styles */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                        <Palette className="w-4 h-4" />
                    </div>
                    <Label className="text-xl font-bold text-slate-800">Art Style</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {MVP_ART_STYLES.map((style) => (
                        <button
                            key={style.id}
                            onClick={() => setArtStyle(style.id)}
                            className={cn(
                                "relative group overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:shadow-xl text-left bg-white",
                                artStyle === style.id
                                    ? "border-amber-500 shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/20"
                                    : "border-slate-200 hover:border-amber-300"
                            )}
                        >
                            <div className={cn(
                                "aspect-[16/9] w-full bg-slate-100 relative overflow-hidden transition-transform duration-500",
                                artStyle === style.id ? "scale-105" : "group-hover:scale-105"
                            )}>
                                {/* If we had real images, we'd use Next/Image here. Using placeholders/gradients for now. */}
                                <div className={cn(
                                    "absolute inset-0 bg-gradient-to-br opacity-80",
                                    style.id === "pixar-3d"
                                        ? "from-blue-400 via-purple-400 to-pink-400"
                                        : "from-amber-200 via-orange-100 to-yellow-200"
                                )} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-6xl drop-shadow-lg filter">{style.id === 'pixar-3d' ? '🎬' : '🎨'}</span>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={cn(
                                        "text-lg font-bold",
                                        artStyle === style.id ? "text-amber-700" : "text-slate-800"
                                    )}>
                                        {style.name}
                                    </span>
                                    {artStyle === style.id && (
                                        <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white">
                                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 line-clamp-2">
                                    {style.prompt.split(',')[0]}...
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

        </div>
    );
}
