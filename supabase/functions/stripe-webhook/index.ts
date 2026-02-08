// Stripe webhook handler for Supabase Edge Function
// Handles checkout.session.completed events to trigger book generation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.4.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
    apiVersion: "2026-01-28.clover",
    httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

// Initialize Supabase client with service role key for admin access
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
    // Only allow POST
    if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
        return new Response("Missing signature", { status: 400 });
    }

    try {
        const body = await req.text();

        // Verify webhook signature
        const event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret
        );

        console.log(`[stripe-webhook] Received event: ${event.type}`);

        // Handle checkout.session.completed
        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;

            const storybookId = session.metadata?.storybookId;

            if (!storybookId) {
                console.error("[stripe-webhook] No storybookId in session metadata");
                return new Response("Missing storybookId", { status: 400 });
            }

            console.log(`[stripe-webhook] Payment completed for storybook: ${storybookId}`);

            // Update storybook payment status and trigger generation
            const { error: updateError } = await supabase
                .from("storybooks")
                .update({
                    payment_status: "paid",
                    paid_at: new Date().toISOString(),
                    status: "generating", // This triggers generation
                })
                .eq("id", storybookId);

            if (updateError) {
                console.error("[stripe-webhook] Failed to update storybook:", updateError);
                return new Response("Database update failed", { status: 500 });
            }

            console.log(`[stripe-webhook] ✓ Storybook ${storybookId} marked as paid and generating`);
        }

        // Handle checkout.session.expired (optional)
        if (event.type === "checkout.session.expired") {
            const session = event.data.object as Stripe.Checkout.Session;
            const storybookId = session.metadata?.storybookId;

            if (storybookId) {
                await supabase
                    .from("storybooks")
                    .update({ payment_status: "failed" })
                    .eq("id", storybookId);

                console.log(`[stripe-webhook] Checkout expired for storybook: ${storybookId}`);
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("[stripe-webhook] Error:", err);
        return new Response(
            `Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`,
            { status: 400 }
        );
    }
});
