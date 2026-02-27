"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createOrderCheckoutSession } from "@/actions/stripe";

interface OrderCheckoutButtonProps {
    orderId: string;
    className?: string;
}

export default function OrderCheckoutButton({ orderId, className = "" }: OrderCheckoutButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleCheckout = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (loading) return;
        setLoading(true);

        try {
            const result = await createOrderCheckoutSession(orderId);

            if (result.success && result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            } else {
                alert(result.error || "Failed to initiate checkout");
                setLoading(false);
            }
        } catch (error) {
            console.error("Checkout error:", error);
            alert("An unexpected error occurred.");
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleCheckout}
            disabled={loading}
            className={`flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed ${className}`}
        >
            {loading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redirecting...
                </>
            ) : (
                "Pay to Generate"
            )}
        </button>
    );
}
