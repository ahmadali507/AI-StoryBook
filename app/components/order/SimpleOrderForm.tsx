"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import CharacterUploadList from "./CharacterUploadList";
import AgeRangeSelector from "./AgeRangeSelector";
import ThemeSelector from "./ThemeSelector";
import ArtStyleSelector from "./ArtStyleSelector";
import { useToast } from "@/providers/ToastProvider";
import type {
    SimpleCharacter,
    AgeRange,
    Theme,
    MVPArtStyle,
} from "@/types/storybook";
import {
    createBookOrder,
    addCharacterToOrder,
    uploadCharacterPhoto,
    generateCoverPreview,
} from "@/actions/order";
import { createOrderCheckoutSession } from "@/actions/stripe";

// Convert technical errors to user-friendly messages
function getFriendlyOrderErrorMessage(error: string): string {
    const errorLower = error.toLowerCase();

    if (errorLower.includes("upload") || errorLower.includes("photo")) {
        return "We had trouble with your photo. Please try uploading again.";
    }
    if (errorLower.includes("cover") || errorLower.includes("generate") || errorLower.includes("image")) {
        return "We couldn't create your cover right now. Please try again in a moment.";
    }
    if (errorLower.includes("checkout") || errorLower.includes("payment") || errorLower.includes("stripe")) {
        return "There was an issue with checkout. Please try again.";
    }
    if (errorLower.includes("network") || errorLower.includes("fetch") || errorLower.includes("timeout")) {
        return "Connection issue. Please check your internet and try again.";
    }

    return "Something went wrong. Please try again.";
}

const STEPS = [
    { id: 1, label: "Characters", description: "Add your characters" },
    { id: 2, label: "Settings", description: "Age, theme & style" },
    { id: 3, label: "Preview", description: "Review & purchase" },
];

