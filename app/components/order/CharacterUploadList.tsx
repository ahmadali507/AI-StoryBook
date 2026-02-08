"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import PhotoCharacterCard from "./PhotoCharacterCard";
import type { SimpleCharacter } from "@/types/storybook";

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
    onGenerateAvatar,
    maxCharacters = 3,
    uploadingIndex,
    generatingAvatarIndex,
}: CharacterUploadListProps) {
    const addCharacter = () => {
        if (characters.length < maxCharacters) {
            onCharactersChange([
                ...characters,
                {
                    name: "",
                    photoUrl: "",
                    gender: "other",
                    entityType: "human",
                    role: characters.length === 0 ? "main" : "supporting",
                },
            ]);
        }
    };

    const updateCharacter = (index: number, updates: Partial<SimpleCharacter>) => {
        const newCharacters = [...characters];
        newCharacters[index] = { ...newCharacters[index], ...updates };
        onCharactersChange(newCharacters);
    };

    const removeCharacter = (index: number) => {
        if (characters.length > 1) {
            const newCharacters = characters.filter((_, i) => i !== index);
            // If we removed the main character, make the first one main
            if (characters[index].role === "main" && newCharacters.length > 0) {
                newCharacters[0] = { ...newCharacters[0], role: "main" };
            }
            onCharactersChange(newCharacters);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Characters</h3>
                        <p className="text-sm text-gray-500">
                            Add up to {maxCharacters} characters from your photos
                        </p>
                    </div>
                </div>
                <span className="text-sm text-gray-400">
                    {characters.length}/{maxCharacters}
                </span>
            </div>

            {/* Character cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {characters.map((character, index) => (
                    <PhotoCharacterCard
                        key={index}
                        character={character}
                        onUpdate={(updates) => updateCharacter(index, updates)}
                        onRemove={() => removeCharacter(index)}
                        onPhotoUpload={async (file) => {
                            const url = await onPhotoUpload(file);
                            return url;
                        }}
                        onGenerateAvatar={
                            onGenerateAvatar
                                ? () => onGenerateAvatar(index)
                                : undefined
                        }
                        isUploading={uploadingIndex === index}
                        isGeneratingAvatar={generatingAvatarIndex === index}
                        isFirst={index === 0}
                    />
                ))}

                {/* Add character button */}
                {characters.length < maxCharacters && (
                    <button
                        onClick={addCharacter}
                        className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group"
                    >
                        <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                            <Plus className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium text-gray-600 group-hover:text-primary transition-colors">
                                Add Character
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {characters.length === 0
                                    ? "Start with main character"
                                    : "Add parent, pet, or object"}
                            </p>
                        </div>
                    </button>
                )}
            </div>

            {/* Tips */}
            <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600">
                    💡 <strong>Tips:</strong> Upload clear, front-facing photos for best
                    results. You can add family members, pets, or even favorite toys
                    that will come alive in the story!
                </p>
            </div>
        </div>
    );
}
