"use client";

import Image from "next/image";
import { MVP_ART_STYLES, type MVPArtStyle } from "@/types/storybook";

interface ArtStyleSelectorProps {
    selected: MVPArtStyle | null;
    onSelect: (style: MVPArtStyle) => void;
}

export default function ArtStyleSelector({
    selected,
    onSelect,
}: ArtStyleSelectorProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                    <span className="text-lg">🎨</span>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">Art Style</h3>
                    <p className="text-sm text-gray-500">
                        Choose the illustration style for your book
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {MVP_ART_STYLES.map((style) => (
                    <button
                        key={style.id}
                        onClick={() => onSelect(style.id)}
                        className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-200 group ${selected === style.id
                            ? "border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20"
                            : "border-gray-200 hover:border-primary/50"
                            }`}
                    >
                        {/* Selection indicator */}
                        {selected === style.id && (
                            <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
                                <svg
                                    className="w-4 h-4 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                        )}

                        {/* Preview image placeholder */}
                        <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                            {/* Placeholder gradient based on style */}
                            <div
                                className={`absolute inset-0 ${style.id === "pixar-3d"
                                    ? "bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100"
                                    : "bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100"
                                    }`}
                            />

                            {/* Style icon */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-5xl opacity-30">
                                    {style.id === "pixar-3d" ? "�" : "📚"}
                                </span>
                            </div>
                        </div>

                        {/* Label */}
                        <div
                            className={`p-3 text-center ${selected === style.id
                                ? "bg-primary/5"
                                : "bg-white"
                                }`}
                        >
                            <span
                                className={`font-medium text-sm ${selected === style.id
                                    ? "text-primary"
                                    : "text-gray-700"
                                    }`}
                            >
                                {style.name}
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Style description */}
            {selected && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600">
                        <span className="font-semibold">
                            {MVP_ART_STYLES.find((s) => s.id === selected)?.name}:
                        </span>{" "}
                        {selected === "pixar-3d" &&
                            "Cinematic 3D style like your favorite animated movies. Vibrant, detailed, and full of life."}
                        {selected === "storybook" &&
                            "Timeless, detailed illustrations like beloved children's classics. Perfect for bedtime stories."}
                    </p>
                </div>
            )}
        </div>
    );
}