export default function SimpleOrderForm() {
    const router = useRouter();
    const toast = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [characters, setCharacters] = useState<Partial<SimpleCharacter>[]>([
        {
            name: "",
            photoUrl: "",
            gender: "other",
            entityType: "human",
            role: "main",
        },
    ]);
    const [ageRange, setAgeRange] = useState<AgeRange | null>(null);
    const [theme, setTheme] = useState<Theme | null>(null);
    const [artStyle, setArtStyle] = useState<MVPArtStyle | null>(null);
    const [bookTitle, setBookTitle] = useState("");

    // Order state
    const [orderId, setOrderId] = useState<string | null>(null);
    const [coverUrl, setCoverUrl] = useState<string | null>(null);

    // Validation
    const isStep1Valid = characters.every(
        (c) => c.name && c.photoUrl && c.gender && c.entityType
    );
    const isStep2Valid = ageRange && theme && artStyle;
    const isStep3Valid = coverUrl !== null;

    const canProceed = () => {
        if (currentStep === 1) return isStep1Valid;
        if (currentStep === 2) return isStep2Valid;
        if (currentStep === 3) return isStep3Valid;
        return false;
    };

    // Photo upload handler
    const handlePhotoUpload = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("photo", file);

        const result = await uploadCharacterPhoto(formData);
        if (!result.success || !result.url) {
            throw new Error(result.error || "Failed to upload photo");
        }
        return result.url;
    };

    // Generate cover
    const handleGenerateCover = async () => {
        if (!ageRange || !theme || !artStyle) return;

        setIsLoading(true);
        setError(null);

        try {
            // Create order first
            const orderResult = await createBookOrder({
                ageRange,
                theme,
                artStyle,
                title: bookTitle || undefined,
            });

            if (!orderResult.success || !orderResult.orderId) {
                throw new Error(orderResult.error || "Failed to create order");
            }

            setOrderId(orderResult.orderId);

            // Add characters to order
            for (const char of characters) {
                if (char.name && char.photoUrl) {
                    await addCharacterToOrder({
                        orderId: orderResult.orderId,
                        name: char.name,
                        photoUrl: char.photoUrl,
                        gender: char.gender || "other",
                        entityType: char.entityType || "human",
                        role: char.role || "supporting",
                    });
                }
            }

            // Generate cover preview
            const coverResult = await generateCoverPreview(orderResult.orderId);
            if (!coverResult.success || !coverResult.coverUrl) {
                throw new Error(coverResult.error || "Failed to generate cover");
            }

            setCoverUrl(coverResult.coverUrl);
            setCurrentStep(3);
            toast.success("Your book cover looks amazing! 🎨");
        } catch (err) {
            const friendlyMessage = getFriendlyOrderErrorMessage(
                err instanceof Error ? err.message : "Something went wrong"
            );
            toast.error(friendlyMessage);
            setError(friendlyMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle purchase - redirect to Stripe
    const handlePurchase = async () => {
        if (!orderId) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await createOrderCheckoutSession(orderId);

            if (!result.success || !result.checkoutUrl) {
                throw new Error(result.error || "Failed to create checkout session");
            }

            // Redirect to Stripe Checkout
            window.location.href = result.checkoutUrl;
        } catch (err) {
            const friendlyMessage = getFriendlyOrderErrorMessage(
                err instanceof Error ? err.message : "Failed to start checkout"
            );
            toast.error(friendlyMessage);
            setError(friendlyMessage);
            setIsLoading(false);
        }
    };

    // Navigation
    const handleNext = () => {
        if (currentStep === 2) {
            handleGenerateCover();
        } else if (currentStep < 3 && canProceed()) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Progress Steps */}
                <div className="mb-12">
                    <div className="flex items-center justify-center">
                        {STEPS.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                {/* Step circle */}
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${currentStep > step.id
                                            ? "bg-primary text-white"
                                            : currentStep === step.id
                                                ? "bg-primary text-white shadow-lg shadow-primary/30"
                                                : "bg-gray-200 text-gray-400"
                                            }`}
                                    >
                                        {currentStep > step.id ? (
                                            <svg
                                                className="w-6 h-6"
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
                                        ) : (
                                            step.id
                                        )}
                                    </div>
                                    <div className="mt-2 text-center">
                                        <div
                                            className={`text-sm font-medium ${currentStep >= step.id
                                                ? "text-gray-900"
                                                : "text-gray-400"
                                                }`}
                                        >
                                            {step.label}
                                        </div>
                                        <div className="text-xs text-gray-400 hidden sm:block">
                                            {step.description}
                                        </div>
                                    </div>
                                </div>

                                {/* Connector line */}
                                {index < STEPS.length - 1 && (
                                    <div
                                        className={`w-16 sm:w-24 h-1 mx-4 rounded-full transition-colors duration-300 ${currentStep > step.id
                                            ? "bg-primary"
                                            : "bg-gray-200"
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
                        {error}
                    </div>
                )}

                {/* Step Content */}
                <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-10">
                    {/* Step 1: Characters */}
                    {currentStep === 1 && (
                        <CharacterUploadList
                            characters={characters}
                            onCharactersChange={setCharacters}
                            onPhotoUpload={handlePhotoUpload}
                        />
                    )}

                    {/* Step 2: Settings */}
                    {currentStep === 2 && (
                        <div className="space-y-10">
                            <AgeRangeSelector
                                selected={ageRange}
                                onSelect={setAgeRange}
                            />

                            <div className="border-t border-gray-100 pt-10">
                                <ThemeSelector
                                    selected={theme}
                                    onSelect={setTheme}
                                />
                            </div>

                            <div className="border-t border-gray-100 pt-10">
                                <ArtStyleSelector
                                    selected={artStyle}
                                    onSelect={setArtStyle}
                                />
                            </div>

                            {/* Optional title */}
                            <div className="border-t border-gray-100 pt-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                        <span className="text-lg">📖</span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            Book Title{" "}
                                            <span className="text-gray-400 font-normal">
                                                (optional)
                                            </span>
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            We&apos;ll create a magical title if you
                                            leave this blank
                                        </p>
                                    </div>
                                </div>
                                <input
                                    type="text"
                                    value={bookTitle}
                                    onChange={(e) => setBookTitle(e.target.value)}
                                    placeholder="e.g., Emma's Amazing Adventure"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Preview & Purchase */}
                    {currentStep === 3 && (
                        <div className="text-center">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Your Book Cover is Ready! 🎉
                                </h2>
                                <p className="text-gray-500">
                                    Review your personalized cover and complete
                                    your purchase
                                </p>
                            </div>

                            {/* Cover preview */}
                            <div className="max-w-sm mx-auto mb-8">
                                <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                    {coverUrl ? (
                                        <img
                                            src={coverUrl}
                                            alt="Book Cover"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-gray-400">
                                            Cover Preview
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Order summary */}
                            <div className="bg-gray-50 rounded-2xl p-6 max-w-md mx-auto mb-8">
                                <h3 className="font-semibold text-gray-900 mb-4">
                                    Order Summary
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">
                                            Characters
                                        </span>
                                        <span className="text-gray-900">
                                            {characters.filter((c) => c.name).length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">
                                            Age Range
                                        </span>
                                        <span className="text-gray-900">
                                            {ageRange}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Theme</span>
                                        <span className="text-gray-900 capitalize">
                                            {theme}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">
                                            Art Style
                                        </span>
                                        <span className="text-gray-900">
                                            {artStyle?.replace("-", " ")}
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-2 mt-2">
                                        <div className="flex justify-between font-bold">
                                            <span>Total</span>
                                            <span className="text-primary">
                                                $7.99
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handlePurchase}
                                disabled={isLoading}
                                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-full font-bold text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Redirecting to checkout...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Pay $7.99 - Generate My Book
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Navigation buttons */}
                <div className="mt-8 flex justify-between">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${currentStep === 1
                            ? "opacity-0 pointer-events-none"
                            : "text-gray-600 hover:bg-gray-100"
                            }`}
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Back
                    </button>

                    {currentStep < 3 && (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed() || isLoading}
                            className={`flex items-center gap-2 px-8 py-3 rounded-full font-semibold transition-all ${canProceed() && !isLoading
                                ? "bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-xl"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating...
                                </>
                            ) : currentStep === 2 ? (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Generate Cover
                                </>
                            ) : (
                                <>
                                    Next
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Mobile-friendly note */}
                <p className="mt-8 text-center text-xs text-gray-400">
                    🔒 Secure checkout powered by Stripe
                </p>
            </div>
        </div>
    );
}
