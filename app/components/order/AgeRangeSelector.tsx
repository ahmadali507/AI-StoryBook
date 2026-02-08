"use client";

import { AGE_RANGE_LABELS, type AgeRange } from "@/types/storybook";

interface AgeRangeSelectorProps {
    selected: AgeRange | null;
    onSelect: (ageRange: AgeRange) => void;
}

export default function AgeRangeSelector({
    selected,
    onSelect,
}: AgeRangeSelectorProps) {
    const ageRanges = Object.entries(AGE_RANGE_LABELS) as [
        AgeRange,
        (typeof AGE_RANGE_LABELS)[AgeRange]
    ][];

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <span className="text-lg">👶</span>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">Child&apos;s Age</h3>
                    <p className="text-sm text-gray-500">
                        This affects vocabulary and story complexity
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {ageRanges.map(([range, info]) => (
                    <button
                        key={range}
                        onClick={() => onSelect(range)}
                        className={`relative p-6 rounded-2xl border-2 transition-all duration-200 text-center group ${selected === range
                                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                                : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                            }`}
                    >
                        {/* Selection indicator */}
                        {selected === range && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
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

                        {/* Emoji */}
                        <div
                            className={`text-4xl mb-3 transition-transform ${selected === range
                                    ? "scale-110"
                                    : "group-hover:scale-105"
                                }`}
                        >
                            {info.emoji}
                        </div>

                        {/* Age range */}
                        <div
                            className={`text-xl font-bold mb-1 ${selected === range ? "text-primary" : "text-gray-800"
                                }`}
                        >
                            {range}
                        </div>

                        {/* Label */}
                        <div className="text-sm font-medium text-gray-600">
                            {info.label}
                        </div>

                        {/* Description */}
                        <div className="text-xs text-gray-400 mt-1">
                            {info.description}
                        </div>
                    </button>
                ))}
            </div>

            {/* Age explanation */}
            {selected && (
                <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/20">
                    <p className="text-sm text-gray-600">
                        <span className="font-semibold text-primary">
                            For {AGE_RANGE_LABELS[selected].label}s:
                        </span>{" "}
                        {selected === "0-2" &&
                            "Simple sounds and words like 'boom!' and 'splash!'. Very short sentences with lots of repetition."}
                        {selected === "2-4" &&
                            "Easy-to-follow sentences with familiar words. Perfect for reading together at bedtime."}
                        {selected === "5-8" &&
                            "Full story with dialogue and adventure. Great for independent readers or read-aloud time."}
                        {selected === "9-12" &&
                            "Rich storytelling with character development and exciting plots."}
                    </p>
                </div>
            )}
        </div>
    );
}
