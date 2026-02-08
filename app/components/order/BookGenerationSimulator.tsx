"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Download, CheckCircle, AlertCircle } from "lucide-react";
import { getDetailedGenerationProgress, type GenerationProgress } from "@/actions/book-generation";
import Link from "next/link";

interface BookGenerationSimulatorProps {
    orderId: string;
    onComplete?: () => void;
    bookTitle?: string;
    coverUrl?: string;
}

export default function BookGenerationSimulator({
    orderId,
    onComplete,
    bookTitle = "Your Magical Story",
    coverUrl
}: BookGenerationSimulatorProps) {
    const [progressData, setProgressData] = useState<GenerationProgress | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isComplete, setIsComplete] = useState(false);

    // Polling ref to stop polling when complete
    const stopPolling = useRef(false);

    // Initial load and polling
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const checkProgress = async () => {
            if (stopPolling.current) return;

            try {
                const result = await getDetailedGenerationProgress(orderId);

                if (result.status === 'failed') {
                    setError("Book generation failed. Please contact support.");
                    stopPolling.current = true;
                    return;
                }

                if (result.progress) {
                    setProgressData(result.progress);

                    if (result.status === 'complete' || result.progress.stage === 'complete') {
                        setIsComplete(true);
                        stopPolling.current = true;
                        onComplete?.();
                    }
                }
            } catch (err) {
                console.error("Failed to poll progress:", err);
            }

            if (!stopPolling.current) {
                timeoutId = setTimeout(checkProgress, 2000); // Poll every 2 seconds
            }
        };

        checkProgress();

        return () => {
            stopPolling.current = true;
            clearTimeout(timeoutId);
        };
    }, [orderId, onComplete]);

    if (error) {
        return (
            <div className="w-full max-w-md mx-auto bg-red-50 rounded-xl p-6 text-center border border-red-100">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <h3 className="font-semibold text-red-700 mb-1">Something went wrong</h3>
                <p className="text-sm text-red-600 mb-4">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50 text-sm font-medium"
                >
                    Try Refreshing
                </button>
            </div>
        );
    }

    if (isComplete) {
        return (
            <div className="w-full max-w-md mx-auto text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75" />
                    <div className="relative bg-green-100 p-4 rounded-full">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Book Ready!</h2>
                    <p className="text-gray-500">Your story has been magically created.</p>
                </div>

                {coverUrl && (
                    <div className="w-32 mx-auto rounded-lg shadow-lg overflow-hidden border border-gray-100 rotate-1 hover:rotate-0 transition-transform duration-300">
                        <img src={coverUrl} alt="Book Cover" className="w-full h-auto" />
                    </div>
                )}

                <div className="pt-2">
                    <p className="text-sm text-gray-400 mb-2">Check your email for the download link</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto text-center py-12">
            <div className="relative flex justify-center mb-8">
                {/* Spinner */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>

                {/* Inner Icon or Logo could go here */}
                <div className="w-20 h-20 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-pulse" />
                </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Creating Your Book...
            </h3>

            <p className="text-gray-500 min-h-[1.5em] animate-pulse">
                {progressData?.message || "Preparing magic..."}
            </p>

            {/* Optional Small Progress Bar */}
            <div className="mt-8 max-w-xs mx-auto">
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${progressData?.stageProgress || 5}%` }}
                    />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                    {progressData?.stage === 'payment' ? 'Processing...' :
                        progressData?.stage === 'outline' ? 'Step 1 of 5: Story Outline' :
                            progressData?.stage === 'narrative' ? 'Step 2 of 5: Writing Story' :
                                progressData?.stage === 'cover' ? 'Step 3 of 5: Designing Cover' :
                                    progressData?.stage === 'illustrations' ? 'Step 4 of 5: Illustrating' :
                                        progressData?.stage === 'layout' ? 'Step 5 of 5: Final Layout' : 'Finalizing...'}
                </p>
            </div>
        </div>
    );
}
