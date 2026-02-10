
"use client";

// import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    AGE_RANGE_LABELS,
    THEME_OPTIONS,
    THEME_SUBJECTS,
    MVP_ART_STYLES,
    type AgeRange,
    type Theme,
    type MVPArtStyle
} from "@/types/storybook";
import { Sparkles, BookOpen, Palette, Baby } from "lucide-react";

const THEME_COLORS: Record<string, { bg: string, border: string, text: string, hover: string }> = {
    educational: { bg: "bg-[#FFF4E6]", border: "border-[#FFE0B2]", text: "text-[#E65100]", hover: "hover:bg-[#FFF4E6]" }, // Light Orange
    'fairy-tales': { bg: "bg-[#E0F2F1]", border: "border-[#B2DFDB]", text: "text-[#00695C]", hover: "hover:bg-[#E0F2F1]" }, // Teal
    adventure: { bg: "bg-[#FFEBEE]", border: "border-[#FFCDD2]", text: "text-[#C62828]", hover: "hover:bg-[#FFEBEE]" }, // Pink/Red
    activities: { bg: "bg-[#F3E5F5]", border: "border-[#E1BEE7]", text: "text-[#6A1B9A]", hover: "hover:bg-[#F3E5F5]" }, // Purple
    worlds: { bg: "bg-[#E8EAF6]", border: "border-[#C5CAE9]", text: "text-[#283593]", hover: "hover:bg-[#E8EAF6]" }, // Indigo
    stories: { bg: "bg-[#FFF8E1]", border: "border-[#FFECB3]", text: "text-[#FF8F00]", hover: "hover:bg-[#FFF8E1]" }, // Amber
    holidays: { bg: "bg-[#EFEBE9]", border: "border-[#D7CCC8]", text: "text-[#4E342E]", hover: "hover:bg-[#EFEBE9]" }, // Brown/Grey
    family: { bg: "bg-[#FFEBEE]", border: "border-[#FFCDD2]", text: "text-[#B71C1C]", hover: "hover:bg-[#FFEBEE]" }, // Red
};

interface StorySettingsFormProps {
    ageRange: AgeRange | null;
    setAgeRange: (range: AgeRange) => void;
    theme: Theme | null;
    setTheme: (theme: Theme) => void;
    subject: string | null;
    setSubject: (subject: string | null) => void;
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
    subject,
    setSubject,
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {THEME_OPTIONS.map((item) => {
                        const colors = THEME_COLORS[item.id] || THEME_COLORS.adventure;
                        const isSelected = theme === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setTheme(item.id);
                                    setSubject(null); // Reset subject when theme changes
                                }}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300 text-center h-full hover:shadow-lg hover:-translate-y-1",
                                    isSelected
                                        ? cn(colors.bg, colors.border, "shadow-md")
                                        : cn("bg-white border-slate-100", colors.hover, "hover:border-slate-200")
                                )}
                            >
                                <span className="text-4xl filter drop-shadow-sm transform transition-transform duration-300 group-hover:scale-110">{item.emoji}</span>
                                <span className={cn(
                                    "font-bold text-sm",
                                    isSelected ? colors.text : "text-slate-600"
                                )}>{item.name}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 4. Choose a Subject (Dynamic based on theme) */}
            {theme && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <Label className="text-xl font-bold text-slate-800">Choose a Subject</Label>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {/* Pre-defined subjects */}
                        {THEME_SUBJECTS[theme]?.map((item) => {
                            const colors = THEME_COLORS[theme] || THEME_COLORS.adventure;
                            const isSelected = subject === item.name;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setSubject(item.name)}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all duration-300 text-center h-full hover:shadow-lg hover:-translate-y-1",
                                        isSelected
                                            ? cn(colors.bg, colors.border, "shadow-md")
                                            : cn("bg-white border-slate-100", colors.hover, "hover:border-slate-200")
                                    )}
                                >
                                    <span className="text-4xl mb-1 filter drop-shadow-sm">{item.emoji}</span>
                                    <span className={cn(
                                        "font-bold text-sm leading-tight",
                                        isSelected ? colors.text : "text-slate-600"
                                    )}>{item.name}</span>
                                </button>
                            );
                        })}

                        {/* Custom Subject Option */}
                        <button
                            onClick={() => setSubject('custom')}
                            className={cn(
                                "flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed transition-all duration-300 text-center hover:shadow-md hover:-translate-y-1",
                                subject === 'custom'
                                    ? "border-indigo-400 bg-indigo-50 shadow-sm"
                                    : "border-slate-300 bg-slate-50 hover:border-indigo-300 hover:bg-slate-100"
                            )}
                        >
                            <span className="text-4xl mb-1">✨</span>
                            <span className={cn(
                                "font-bold text-sm",
                                subject === 'custom' ? "text-indigo-600" : "text-slate-500"
                            )}>Custom Subject</span>
                        </button>
                    </div>
                </div>
            )}

            {/* 5. Details / Description */}
            <div className={`space-y-4 transition-all duration-500 ${subject === 'custom' ? 'opacity-100' : 'opacity-100'}`}>
                <Label className="text-xl font-bold text-slate-800">
                    {subject === 'custom' ? 'Describe your Custom Subject' : 'Additional Details (Optional)'}
                </Label>
                <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={subject === 'custom'
                        ? "Tell us what your story should be about..."
                        : "Any specific details you'd like to include? (e.g. Favorite toy, specific location)"
                    }
                    className={cn(
                        "min-h-[120px] p-4 text-base rounded-xl border-2 resize-none font-medium text-slate-700 placeholder:text-slate-400 transition-all",
                        subject === 'custom'
                            ? "border-indigo-500 ring-4 ring-indigo-500/10 focus:border-indigo-600"
                            : "border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    )}
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
