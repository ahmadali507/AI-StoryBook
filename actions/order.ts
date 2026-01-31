"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type OrderStatus =
    | "pending"
    | "paid"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded";

export type ProductType = "softcover" | "hardcover" | "premium";

export interface ShippingAddress {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
}

export interface Order {
    id: string;
    userId: string;
    storybookId: string;
    status: OrderStatus;
    productType: ProductType;
    quantity: number;
    unitPriceCents: number;
    shippingCents: number;
    taxCents: number;
    totalCents: number;
    currency: string;
    paymentProvider: string | null;
    paymentIntentId: string | null;
    paymentStatus: string;
    shippingAddress: ShippingAddress | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    podProvider: string | null;
    podOrderId: string | null;
    createdAt: Date;
    paidAt: Date | null;
    shippedAt: Date | null;
    deliveredAt: Date | null;
}

/**
 * Create a new order
 */
export async function createOrder(data: {
    storybookId: string;
    productType: ProductType;
    quantity: number;
    shippingAddress: ShippingAddress;
}): Promise<{ success: boolean; orderId?: string; error?: string }> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    // Calculate pricing (example - adjust based on your pricing model)
    const prices: Record<ProductType, number> = {
        softcover: 1999, // $19.99
        hardcover: 2999, // $29.99
        premium: 4999, // $49.99
    };

    const unitPriceCents = prices[data.productType];
    const shippingCents = 599; // $5.99 flat rate
    const subtotal = unitPriceCents * data.quantity + shippingCents;
    const taxCents = Math.round(subtotal * 0.08); // 8% tax
    const totalCents = subtotal + taxCents;

    const { data: order, error } = await supabase
        .from("orders")
        .insert({
            user_id: user.id,
            storybook_id: data.storybookId,
            product_type: data.productType,
            quantity: data.quantity,
            unit_price_cents: unitPriceCents,
            shipping_cents: shippingCents,
            tax_cents: taxCents,
            total_cents: totalCents,
            shipping_address: data.shippingAddress,
        })
        .select("id")
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, orderId: order.id };
}

/**
 * Get all orders for the current user
 */
export async function getOrders(): Promise<Order[]> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return [];
    }

    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

    if (error || !data) {
        return [];
    }

    return data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        storybookId: row.storybook_id,
        status: row.status as OrderStatus,
        productType: row.product_type as ProductType,
        quantity: row.quantity,
        unitPriceCents: row.unit_price_cents,
        shippingCents: row.shipping_cents,
        taxCents: row.tax_cents,
        totalCents: row.total_cents,
        currency: row.currency,
        paymentProvider: row.payment_provider,
        paymentIntentId: row.payment_intent_id,
        paymentStatus: row.payment_status,
        shippingAddress: row.shipping_address as ShippingAddress | null,
        trackingNumber: row.tracking_number,
        trackingUrl: row.tracking_url,
        podProvider: row.pod_provider,
        podOrderId: row.pod_order_id,
        createdAt: new Date(row.created_at),
        paidAt: row.paid_at ? new Date(row.paid_at) : null,
        shippedAt: row.shipped_at ? new Date(row.shipped_at) : null,
        deliveredAt: row.delivered_at ? new Date(row.delivered_at) : null,
    }));
}

/**
 * Get a single order by ID
 */
export async function getOrder(id: string): Promise<Order | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) {
        return null;
    }

    return {
        id: data.id,
        userId: data.user_id,
        storybookId: data.storybook_id,
        status: data.status as OrderStatus,
        productType: data.product_type as ProductType,
        quantity: data.quantity,
        unitPriceCents: data.unit_price_cents,
        shippingCents: data.shipping_cents,
        taxCents: data.tax_cents,
        totalCents: data.total_cents,
        currency: data.currency,
        paymentProvider: data.payment_provider,
        paymentIntentId: data.payment_intent_id,
        paymentStatus: data.payment_status,
        shippingAddress: data.shipping_address as ShippingAddress | null,
        trackingNumber: data.tracking_number,
        trackingUrl: data.tracking_url,
        podProvider: data.pod_provider,
        podOrderId: data.pod_order_id,
        createdAt: new Date(data.created_at),
        paidAt: data.paid_at ? new Date(data.paid_at) : null,
        shippedAt: data.shipped_at ? new Date(data.shipped_at) : null,
        deliveredAt: data.delivered_at ? new Date(data.delivered_at) : null,
    };
}

/**
 * Cancel an order (only if pending)
 */
export async function cancelOrder(
    id: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("orders")
        .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("status", "pending");

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/orders");
    return { success: true };
}

/**
 * Update order payment status (called after payment processing)
 */
export async function updateOrderPayment(
    orderId: string,
    paymentData: {
        paymentProvider: string;
        paymentIntentId: string;
        status: "paid" | "failed";
    }
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("orders")
        .update({
            payment_provider: paymentData.paymentProvider,
            payment_intent_id: paymentData.paymentIntentId,
            payment_status: paymentData.status,
            status: paymentData.status === "paid" ? "paid" : "pending",
            paid_at:
                paymentData.status === "paid"
                    ? new Date().toISOString()
                    : null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/orders");
    return { success: true };
}
