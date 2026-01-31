"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/app/components/layout";
import { ProgressSteps } from "@/app/components/shared";
import {
    ChevronLeft,
    ChevronRight,
    Check,
    Shuffle,
    Trash2,
    Save
} from "lucide-react";

const hairStyles = ["Short & Wavy", "Long & Straight", "Curly", "Braided", "Ponytail"];
const eyeColors = ["Brown", "Blue", "Green", "Hazel", "Gray"];
const skinTones = ["Light", "Medium", "Tan", "Brown", "Dark"];
const outfits = ["Casual", "Adventurer", "Princess/Prince", "Superhero", "Wizard"];
const accessories = ["Glasses", "Hat", "Backpack", "Pet", "Magic Wand", "Crown"];

const steps = [
    { id: 1, label: "Basics", key: "basics" },
    { id: 2, label: "Appearance", key: "appearance" },
    { id: 3, label: "Personality", key: "personality" },
];

interface Character {
    name: string;
    age: string;
    gender: string;
    hairStyle: string;
    eyeColor: string;
    skinTone: string;
    outfit: string;
    accessories: string[];
    personality: string[];
}

function TraitSelector({
    options,
    selected,
    onSelect,
    multiple = false,
}: {
    options: string[];
    selected: string | string[];
    onSelect: (value: string) => void;
    multiple?: boolean;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((option) => {
                const isSelected = multiple
                    ? (selected as string[]).includes(option)
                    : selected === option;
                return (
                    <button
                        key={option}
                        type="button"
                        onClick={() => onSelect(option)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${isSelected
                            ? "bg-primary text-white"
                            : "bg-background border border-border text-foreground hover:border-primary"
                            }`}
                    >
                        {isSelected && <Check className="w-4 h-4 inline mr-1" />}
                        {option}
                    </button>
                );
            })}
        </div>
    );
}

function CharacterPreview({ character }: { character: Character }) {
    return (
        <div className="bg-surface border border-border rounded-2xl p-6 sticky top-24">
            <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
                Character Preview
            </h2>

            {/* Avatar Preview */}
            <div className="aspect-square max-w-xs mx-auto bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <div className="text-center">
                    <div className="w-32 h-32 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-5xl">👤</span>
                    </div>
                    <p className="text-lg font-semibold text-foreground">
                        {character.name || "Your Character"}
                    </p>
                    {character.age && (
                        <p className="text-sm text-text-muted">{character.age} years old</p>
                    )}
                </div>
            </div>

            {/* Character Details */}
            {(character.hairStyle || character.eyeColor || character.skinTone) && (
                <div className="space-y-2 text-sm">
                    {character.hairStyle && (
                        <div className="flex justify-between">
                            <span className="text-text-muted">Hair</span>
                            <span className="text-foreground">{character.hairStyle}</span>
                        </div>
                    )}
                    {character.eyeColor && (
                        <div className="flex justify-between">
                            <span className="text-text-muted">Eyes</span>
                            <span className="text-foreground">{character.eyeColor}</span>
                        </div>
                    )}
                    {character.outfit && (
                        <div className="flex justify-between">
                            <span className="text-text-muted">Outfit</span>
                            <span className="text-foreground">{character.outfit}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-background transition-colors cursor-pointer">
                    <Shuffle className="w-4 h-4" />
                    Randomize
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-background transition-colors text-error cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

export default function CharacterCreatorContent() {
    const [currentStep, setCurrentStep] = useState(1);
    const [character, setCharacter] = useState<Character>({
        name: "",
        age: "",
        gender: "",
        hairStyle: "",
        eyeColor: "",
        skinTone: "",
        outfit: "",
        accessories: [],
        personality: [],
    });

    const personalities = ["Brave", "Curious", "Kind", "Funny", "Creative", "Adventurous", "Shy", "Smart"];

    const updateCharacter = <K extends keyof Character>(key: K, value: Character[K]) => {
        setCharacter((prev) => ({ ...prev, [key]: value }));
    };

    const toggleAccessory = (accessory: string) => {
        setCharacter((prev) => ({
            ...prev,
            accessories: prev.accessories.includes(accessory)
                ? prev.accessories.filter((a) => a !== accessory)
                : [...prev.accessories, accessory],
        }));
    };

    const togglePersonality = (trait: string) => {
        setCharacter((prev) => ({
            ...prev,
            personality: prev.personality.includes(trait)
                ? prev.personality.filter((p) => p !== trait)
                : prev.personality.length < 3
                    ? [...prev.personality, trait]
                    : prev.personality,
        }));
    };

    return (
        <main className="pt-24 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
                    <Link href="/dashboard" className="hover:text-foreground cursor-pointer">
                        Dashboard
                    </Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-foreground">Character Creator</span>
                </div>

                {/* Progress Steps */}
                <ProgressSteps steps={steps} currentStep={currentStep} />

                {/* Main Content */}
                <div className="grid lg:grid-cols-5 gap-8">
                    {/* Left Panel - Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-surface border border-border rounded-2xl p-6">
                            {currentStep === 1 && (
                                <>
                                    <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
                                        Basic Info
                                    </h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                Name
                                            </label>
                                            <input
                                                type="text"
                                                value={character.name}
                                                onChange={(e) => updateCharacter("name", e.target.value)}
                                                placeholder="e.g., Luna, Max, Aria"
                                                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                Age
                                            </label>
                                            <input
                                                type="number"
                                                value={character.age}
                                                onChange={(e) => updateCharacter("age", e.target.value)}
                                                placeholder="e.g., 7"
                                                min="1"
                                                max="12"
                                                className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:border-primary outline-none transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-3">
                                                Gender
                                            </label>
                                            <TraitSelector
                                                options={["Girl", "Boy", "Non-Binary"]}
                                                selected={character.gender}
                                                onSelect={(v) => updateCharacter("gender", v)}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {currentStep === 2 && (
                                <>
                                    <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
                                        Appearance
                                    </h2>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-3">
                                                Hair Style
                                            </label>
                                            <TraitSelector
                                                options={hairStyles}
                                                selected={character.hairStyle}
                                                onSelect={(v) => updateCharacter("hairStyle", v)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-3">
                                                Eye Color
                                            </label>
                                            <TraitSelector
                                                options={eyeColors}
                                                selected={character.eyeColor}
                                                onSelect={(v) => updateCharacter("eyeColor", v)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-3">
                                                Skin Tone
                                            </label>
                                            <TraitSelector
                                                options={skinTones}
                                                selected={character.skinTone}
                                                onSelect={(v) => updateCharacter("skinTone", v)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-3">
                                                Outfit
                                            </label>
                                            <TraitSelector
                                                options={outfits}
                                                selected={character.outfit}
                                                onSelect={(v) => updateCharacter("outfit", v)}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {currentStep === 3 && (
                                <>
                                    <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
                                        Personality & Extras
                                    </h2>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-2">
                                                Personality Traits (up to 3)
                                            </label>
                                            <p className="text-sm text-text-muted mb-3">
                                                Selected: {character.personality.length}/3
                                            </p>
                                            <TraitSelector
                                                options={personalities}
                                                selected={character.personality}
                                                onSelect={togglePersonality}
                                                multiple
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-3">
                                                Accessories
                                            </label>
                                            <TraitSelector
                                                options={accessories}
                                                selected={character.accessories}
                                                onSelect={toggleAccessory}
                                                multiple
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Preview */}
                    <div className="lg:col-span-3">
                        <CharacterPreview character={character} />

                        {/* Navigation */}
                        <div className="flex justify-between items-center mt-6">
                            <button
                                onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
                                disabled={currentStep === 1}
                                className="flex items-center gap-2 text-text-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Back
                            </button>

                            {currentStep < 3 ? (
                                <button
                                    onClick={() => setCurrentStep((s) => Math.min(3, s + 1))}
                                    className="flex items-center gap-2 bg-secondary text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-all cursor-pointer"
                                >
                                    Continue
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <Link
                                    href="/story-generator"
                                    className="flex items-center gap-2 bg-secondary text-white px-6 py-3 rounded-full font-medium hover:opacity-90 transition-all cursor-pointer"
                                >
                                    <Save className="w-5 h-5" />
                                    Save & Continue
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
