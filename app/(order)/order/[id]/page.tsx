"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, BookOpen, FileText, ArrowRight, AlertCircle, FileDown } from "lucide-react";
import { getOrderWithStorybook, triggerBookGeneration } from "@/actions/order";
import { verifyOrderPayment } from "@/actions/stripe";
import NavbarClient from "@/app/components/NavbarClient";
import { useToast } from "@/providers/ToastProvider";
import { STORAGE_KEY } from "@/app/components/order/SimpleOrderForm";

export default function OrderStatusPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const toast = useToast();
    const orderId = params.id as string;

    // Use refs to track across re-renders (but these reset on page refresh - that's OK)
    const isProcessing = useRef(false);

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState("Loading...");
    const [error, setError] = useState<string | null>(null);

    // Check for payment params (from Stripe redirect)
    const sessionId = searchParams.get("session_id");
    const isPaidFromUrl = searchParams.get("paid") === "true";

    // Load order data
    const loadOrder = useCallback(async () => {
        try {
            const orderData = await getOrderWithStorybook(orderId);
            setOrder(orderData);
            return orderData;
        } catch (err) {
            console.error("[OrderPage] Failed to load order:", err);
            return null;
        }
    }, [orderId]);

    // Initial load and payment verification
    useEffect(() => {
        const init = async () => {
            // Prevent concurrent processing
            if (isProcessing.current) return;
            isProcessing.current = true;

            try {
                const orderData = await loadOrder();
                setLoading(false);

                if (!orderData) {
                    setError("Order not found");
                    isProcessing.current = false;
                    return;
                }

                console.log("[OrderPage] Order status:", orderData.status);

                // Handle based on DATABASE status (source of truth)
                switch (orderData.status) {
                    case "complete":
                        // Book is ready - redirect to story
                        localStorage.removeItem(STORAGE_KEY);
                        setStatusMessage("Your book is ready!");
                        if (orderData.storybook?.id) {
                            toast.success("Your book is ready! Enjoy reading! 📚");
                            router.push(`/story/${orderData.storybook.id}`);
                        }
                        break;

                    case "generating":
                        // Already generating - just show status and poll
                        // DO NOT trigger again - generation is already in progress
                        localStorage.removeItem(STORAGE_KEY);
                        setStatusMessage("Generating your personalized storybook...");
                        break;

                    case "paid":
                        // Paid but generation not started yet - trigger it
                        localStorage.removeItem(STORAGE_KEY);
                        setStatusMessage("Starting book generation...");
                        // Only show this toast once if we just came from payment
                        if (isPaidFromUrl) {
                            toast.success("Payment verified! Starting generation... 🚀");
                        }

                        const genResult = await triggerBookGeneration(orderId);
                        if (genResult.success) {
                            setStatusMessage("Generating your personalized storybook...");
                        } else {
                            const errorMsg = "Failed to start generation";
                            setError(genResult.error || errorMsg);
                            toast.error("We couldn't start generating your book. Please contact support.");
                        }
                        break;

                    case "failed":
                        // Generation failed
                        setError("Generation failed. Please contact support.");
                        toast.error("Something went wrong with generation. We're looking into it.");
                        break;

                    default:
                        // Other statuses (draft, cover_preview, pending) - check if we need to verify payment
                        if (isPaidFromUrl && sessionId) {
                            setStatusMessage("Verifying payment...");
                            try {
                                const result = await verifyOrderPayment(orderId, sessionId);
                                if (result.success && result.paid) {
                                    localStorage.removeItem(STORAGE_KEY);
                                    setStatusMessage("Starting book generation...");
                                    toast.success("Payment successful! Creating your book... ✨");

                                    const genResult = await triggerBookGeneration(orderId);
                                    if (genResult.success) {
                                        setStatusMessage("Generating your personalized storybook...");
                                        // Reload to get updated status
                                        await loadOrder();
                                    } else {
                                        const errorMsg = "Failed to start generation";
                                        setError(genResult.error || errorMsg);
                                        toast.error("Payment verified, but we couldn't start generation. Please contact support.");
                                    }
                                } else {
                                    const errorMsg = result.error || "Payment verification failed";
                                    setError(errorMsg);
                                    toast.error("We couldn't verify your payment. Please contact support.");
                                }
                            } catch (err) {
                                console.error("[OrderPage] Payment verification error:", err);
                                setError("Error verifying payment");
                                toast.error("Something went wrong verifying your payment. Please try again.");
                            }
                        } else {
                            setStatusMessage(`Order status: ${orderData.status?.replace("_", " ") || "Pending"}`);
                        }
                        break;
                }
            } finally {
                isProcessing.current = false;
            }
        };

        init();
    }, [orderId, sessionId, isPaidFromUrl, router, loadOrder]);

    // Poll for completion when generating
    useEffect(() => {
        // Only poll if status is generating or paid
        const shouldPoll = order?.status === "generating" || order?.status === "paid";

        if (!shouldPoll || loading) return;

        console.log("[OrderPage] Starting poll, current status:", order?.status);

        const interval = setInterval(async () => {
            try {
                const orderData = await loadOrder();
                console.log("[OrderPage] Poll - status:", orderData?.status);

                if (orderData?.status === "complete") {
                    console.log("[OrderPage] Generation complete! Redirecting...");
                    setStatusMessage("Your book is ready!");
                    toast.success("Your book is ready! Enjoy reading! 📚");
                    clearInterval(interval);

                    if (orderData.storybook?.id) {
                        setTimeout(() => {
                            router.push(`/story/${orderData.storybook?.id}`);
                        }, 1500);
                    }
                } else if (orderData?.status === "failed") {
                    console.log("[OrderPage] Generation failed");
                    setError("Generation failed. Please contact support.");
                    clearInterval(interval);
                }
            } catch (err) {
                console.error("[OrderPage] Poll error:", err);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [order?.status, loading, loadOrder, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <NavbarClient />
                <div className="flex items-center justify-center min-h-[80vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-background">
                <NavbarClient />
                <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
                    <p className="text-red-500 mb-4">Order not found</p>
                    <Link href="/create" className="text-primary hover:underline">
                        Create a new book
                    </Link>
                </div>
            </div>
        );
    }

    // Check if currently generating based on database status
    const isGenerating = order.status === "generating" || order.status === "paid";

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5">
            <NavbarClient />
            <main className="pt-24 pb-16">
                <div className="max-w-xl mx-auto px-4">
                    {error ? (
                        <div className="bg-white rounded-2xl shadow-xl p-8 text-center relative pt-16 mt-8">
                            <Link
                                href="/orders"
                                className="absolute top-4 left-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                <ArrowRight className="w-4 h-4 rotate-180" />
                                Back to Orders
                            </Link>
                            <div className="text-red-500 mb-4">{error}</div>
                            <Link href="/create" className="text-primary hover:underline">
                                Try again
                            </Link>
                        </div>
                    ) : isGenerating ? (
                        /* Simple generating state */
                        <div className="bg-white rounded-2xl shadow-xl p-12 text-center relative pt-16 mt-8">
                            <Link
                                href="/orders"
                                className="absolute top-4 left-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                <ArrowRight className="w-4 h-4 rotate-180" />
                                Back to Orders
                            </Link>
                            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-6" />
                            <h1 className="text-2xl font-bold text-gray-900 mb-3">
                                {statusMessage}
                            </h1>
                            <p className="text-gray-500 mb-6">
                                This may take a few minutes. You can close this page and come back later.
                            </p>
                            <a
                                href={`/api/invoice/${orderId}`}
                                download
                                className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:border-primary hover:text-primary transition-colors text-sm"
                            >
                                <FileDown className="w-4 h-4" />
                                Download Invoice
                            </a>
                        </div>
                    ) : order.status === "complete" ? (
                        /* Complete state */
                        <div className="bg-white rounded-2xl shadow-xl p-12 text-center relative pt-16 mt-8">
                            <Link
                                href="/orders"
                                className="absolute top-4 left-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                <ArrowRight className="w-4 h-4 rotate-180" />
                                Back to Orders
                            </Link>
                            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
                            <h1 className="text-2xl font-bold text-gray-900 mb-3">
                                Your Book is Ready! 🎉
                            </h1>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
                                {order.storybook && (
                                    <Link
                                        href={`/story/${order.storybook.id}`}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                                    >
                                        <BookOpen className="w-5 h-5" />
                                        Read Your Book
                                    </Link>
                                )}
                                <a
                                    href={`/api/invoice/${orderId}`}
                                    download
                                    className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:border-primary hover:text-primary transition-colors text-sm"
                                >
                                    <FileDown className="w-4 h-4" />
                                    Download Invoice
                                </a>
                            </div>
                        </div>
                    ) : (
                        /* Default state */
                        <div className="bg-white rounded-2xl shadow-xl p-8 text-center relative pt-16 mt-8">
                            <Link
                                href="/orders"
                                className="absolute top-4 left-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                <ArrowRight className="w-4 h-4 rotate-180" />
                                Back to Orders
                            </Link>
                            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Order Status
                            </h1>
                            <p className="text-gray-500 capitalize mb-6">
                                {order.status?.replace("_", " ") || "Pending"}
                            </p>
                            {order.status === "cover_preview" && (
                                <Link
                                    href="/create"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                                >
                                    Continue Order
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

