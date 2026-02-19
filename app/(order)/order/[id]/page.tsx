import Link from "next/link";
import { Loader2, CheckCircle2, BookOpen, FileText, ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { getOrderWithStorybook, triggerBookGeneration } from "@/actions/order";
import { verifyOrderPayment } from "@/actions/stripe";
import NavbarClient from "@/app/components/NavbarClient";
import OrderStatusListener from "@/app/components/order/OrderStatusListener";

interface OrderStatusPageProps {
    params: {
        id: string;
    };
    searchParams: {
        session_id?: string;
        paid?: string;
        [key: string]: string | string[] | undefined;
    };
}

export default async function OrderStatusPage({ params, searchParams }: OrderStatusPageProps) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;

    const orderId = resolvedParams.id;
    const sessionId = resolvedSearchParams?.session_id as string | undefined;
    const isPaidFromUrl = resolvedSearchParams?.paid === "true";

    // 1. Verify Payment if coming from Stripe
    let paymentError = null;
    if (isPaidFromUrl && sessionId) {
        try {
            const verification = await verifyOrderPayment(orderId, sessionId);
            if (!verification.success) {
                paymentError = verification.error || "Payment verification failed";
            }
        } catch (e) {
            console.error("[OrderStatusPage] Payment verification error:", e);
            paymentError = "Error verifying payment";
        }
    }

    // 2. Fetch Order Data
    let order = await getOrderWithStorybook(orderId);

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

    // 3. Auto-Trigger Generation if Paid but not Generating
    // This is safe because triggerBookGeneration handles idempotency
    let generationError = null;

    // Auto-trigger on page load is restored because we fixed the cross-talk issue.
    // The cross-talk fix prevents other tabs from refreshing and triggering this.
    // The time-window fix in triggerBookGeneration prevents double-triggers.
    if (order.status === "paid") {
        const genResult = await triggerBookGeneration(orderId);
        if (genResult.success) {
            // Optimistically fetch updated order to show "generating" state immediately
            // (or rely on `triggerBookGeneration` returning the new status if we modified it, but we didn't)
            // So we re-fetch.
            const updatedOrder = await getOrderWithStorybook(orderId);
            if (updatedOrder) order = updatedOrder;
        } else {
            generationError = genResult.error || "Failed to start generation";
        }
    }

    // Logic fix: Only show generating if status is specifically 'generating' or 'paid' 
    // AND NOT 'complete' or 'failed'. 
    // The previous logic `order.status === "generating" || order.status === "paid"` was okay, 
    // but if `triggerBookGeneration` finished quickly and set it to complete, we need to respect that.

    // We check for completion first to avoid TS narrowing issues
    const isComplete = order.status === "complete";
    const isGenerating = !isComplete && (order.status === "generating" || order.status === "paid");

    const statusMessage = isGenerating
        ? "Generating your personalized storybook..."
        : (order.status?.replace("_", " ") || "Pending");

    // Combine errors
    const error = paymentError || generationError;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5">
            <NavbarClient />

            {/* Realtime Listener for auto-refresh */}
            <OrderStatusListener
                orderId={orderId}
                storybookId={order.storybook?.id}
                initialStatus={order.status}
            />

            <main className="pt-24 pb-16">
                <div className="max-w-xl mx-auto px-4">
                    {error ? (
                        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                            <div className="text-red-500 mb-4">{error}</div>
                            <Link href="/create" className="text-primary hover:underline">
                                Try again or contact support
                            </Link>
                        </div>
                    ) : isGenerating ? (
                        /* Generating state */
                        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-6" />
                            <h1 className="text-2xl font-bold text-gray-900 mb-3">
                                {statusMessage}
                            </h1>
                            <p className="text-gray-500">
                                This may take a few minutes. You can close this page and come back later.
                            </p>
                        </div>
                    ) : order.status === "complete" ? (
                        /* Complete state */
                        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
                            <h1 className="text-2xl font-bold text-gray-900 mb-3">
                                Your Book is Ready! 🎉
                            </h1>
                            {order.storybook && (
                                <Link
                                    href={`/story/${order.storybook.id}`}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors mt-4"
                                >
                                    <BookOpen className="w-5 h-5" />
                                    Read Your Book
                                </Link>
                            )}
                        </div>
                    ) : (
                        /* Default / Other state */
                        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Order Status
                            </h1>
                            <p className="text-gray-500 capitalize mb-6">
                                {statusMessage}
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
