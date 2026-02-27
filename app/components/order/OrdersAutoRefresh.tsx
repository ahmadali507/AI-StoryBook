"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface OrdersAutoRefreshProps {
    /** Whether any orders are currently in a "generating" or "paid" state */
    hasInProgressOrders: boolean;
    /** Polling interval in ms (default: 5000) */
    intervalMs?: number;
}

/**
 * Invisible client component that polls for order updates when
 * there are in-progress orders. Calls router.refresh() to force
 * the server component to re-fetch data from Supabase.
 */
export default function OrdersAutoRefresh({
    hasInProgressOrders,
    intervalMs = 5000,
}: OrdersAutoRefreshProps) {
    const router = useRouter();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!hasInProgressOrders) {
            // No in-progress orders — stop polling
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Start polling: refresh server component data periodically
        intervalRef.current = setInterval(() => {
            router.refresh();
        }, intervalMs);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [hasInProgressOrders, intervalMs, router]);

    // Render nothing — this is a behavior-only component
    return null;
}
