
"use client";

import { useRef } from "react";
import { Upload, User, Sparkles, Shirt, Smile, Plus, Trash2, Star, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { cn } from "@/lib/utils";
import type { SimpleCharacter, Gender, EntityType } from "@/types/storybook";

interface CharacterUploadListProps {
    characters: Partial<SimpleCharacter>[];
    onCharactersChange: (characters: Partial<SimpleCharacter>[]) => void;
    onPhotoUpload: (file: File) => Promise<string>;
    onGenerateAvatar?: (characterIndex: number) => Promise<void>;
    maxCharacters?: number;
    uploadingIndex?: number;
    generatingAvatarIndex?: number;
}

const CHARACTER_LABELS = [
    { label: "Character 1", subtitle: "Main character", emoji: "⭐", color: "from-amber-400 to-orange-500" },
    { label: "Character 2", subtitle: null, emoji: "🌟", color: "from-sky-400 to-blue-500" },
    { label: "Character 3", subtitle: null, emoji: "✨", color: "from-purple-400 to-pink-500" },
];

export default function CharacterUploadList({
    characters,
    onCharactersChange,
    onPhotoUpload,
    maxCharacters = 3,
    uploadingIndex,
}: CharacterUploadListProps) {
    const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);

    // Always ensure 3 slots exist
    const ensuredCharacters: Partial<SimpleCharacter>[] = Array.from({ length: maxCharacters }, (_, i) => {
        return characters[i] || null;
    });

    const handleUpdate = (index: number, field: keyof SimpleCharacter, value: any) => {
        const newCharacters = [...characters];
        // If this index doesn't have a character yet, create one
        while (newCharacters.length <= index) {
            newCharacters.push({
                name: "",
                photoUrl: "",
                gender: "other",
                entityType: "human",
                role: "supporting",
            });
        }
        newCharacters[index] = { ...newCharacters[index], [field]: value };
        onCharactersChange(newCharacters);
    };

    const handlePhotoSelect = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                // Ensure character slot exists before uploading
                if (!characters[index]) {
                    const newCharacters = [...characters];
                    while (newCharacters.length <= index) {
                        newCharacters.push({
                            name: "",
                            photoUrl: "",
                            gender: "other",
                            entityType: "human",
                            role: index === 0 ? "main" : "supporting",
                        });
                    }
                    onCharactersChange(newCharacters);
                }
                const url = await onPhotoUpload(file);
                handleUpdate(index, "photoUrl", url);
            } catch (error) {
                console.error("Upload failed", error);
            }
        }
    };

    const removeCharacter = (index: number) => {
        if (index === 0) return; // Can't remove first character
        const newCharacters = characters.filter((_, i) => i !== index);
        onCharactersChange(newCharacters);
    };

    const isSlotActive = (index: number) => {
        return !!ensuredCharacters[index];
    };

    const isSlotComplete = (index: number) => {
        const char = ensuredCharacters[index];
        return char && char.name && char.photoUrl;
    };


    return (
        <div className="relative">
            {/* 3-Column Character Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
                {ensuredCharacters.map((char, index) => {
                    const meta = CHARACTER_LABELS[index];
                    const active = isSlotActive(index);
                    const complete = isSlotComplete(index);
                    const isUploading = uploadingIndex === index;

                    return (
                        <div
                            key={index}
                            className={cn(
                                "relative rounded-2xl border-2 transition-all duration-300 overflow-hidden",
                                active
                                    ? "bg-white shadow-lg border-slate-200 hover:shadow-xl"
                                    : "bg-slate-50/50 border-dashed border-slate-200 hover:border-primary/30 hover:bg-white/80"
                            )}
                        >
                            {/* Character Header Badge */}
                            <div className={cn(
                                "flex items-center justify-between px-4 py-2.5 border-b",
                                active ? "bg-gradient-to-r text-white border-transparent" : "bg-slate-50 border-slate-100",
                                active && meta.color
                            )}>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{meta.emoji}</span>
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider block">
                                            {meta.label}
                                        </span>
                                        {meta.subtitle && (
                                            <span className="text-[9px] font-medium opacity-80 block">
                                                {meta.subtitle}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {active && index > 0 && (
                                    <button
                                        onClick={() => removeCharacter(index)}
                                        className="p-1 rounded-full hover:bg-white/20 transition-colors"
                                        title="Remove character"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                {complete && (
                                    <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
                                        <span className="text-[10px]">✓</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 space-y-4">
                                {/* Photo Upload */}
                                <div className="flex flex-col items-center gap-2">
                                    <div
                                        onClick={() => fileInputRefs.current[index]?.click()}
                                        className={cn(
                                            "group relative w-24 h-24 rounded-2xl border-3 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-1 overflow-hidden",
                                            char?.photoUrl
                                                ? "border-transparent shadow-md"
                                                : "border-slate-200 hover:border-primary/40 bg-slate-50 hover:bg-primary/5",
                                            isUploading && "opacity-50 pointer-events-none"
                                        )}
                                    >
                                        {char?.photoUrl ? (
                                            <img src={char.photoUrl} alt="Character" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                    <Upload className="w-4 h-4" />
                                                </div>
                                                <span className="text-[10px] font-semibold text-slate-400 group-hover:text-primary">Upload</span>
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            ref={(el) => { fileInputRefs.current[index] = el; }}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handlePhotoSelect(index, e)}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium text-center">
                                        {isUploading ? "Uploading..." : "Clear front-facing photo"}
                                    </p>
                                </div>

                                {/* Name */}
                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-500 font-semibold ml-0.5">Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                                        <Input
                                            value={char?.name || ""}
                                            onChange={(e) => handleUpdate(index, "name", e.target.value)}
                                            placeholder="Character name"
                                            className="pl-8 h-9 text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Age */}
                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-500 font-semibold ml-0.5">Age</Label>
                                    <div className="relative">
                                        <Smile className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                                        <Input
                                            value={char?.age || ""}
                                            onChange={(e) => handleUpdate(index, "age", e.target.value)}
                                            placeholder="e.g. 8 years old"
                                            className="pl-8 h-9 text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Type */}
                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-500 font-semibold ml-0.5">Type</Label>
                                    <div className="flex p-0.5 bg-slate-100 rounded-lg">
                                        {(["human", "animal", "object"] as const).map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => handleUpdate(index, "entityType", t)}
                                                className={cn(
                                                    "flex-1 py-1.5 text-xs font-bold rounded-md capitalize transition-all",
                                                    char?.entityType === t
                                                        ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                                                        : "text-slate-500 hover:text-slate-700"
                                                )}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Gender */}
                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-500 font-semibold ml-0.5">Gender</Label>
                                    <div className="flex p-0.5 bg-slate-100 rounded-lg">
                                        {(["male", "female", "other"] as const).map((g) => (
                                            <button
                                                key={g}
                                                onClick={() => handleUpdate(index, "gender", g)}
                                                className={cn(
                                                    "flex-1 py-1.5 text-xs font-bold rounded-md capitalize transition-all",
                                                    char?.gender === g
                                                        ? "bg-white text-orange-500 shadow-sm ring-1 ring-black/5"
                                                        : "text-slate-500 hover:text-slate-700"
                                                )}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Additional Details */}
                                <div className="space-y-4 border-t border-slate-100 pt-4">
                                    {/* Clothing Style */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                                                <Shirt className="w-3.5 h-3.5 text-primary" />
                                                Clothing Style
                                            </Label>
                                            <label className="flex items-center gap-1.5 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={char?.useFixedClothing || false}
                                                    onChange={(e) => handleUpdate(index, "useFixedClothing", e.target.checked)}
                                                    className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary/50 cursor-pointer"
                                                />
                                                <span className="text-[10px] text-slate-500 group-hover:text-primary transition-colors">
                                                    Keep photo clothes
                                                </span>
                                            </label>
                                        </div>

                                        {!char?.useFixedClothing && (
                                            <Textarea
                                                value={char?.clothingStyle || ""}
                                                onChange={(e) => handleUpdate(index, "clothingStyle", e.target.value)}
                                                placeholder="e.g. Red hoodie, blue jeans..."
                                                className="min-h-[60px] rounded-lg border resize-none text-xs"
                                            />
                                        )}

                                        {char?.useFixedClothing && (
                                            <p className="text-[10px] text-slate-400 italic">
                                                Uses clothing from uploaded photo.
                                            </p>
                                        )}
                                    </div>

                                    {/* Role in Story */}
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5 text-primary" />
                                            Role in Story
                                        </Label>
                                        <Input
                                            value={char?.storyRole || ""}
                                            onChange={(e) => handleUpdate(index, "storyRole", e.target.value)}
                                            placeholder="e.g. Father, Best friend..."
                                            className="h-9 text-xs"
                                        />
                                        <p className="text-[10px] text-slate-400">
                                            Enforced throughout the story.
                                        </p>
                                    </div>

                                    {/* Additional Details */}
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                                            Extra Details (optional)
                                        </Label>
                                        <Textarea
                                            value={char?.description || ""}
                                            onChange={(e) => handleUpdate(index, "description", e.target.value)}
                                            placeholder="Extra personality or physical details..."
                                            className="min-h-[60px] rounded-lg border resize-none text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <p className="text-center text-slate-400 text-xs mt-5">
                Fill in as many characters as you like. Only characters with a photo and name will be included.
            </p>
        </div>
    );
}
