"use server";

import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-01-28.clover",
});

// Price for book generation in cents
const BOOK_GENERATION_PRICE_CENTS = 799; // $7.99

/**
 * Get the base URL for the application
 * Prioritizes NEXT_PUBLIC_APP_URL, then specific production URL, then VERCEL_URL, then localhost
 */
function getBaseUrl(): string {
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }

    // Hardcode production URL as requested to ensure it works in production
    if (process.env.NODE_ENV === 'production') {
        return 'https://ai-story-book-gray.vercel.app';
    }

    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }

    return 'http://localhost:3000';
}

interface CreateCheckoutResult {
    success: boolean;
    checkoutUrl?: string;
    sessionId?: string;
    error?: string;
}

/**
 * Create a Stripe Checkout session for book generation
 * Redirects user to Stripe hosted checkout page
 */
export async function createCheckoutSession(
    storybookId: string
): Promise<CreateCheckoutResult> {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { success: false, error: "Not authenticated" };
    }

    // Get storybook details
    const { data: storybook, error: sbError } = await supabase
        .from("storybooks")
        .select("id, title, cover_url, payment_status")
        .eq("id", storybookId)
        .eq("user_id", user.id)
        .single();

    if (sbError || !storybook) {
        return { success: false, error: "Storybook not found" };
    }

    // Check if already paid
    if (storybook.payment_status === "paid") {
        return { success: false, error: "Already paid" };
    }

    try {
        // Determine base URL
        const baseUrl = getBaseUrl();

        // Create Stripe Checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            customer_email: user.email,
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "AI Storybook Generation",
                            description: `Generate "${storybook.title || "Your Story"}" - Full illustrated storybook`,
                            images: storybook.cover_url ? [storybook.cover_url] : [],
                        },
                        unit_amount: BOOK_GENERATION_PRICE_CENTS,
                    },
                    quantity: 1,
                },
            ],
            success_url: `${baseUrl}/generate?storybookId=${storybookId}&session_id={CHECKOUT_SESSION_ID}&paid=true`,
            cancel_url: `${baseUrl}/generate?storybookId=${storybookId}&cancelled=true`,
            metadata: {
                storybookId,
                userId: user.id,
            },
        });

        // Update storybook with session ID and pending status
        await supabase
            .from("storybooks")
            .update({
                stripe_session_id: session.id,
                payment_status: "pending",
            })
            .eq("id", storybookId);

        return {
            success: true,
            checkoutUrl: session.url!,
            sessionId: session.id,
        };
    } catch (error) {
        console.error("[createCheckoutSession] Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create checkout session",
        };
    }
}

/**
 * Verify a checkout session was paid (called from success page)
 */
export async function verifyPayment(
    storybookId: string,
    sessionId: string
): Promise<{ success: boolean; paid: boolean; error?: string }> {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { success: false, paid: false, error: "Not authenticated" };
    }

    try {
        // Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Verify this session belongs to the storybook
        if (session.metadata?.storybookId !== storybookId) {
            return { success: false, paid: false, error: "Session mismatch" };
        }

        // Check payment status
        const paid = session.payment_status === "paid";

        if (paid) {
            // Update storybook payment status
            await supabase
                .from("storybooks")
                .update({
                    payment_status: "paid",
                    paid_at: new Date().toISOString(),
                })
                .eq("id", storybookId)
                .eq("user_id", user.id);
        }

        return { success: true, paid };
    } catch (error) {
        console.error("[verifyPayment] Error:", error);
        return {
            success: false,
            paid: false,
            error: error instanceof Error ? error.message : "Failed to verify payment",
        };
    }
}

/**
 * Get payment status for a storybook
 */
export async function getPaymentStatus(
    storybookId: string
): Promise<{ status: string; paidAt: string | null }> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("storybooks")
        .select("payment_status, paid_at")
        .eq("id", storybookId)
        .single();

    if (error || !data) {
        return { status: "unknown", paidAt: null };
    }

    return {
        status: data.payment_status || "unpaid",
        paidAt: data.paid_at,
    };
}

