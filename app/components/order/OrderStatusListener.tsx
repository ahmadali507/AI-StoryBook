"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/providers/ToastProvider";

export default function OrderStatusListener({
    orderId,
    storybookId,

    initialStatus
}: {
    orderId: string;
    storybookId?: string;
    initialStatus: string;
}) {
    const router = useRouter();
    const toast = useToast();
    const supabase = createClient();

    useEffect(() => {
        // Clear local storage form data as we are now tracking a live order
        if (typeof window !== 'undefined') {
            localStorage.removeItem("story_order_form_data");
        }

        // If already complete, no need to listen (unless we want to handle edge cases, but usually fine)
        if (initialStatus === 'complete' || initialStatus === 'failed') return;

        console.log(`[OrderStatusListener] Subscribing to updates for order ${orderId} (storybook: ${storybookId || 'none'})`);

        // We listen to BOTH orders and storybooks tables to be safe
        // 1. Listen to ORDERS table (status changes)
        // 2. Listen to STORYBOOKS table (cover url, pages updates) - if replication adds status here too or triggers revalidation

        const channel = supabase
            .channel(`order-status-${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderId}`
                },
                (payload) => {
                    // Strict check to prevent cross-talk
                    if (payload.new.id !== orderId) return;

                    const newStatus = payload.new.status;
                    console.log(`[OrderStatusListener] Orders table update: ${newStatus}`);

                    // Critical: if status becomes complete, we MUST refresh to show the book
                    if (newStatus === 'complete' || newStatus !== initialStatus) {
                        console.log(`[OrderStatusListener] Status changed to ${newStatus}, refreshing...`);
                        router.refresh();
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[OrderStatusListener] Connected to orders updates`);
                }
            });

        let sbChannel: any = null;
        if (storybookId) {
            sbChannel = supabase
                .channel(`storybook-updates-${storybookId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'storybooks',
                        filter: `id=eq.${storybookId}`
                    },
                    (payload) => {
                        const newStatus = payload.new.status;
                        console.log(`[OrderStatusListener] Storybook table update: ${newStatus}`);

                        // User request: "when both show complete". 
                        // The listener ensures we refresh the page when the storybook marks itself complete.
                        // The Page component will then fetch both statuses and verify they are complete.
                        if (newStatus === 'complete') {
                            console.log(`[OrderStatusListener] Storybook is complete! Refreshing...`);
                            router.refresh();
                        } else {
                            // Also refresh on other progress (like cover_url update)
                            router.refresh();
                        }
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log(`[OrderStatusListener] Connected to storybook updates`);
                    }
                });
        }

        return () => {
            supabase.removeChannel(channel);
            if (sbChannel) supabase.removeChannel(sbChannel);
        };
    }, [orderId, storybookId, initialStatus, router, supabase, toast]);

    return null;
}
