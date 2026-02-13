
"use client";

import { useState, useRef } from "react";
import { Upload, User, Sparkles, Shirt, Smile, ChevronRight, ChevronLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function CharacterUploadList({
    characters,
    onCharactersChange,
    onPhotoUpload,
    maxCharacters = 3,
    uploadingIndex,
}: CharacterUploadListProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Ensure there is at least one character
    if (characters.length === 0) {
        onCharactersChange([
            {
                name: "",
                photoUrl: "",
                gender: "other",
                entityType: "human",
                role: "main",
            },
        ]);
    }

    const activeCharacter = characters[activeIndex] || {};

    const handleUpdate = (field: keyof SimpleCharacter, value: any) => {
        const newCharacters = [...characters];
        newCharacters[activeIndex] = { ...newCharacters[activeIndex], [field]: value };
        onCharactersChange(newCharacters);
    };

    const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // We rely on the parent to handle the actual upload and return URL
            // But preserving specific index loading state might be tricky if parent only accepts file
            // The parent uses `uploadingIndex` prop, which is fine.
            try {
                const url = await onPhotoUpload(file);
                handleUpdate("photoUrl", url);
            } catch (error) {
                console.error("Upload failed", error);
            }
        }
    };

    const addNewCharacter = () => {
        if (characters.length < maxCharacters) {
            const newChar: Partial<SimpleCharacter> = {
                name: "",
                photoUrl: "",
                gender: "other",
                entityType: "human",
                role: "supporting",
            };
            onCharactersChange([...characters, newChar]);
            setActiveIndex(characters.length); // Switch to new character
        }
    };

    const removeCurrentCharacter = () => {
        if (characters.length > 1) {
            const newCharacters = characters.filter((_, i) => i !== activeIndex);
            onCharactersChange(newCharacters);
            setActiveIndex(Math.max(0, activeIndex - 1));
        }
    };

    return (
        <div className="flex justify-center p-4 sm:p-6 bg-[#EEF2FF] rounded-3xl min-h-[600px] border border-white/50 relative overflow-hidden">
            {/* Decorative background blobs */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-orange-100 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-2xl relative z-10">

                {/* Navigation / Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                            disabled={activeIndex === 0}
                            className="rounded-full"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <span className="font-bold text-lg text-slate-700">
                            Character {activeIndex + 1} of {characters.length}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setActiveIndex(Math.min(characters.length - 1, activeIndex + 1))}
                            disabled={activeIndex === characters.length - 1}
                            className="rounded-full"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        {characters.length > 1 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={removeCurrentCharacter}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                title="Delete Character"
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        )}
                        {characters.length < maxCharacters && (
                            <Button
                                variant="default"
                                onClick={addNewCharacter}
                                className="gap-2 rounded-full font-semibold bg-primary text-white hover:bg-primary/90 shadow-md transform transition-all hover:scale-105 active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                                Add New
                            </Button>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* 1. Photo Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "group relative w-40 h-40 rounded-3xl bg-slate-50 border-4 border-dashed border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md overflow-hidden",
                                uploadingIndex === activeIndex && "opacity-50 pointer-events-none"
                            )}
                        >
                            {activeCharacter.photoUrl ? (
                                <img src={activeCharacter.photoUrl} alt="Character" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1 group-hover:scale-110 transition-transform">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-400 group-hover:text-primary">Upload Photo</span>
                                </>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handlePhotoSelect}
                            />
                        </div>
                        <p className="text-sm text-slate-500 font-medium">
                            {uploadingIndex === activeIndex ? "Uploading..." : "Upload a clear front-facing photo"}
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* 2. Identity Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="ml-1 text-slate-700">Name</Label>
                                <div className="relative">
                                    <User className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                                    <Input
                                        value={activeCharacter.name || ""}
                                        onChange={(e) => handleUpdate("name", e.target.value)}
                                        placeholder="e.g. Luna Lovegood"
                                        className="pl-10 h-12 text-base"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="ml-1 text-slate-700">Age</Label>
                                <div className="relative">
                                    <Smile className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                                    <Input
                                        value={activeCharacter.age || ""}
                                        onChange={(e) => handleUpdate("age", e.target.value)}
                                        placeholder="e.g. 8 years old"
                                        className="pl-10 h-12 text-base"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. Demographics Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label className="ml-1 text-slate-700">Type</Label>
                                <div className="flex p-1 bg-slate-100 rounded-xl">
                                    {(["human", "animal", "object"] as const).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => handleUpdate("entityType", t)}
                                            className={cn(
                                                "flex-1 py-2 text-sm font-bold rounded-lg capitalize transition-all",
                                                activeCharacter.entityType === t
                                                    ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                                                    : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="ml-1 text-slate-700">Gender</Label>
                                <div className="flex p-1 bg-slate-100 rounded-xl">
                                    {(["male", "female", "other"] as const).map((g) => (
                                        <button
                                            key={g}
                                            onClick={() => handleUpdate("gender", g)}
                                            className={cn(
                                                "flex-1 py-2 text-sm font-bold rounded-lg capitalize transition-all",
                                                activeCharacter.gender === g
                                                    ? "bg-white text-orange-500 shadow-sm ring-1 ring-black/5"
                                                    : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* 4. Clothing Style */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="ml-1 text-slate-700 flex items-center gap-2">
                                    <Shirt className="w-4 h-4 text-primary" />
                                    Clothing Style
                                </Label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={activeCharacter.useFixedClothing || false}
                                        onChange={(e) => handleUpdate("useFixedClothing", e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/50 cursor-pointer"
                                    />
                                    <span className="text-sm text-slate-500 group-hover:text-primary transition-colors">
                                        Keep consistent?
                                    </span>
                                </label>
                            </div>

                            {/* Only show clothing description if "Keep consistent" is checked */}
                            {activeCharacter.useFixedClothing && (
                                <Textarea
                                    value={activeCharacter.clothingStyle || ""}
                                    onChange={(e) => handleUpdate("clothingStyle", e.target.value)}
                                    placeholder="Describe their outfit to keep it consistent (e.g. Red hoodie, blue jeans, and white sneakers)..."
                                    className="min-h-[80px] rounded-xl border-2 resize-none text-base animate-in fade-in slide-in-from-top-1"
                                />
                            )}
                        </div>

                        {/* 5. Character Description */}
                        <div className="space-y-2">
                            <Label className="ml-1 text-slate-700 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-orange-500" />
                                Character Description & Role
                            </Label>
                            <Textarea
                                value={activeCharacter.description || ""}
                                onChange={(e) => handleUpdate("description", e.target.value)}
                                placeholder="Describe their personality, role in the story (e.g. The brave protagonist), and any physical traits not seen in the photo..."
                                className="min-h-[120px] rounded-xl border-2 resize-none text-base"
                            />
                        </div>

                    </div>
                </div>

                {/* Footer Hint */}
                <p className="text-center text-slate-400 text-sm mt-6">
                    Add detailed descriptions used for consistent character generation.
                </p>
            </div>
        </div>
    );
}