/**
 * Create a Stripe Checkout session for an order
 * Used by SimpleOrderForm flow
 */
export async function createOrderCheckoutSession(
    orderId: string
): Promise<CreateCheckoutResult> {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { success: false, error: "Not authenticated" };
    }

    // Get order with storybook details
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(`
            id,
            status,
            storybooks (
                id,
                title,
                cover_url
            )
        `)
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single();

    if (orderError || !order) {
        return { success: false, error: "Order not found" };
    }

    // Check if already paid
    if (order.status === "paid" || order.status === "generating" || order.status === "complete") {
        return { success: false, error: "Order already paid" };
    }

    const storybook = order.storybooks as any;

    try {
        // Determine base URL
        const baseUrl = getBaseUrl();

        // Create Stripe Checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            customer_email: user.email,
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: "AI Storybook Generation",
                            description: `"${storybook?.title || "Your Story"}" - Full illustrated storybook`,
                            images: storybook?.cover_url ? [storybook.cover_url] : [],
                        },
                        unit_amount: BOOK_GENERATION_PRICE_CENTS,
                    },
                    quantity: 1,
                },
            ],
            success_url: `${baseUrl}/order/${orderId}?session_id={CHECKOUT_SESSION_ID}&paid=true`,
            cancel_url: `${baseUrl}/create?orderId=${orderId}&cancelled=true`,
            metadata: {
                orderId,
                storybookId: storybook?.id,
                userId: user.id,
            },
        });

        // Update order with session ID and pending status
        await supabase
            .from("orders")
            .update({
                stripe_session_id: session.id,
                status: "pending",
            })
            .eq("id", orderId);

        return {
            success: true,
            checkoutUrl: session.url!,
            sessionId: session.id,
        };
    } catch (error) {
        console.error("[createOrderCheckoutSession] Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create checkout session",
        };
    }
}

/**
 * Verify payment for an order and update status
 * Called when user returns from Stripe Checkout
 */
export async function verifyOrderPayment(
    orderId: string,
    sessionId: string
): Promise<{ success: boolean; paid: boolean; error?: string }> {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { success: false, paid: false, error: "Not authenticated" };
    }

    try {
        // Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Verify this session belongs to the order
        if (session.metadata?.orderId !== orderId) {
            return { success: false, paid: false, error: "Session mismatch" };
        }

        // Check payment status
        const paid = session.payment_status === "paid";

        if (paid) {
            // CRITICAL FIX: Check current status first to prevent resetting "generating" or "complete"
            const { data: currentOrder } = await supabase
                .from("orders")
                .select("status")
                .eq("id", orderId)
                .single();

            // If already paid or further along, DO NOT update status again
            // This prevents "paid=true" query param from resetting state on refresh
            if (currentOrder && (
                currentOrder.status === "paid" ||
                currentOrder.status === "generating" ||
                currentOrder.status === "complete" ||
                currentOrder.status === "processing" ||
                currentOrder.status === "shipped" ||
                currentOrder.status === "delivered"
            )) {
                console.log(`[verifyOrderPayment] Order ${orderId} already in status ${currentOrder.status}. Skipping update.`);
                return { success: true, paid: true };
            }

            // Update order payment status
            await supabase
                .from("orders")
                .update({
                    status: "paid",
                    paid_at: new Date().toISOString(),
                    payment_provider: "stripe",
                    payment_intent_id: session.payment_intent as string,
                })
                .eq("id", orderId)
                .eq("user_id", user.id);
        }

        return { success: true, paid };
    } catch (error) {
        console.error("[verifyOrderPayment] Error:", error);
        return {
            success: false,
            paid: false,
            error: error instanceof Error ? error.message : "Failed to verify payment",
        };
    }
}


