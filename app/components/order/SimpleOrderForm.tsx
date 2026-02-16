'use client'
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, Sparkles, Check, Trash2 } from "lucide-react";
import CharacterUploadList from "./CharacterUploadList";
import StorySettingsForm from "./StorySettingsForm";
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
    { id: 1, label: "Characters", description: "Add your stars" },
    { id: 2, label: "Story Details", description: "Theme & Style" },
    { id: 3, label: "Review", description: "Ready to print" },
];

export const STORAGE_KEY = "story_order_form_data";

export default function SimpleOrderForm() {
    const router = useRouter();
    const toast = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

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
    const [subject, setSubject] = useState<string | null>(null);
    const [artStyle, setArtStyle] = useState<MVPArtStyle | null>(null);
    const [bookTitle, setBookTitle] = useState("");
    const [description, setDescription] = useState("");

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (savedData) {
                const parsed = JSON.parse(savedData);

                if (parsed.characters && Array.isArray(parsed.characters)) setCharacters(parsed.characters);
                if (parsed.ageRange) setAgeRange(parsed.ageRange);
                if (parsed.theme) setTheme(parsed.theme);
                if (parsed.subject) setSubject(parsed.subject);
                if (parsed.artStyle) setArtStyle(parsed.artStyle);
                if (parsed.bookTitle) setBookTitle(parsed.bookTitle);
                if (parsed.description) setDescription(parsed.description);
                // We intentionally don't restore currentStep to let user start from check characters if they reload
                // But user requested "data vaporises", restoring step might be expected behavior
                if (parsed.currentStep) setCurrentStep(parsed.currentStep);
            }
        } catch (error) {
            console.error("Failed to load form data:", error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        if (!isLoaded) return; // Don't save empty default state before loading

        const dataToSave = {
            characters,
            ageRange,
            theme,
            subject,
            artStyle,
            bookTitle,
            description,
            currentStep
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }, [characters, ageRange, theme, subject, artStyle, bookTitle, description, currentStep, isLoaded]);

    const clearForm = () => {
        if (confirm("Are you sure you want to clear all data and start over?")) {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
        }
    };

    // Order state
    const [orderId, setOrderId] = useState<string | null>(null);
    const [coverUrl, setCoverUrl] = useState<string | null>(null);

    // Validation - at least 1 character complete, and any started characters must be complete
    const filledCharacters = characters.filter(c => c.name || c.photoUrl);
    const isStep1Valid = filledCharacters.length > 0 && filledCharacters.every(
        (c) => c.name && c.photoUrl && c.gender && c.entityType
    );
    const isStep2Valid = ageRange && theme && subject && artStyle;
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
            // Combine subject and description if provided
            const fullDescription = subject && subject !== 'custom'
                ? `Subject: ${subject}. ${description}`
                : description;

            // Create order first
            const orderResult = await createBookOrder({
                ageRange,
                theme,
                artStyle,
                title: bookTitle || undefined,
                description: fullDescription || undefined,
            });

            if (!orderResult.success || !orderResult.orderId) {
                throw new Error(orderResult.error || "Failed to create order");
            }

            setOrderId(orderResult.orderId);

            // Add characters to order
            let addedCount = 0;
            for (const char of characters) {
                if (char.name && char.photoUrl) {
                    console.log(`[SimpleOrderForm] Adding character: ${char.name}`);
                    const result = await addCharacterToOrder({
                        orderId: orderResult.orderId,
                        name: char.name,
                        photoUrl: char.photoUrl,
                        gender: char.gender || "other",
                        entityType: char.entityType || "human",
                        role: char.role || "supporting",
                        clothingStyle: char.clothingStyle,
                        description: char.description,
                        storyRole: char.storyRole,
                        useFixedClothing: char.useFixedClothing,
                    });

                    if (!result.success) {
                        console.error(`[SimpleOrderForm] Failed to add character ${char.name}:`, result.error);
                        throw new Error(`Failed to save character ${char.name}: ${result.error}`);
                    }
                    addedCount++;
                } else {
                    console.warn(`[SimpleOrderForm] Skipping incomplete character:`, char);
                }
            }

            if (addedCount === 0) {
                throw new Error("No valid characters were found to add to the order.");
            }

            // Generate cover preview
            const coverResult = await generateCoverPreview(orderResult.orderId);
            if (!coverResult.success || !coverResult.coverUrl) {
                throw new Error(coverResult.error || "Failed to generate cover");
            }

            setCoverUrl(coverResult.coverUrl);
            setCurrentStep(3);
            toast.success("Your book cover looks amazing! 🎨");
        } catch (err: any) {
            console.error("[SimpleOrderForm] Generate Cover Error:", err);
            // Log full details if available
            if (err.message) console.error("[SimpleOrderForm] Error Message:", err.message);
            if (err.stack) console.error("[SimpleOrderForm] Error Stack:", err.stack);

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
        // Replaced outer container div with Fragment since layout handles the background
        <>
            <div className="max-w-5xl mx-auto px-4">
                {/* Progress Steps */}
                <div className="mb-8 lg:mb-12">
                    <div className="flex items-center justify-center relative">
                        {STEPS.map((step, index) => (
                            <div key={step.id} className="flex items-center relative z-10">
                                {/* Step circle */}
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 shadow-md ${currentStep >= step.id
                                            ? "bg-gradient-to-r from-primary to-primary-light text-white ring-4 ring-primary/20"
                                            : "bg-white text-gray-300 border-2 border-gray-100"
                                            }`}
                                    >
                                        {currentStep > step.id ? (
                                            <Check className="w-6 h-6" />
                                        ) : (
                                            <span>{step.id}</span>
                                        )}
                                    </div>
                                    <div className="mt-3 text-center">
                                        <div
                                            className={`text-sm font-semibold transition-colors duration-300 ${currentStep >= step.id
                                                ? "text-primary-dark"
                                                : "text-gray-400"
                                                }`}
                                        >
                                            {step.label}
                                        </div>
                                    </div>
                                </div>

                                {/* Connector line */}
                                {index < STEPS.length - 1 && (
                                    <div
                                        className={`w-16 sm:w-24 lg:w-32 h-[3px] mx-2 -mt-6 rounded-full transition-all duration-500 relative ${currentStep > step.id
                                            ? "bg-primary-light"
                                            : "bg-gray-100"
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 border border-white/50 p-6 sm:p-10 lg:p-12 overflow-hidden relative">
                    {/* Decorative top gradient line */}
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-purple-400 to-pink-400 opacity-80" />

                    {!isLoaded ? (
                        <div className="flex items-center justify-center min-h-[300px]">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Error message */}
                            {error && (
                                <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    {error}
                                </div>
                            )}

                            {/* Step Content */}
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Step 1: Characters */}
                                {currentStep === 1 && (
                                    <div className="space-y-6">
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                                            <div className="text-center sm:text-left">
                                                <h2 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-2">
                                                    Who is this story for?
                                                </h2>
                                                <p className="text-gray-500 text-lg">
                                                    Upload a photo to transform them into a character.
                                                </p>
                                            </div>
                                            <button
                                                onClick={clearForm}
                                                className="text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 flex items-center gap-2 transition-all px-4 py-2 rounded-full shadow-sm hover:shadow-md"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Reset Form
                                            </button>
                                        </div>
                                        <CharacterUploadList
                                            characters={characters}
                                            onCharactersChange={setCharacters}
                                            onPhotoUpload={handlePhotoUpload}
                                            maxCharacters={3}
                                        />
                                    </div>
                                )}

                                {/* Step 2: Settings */}
                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        <div className="relative text-center mb-8">
                                            <button
                                                onClick={handleBack}
                                                className="absolute left-0 top-0 sm:top-1/2 sm:-translate-y-1/2 p-2 rounded-full hover:bg-gray-100 text-slate-400 hover:text-slate-600 transition-colors"
                                                aria-label="Go back"
                                            >
                                                <ChevronLeft className="w-6 h-6" />
                                            </button>
                                            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-3">
                                                Craft your world
                                            </h2>
                                            <p className="text-gray-500 text-lg">
                                                Choose the perfect theme and style for your adventure.
                                            </p>
                                        </div>
                                        <StorySettingsForm
                                            ageRange={ageRange}
                                            setAgeRange={setAgeRange}
                                            theme={theme}
                                            setTheme={setTheme}
                                            subject={subject}
                                            setSubject={setSubject}
                                            artStyle={artStyle}
                                            setArtStyle={setArtStyle}
                                            title={bookTitle}
                                            setTitle={setBookTitle}
                                            description={description}
                                            setDescription={setDescription}
                                        />
                                    </div>
                                )}

                                {/* Step 3: Preview & Purchase */}
                                {currentStep === 3 && (
                                    <div className="text-center max-w-2xl mx-auto">
                                        <div className="mb-8">
                                            <div className="inline-flex items-center justify-center p-3 bg-green-100 text-green-600 rounded-full mb-4">
                                                <Sparkles className="w-6 h-6" />
                                            </div>
                                            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-3">
                                                Your Book Cover is Ready!
                                            </h2>
                                            <p className="text-gray-500 text-lg">
                                                This is just a preview. The full story will be generated magically after purchase.
                                            </p>
                                        </div>

                                        {/* Cover preview */}
                                        <div className="relative group mx-auto mb-10 w-full max-w-sm perspective-1000">
                                            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl bg-gray-100 relative transform transition-transform duration-500 group-hover:rotate-y-12 preserve-3d">
                                                {coverUrl ? (
                                                    <img
                                                        src={coverUrl}
                                                        alt="Book Cover"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-slate-50">
                                                        <div className="w-16 h-16 mb-4 rounded-full bg-slate-100" />
                                                        <p>Cover Preview</p>
                                                    </div>
                                                )}
                                                {/* Shine effect */}
                                                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* Order summary card */}
                                        <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-100 mb-8 backdrop-blur-sm">
                                            <h3 className="font-heading font-semibold text-gray-900 mb-4 flex items-center justify-center gap-2">
                                                Order Summary
                                            </h3>
                                            <div className="space-y-3 text-sm">
                                                <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                                                    <span className="text-gray-500">Characters</span>
                                                    <span className="font-medium text-gray-900 bg-white px-2 py-1 rounded shadow-sm">
                                                        {characters.filter((c) => c.name).length}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                                                    <span className="text-gray-500">Age Group</span>
                                                    <span className="font-medium text-gray-900 bg-white px-2 py-1 rounded shadow-sm">{ageRange}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b border-gray-200/50">
                                                    <span className="text-gray-500">Theme</span>
                                                    <span className="font-medium text-gray-900 capitalize bg-white px-2 py-1 rounded shadow-sm">
                                                        {theme}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center pt-2">
                                                    <span className="font-bold text-gray-900 text-lg">Total</span>
                                                    <span className="font-heading font-bold text-2xl text-primary">
                                                        $7.99
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handlePurchase}
                                            disabled={isLoading}
                                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full font-bold text-lg shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Redirecting...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
                                                    Pay $7.99 & Generate Book
                                                </>
                                            )}
                                        </button>
                                        <p className="mt-4 text-xs text-gray-400 flex items-center justify-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-green-500" />
                                            Secure checkout powered by Stripe
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Navigation buttons */}
                <div className="mt-8 flex justify-between items-center px-2">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${currentStep === 1 || currentStep === 2
                            ? "opacity-0 pointer-events-none"
                            : "text-gray-500 hover:text-gray-800 hover:bg-white/50"
                            }`}
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Back
                    </button>

                    {currentStep < 3 && (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed() || isLoading}
                            className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold transition-all shadow-lg ${canProceed() && !isLoading
                                ? "bg-gray-900 text-white hover:bg-gray-800 hover:shadow-xl hover:-translate-y-0.5"
                                : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processing...
                                </>
                            ) : currentStep === 2 ? (
                                <>
                                    <Sparkles className="w-5 h-5 text-indigo-300" />
                                    Generate Cover
                                </>
                            ) : (
                                <>
                                    Next Step
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div >
        </>
    );
}
