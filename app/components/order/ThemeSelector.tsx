"use client";

import { THEME_OPTIONS, type Theme } from "@/types/storybook";

interface ThemeSelectorProps {
    selected: Theme | null;
    onSelect: (theme: Theme) => void;
}

export default function ThemeSelector({ selected, onSelect }: ThemeSelectorProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg">✨</span>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">Story Theme</h3>
                    <p className="text-sm text-gray-500">
                        What kind of adventure should it be?
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {THEME_OPTIONS.map((theme) => (
                    <button
                        key={theme.id}
                        onClick={() => onSelect(theme.id)}
                        className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left group ${selected === theme.id
                                ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                                : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                            }`}
                    >
                        {/* Selection indicator */}
                        {selected === theme.id && (
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <svg
                                    className="w-3 h-3 text-white"
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

                        <div className="flex items-start gap-3">
                            {/* Emoji */}
                            <span
                                className={`text-2xl transition-transform ${selected === theme.id
                                        ? "scale-110"
                                        : "group-hover:scale-105"
                                    }`}
                            >
                                {theme.emoji}
                            </span>

                            <div className="flex-1 min-w-0">
                                {/* Name */}
                                <div
                                    className={`font-semibold text-sm mb-0.5 ${selected === theme.id
                                            ? "text-primary"
                                            : "text-gray-800"
                                        }`}
                                >
                                    {theme.name}
                                </div>

                                {/* Description */}
                                <div className="text-xs text-gray-400 truncate">
                                    {theme.description}
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
