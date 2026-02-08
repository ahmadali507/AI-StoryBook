"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, User, Dog, Package, Loader2, Sparkles } from "lucide-react";
import type { SimpleCharacter, Gender, EntityType, CharacterRole } from "@/types/storybook";

interface PhotoCharacterCardProps {
    character: Partial<SimpleCharacter>;
    onUpdate: (updates: Partial<SimpleCharacter>) => void;
    onRemove: () => void;
    onPhotoUpload: (file: File) => Promise<string>;
    onGenerateAvatar?: () => Promise<void>;
    isUploading?: boolean;
    isGeneratingAvatar?: boolean;
    isFirst?: boolean;
}

export default function PhotoCharacterCard({
    character,
    onUpdate,
    onRemove,
    onPhotoUpload,
    onGenerateAvatar,
    isUploading = false,
    isGeneratingAvatar = false,
    isFirst = false,
}: PhotoCharacterCardProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith("image/")) {
                const url = await onPhotoUpload(file);
                onUpdate({ photoUrl: url });
            }
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = await onPhotoUpload(file);
            onUpdate({ photoUrl: url });
        }
    };

    const entityIcons: Record<EntityType, React.ReactNode> = {
        human: <User className="w-4 h-4" />,
        animal: <Dog className="w-4 h-4" />,
        object: <Package className="w-4 h-4" />,
    };

    return (
        <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 p-5 transition-all hover:shadow-xl">
            {/* Remove button */}
            {!isFirst && (
                <button
                    onClick={onRemove}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}

            {/* Role badge */}
            <div className="absolute top-3 left-3">
                <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${character.role === "main"
                            ? "bg-primary/10 text-primary"
                            : "bg-gray-100 text-gray-600"
                        }`}
                >
                    {character.role === "main" ? "Main Character" : "Supporting"}
                </span>
            </div>

            {/* Photo upload area */}
            <div
                className={`mt-8 mb-4 relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all ${dragActive
                        ? "bg-primary/10 border-2 border-primary border-dashed"
                        : character.photoUrl
                            ? ""
                            : "bg-gray-50 border-2 border-dashed border-gray-200 hover:border-primary/50"
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                {isUploading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <span className="mt-2 text-sm text-gray-500">Uploading...</span>
                    </div>
                ) : character.photoUrl ? (
                    <>
                        <Image
                            src={character.photoUrl}
                            alt={character.name || "Character photo"}
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                            <span className="text-white text-sm font-medium">
                                Click to change
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                            <Upload className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">
                            Drop photo here
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            or click to browse
                        </p>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

            {/* AI Avatar preview (if generated) */}
            {character.aiAvatarUrl && (
                <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">AI Avatar:</p>
                    <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary/20">
                        <Image
                            src={character.aiAvatarUrl}
                            alt="AI Generated Avatar"
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>
            )}

            {/* Generate Avatar button */}
            {character.photoUrl && !character.aiAvatarUrl && onGenerateAvatar && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onGenerateAvatar();
                    }}
                    disabled={isGeneratingAvatar}
                    className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {isGeneratingAvatar ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            Generate Avatar
                        </>
                    )}
                </button>
            )}

            {/* Name input */}
            <div className="mb-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                    Name
                </label>
                <input
                    type="text"
                    value={character.name || ""}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    placeholder="Enter name"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                />
            </div>

            {/* Gender selector */}
            <div className="mb-3">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                    Gender
                </label>
                <div className="flex gap-2">
                    {(["male", "female", "other"] as Gender[]).map((gender) => (
                        <button
                            key={gender}
                            onClick={() => onUpdate({ gender })}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${character.gender === gender
                                    ? "bg-primary text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            {gender.charAt(0).toUpperCase() + gender.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Entity type selector */}
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                    Type
                </label>
                <div className="flex gap-2">
                    {(["human", "animal", "object"] as EntityType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => onUpdate({ entityType: type })}
                            className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${character.entityType === type
                                    ? "bg-primary text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            {entityIcons[type]}
                            <span className="capitalize">{type}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Role toggle (for non-first characters) */}
            {!isFirst && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                        onClick={() =>
                            onUpdate({
                                role: character.role === "main" ? "supporting" : "main",
                            })
                        }
                        className="text-xs text-gray-500 hover:text-primary transition-colors"
                    >
                        {character.role === "main"
                            ? "Make supporting character"
                            : "Make main character"}
                    </button>
                </div>
            )}
        </div>
    );
}
