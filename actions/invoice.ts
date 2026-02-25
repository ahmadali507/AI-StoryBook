"use server";

import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import type {
    InvoiceData,
    InvoiceSupplier,
    InvoiceCustomer,
    InvoiceLineItem,
    InvoicePaymentInfo,
} from "@/types/invoice";

// ─── Stripe client ─────────────────────────────────────────────────────────
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-01-28.clover",
});

// ─── Hardcoded supplier details (AI Kids Books) ────────────────────────────
const SUPPLIER: InvoiceSupplier = {
    name: "Jan Drobčinský",
    street: "Ulice 123",
    city: "110 00 Prague",
    country: "Czech Republic",
    companyId: "07692374",
    email: "support@aikidsbooks.com",
    website: "www.aikidsbooks.com",
};

// ─── Helper: format cents to display string (keeps decimals) ───────────────
function formatPrice(cents: number, currency: string): string {
    const upper = currency.toUpperCase();
    const amount = cents / 100;
    // Show decimals only if there's a fractional part
    const formatted = amount % 1 === 0 ? amount.toString() : amount.toFixed(2);
    return `${formatted} ${upper}`;
}

// ─── Helper: format date for invoice display ───────────────────────────────
function formatInvoiceDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

// ─── Helper: generate invoice number from order ────────────────────────────
function generateInvoiceNumber(orderId: string, createdAt: Date): string {
    const year = createdAt.getFullYear();
    const shortId = orderId.replace(/-/g, "").slice(0, 4).toUpperCase();
    return `${year}-${shortId}`;
}

// ─── Helper: generate order display ID ─────────────────────────────────────
function generateOrderDisplayId(orderId: string, createdAt: Date): string {
    const year = createdAt.getFullYear();
    const shortId = orderId.replace(/-/g, "").slice(0, 4).toUpperCase();
    return `ORD-${year}-${shortId}`;
}

// ─── Helper: capitalise payment method type ────────────────────────────────
function formatPaymentMethodType(type: string): string {
    const map: Record<string, string> = {
        card: "Credit card",
        sepa_debit: "SEPA Direct Debit",
        ideal: "iDEAL",
        bancontact: "Bancontact",
        sofort: "Sofort",
        giropay: "Giropay",
        eps: "EPS",
        p24: "Przelewy24",
    };
    return map[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

// ─── Shape for all data retrieved from Stripe ──────────────────────────────
interface StripeInvoiceDetails {
    // Customer billing info
    customerName: string;
    customerEmail: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;

    // Line items from Stripe checkout session
    lineItems: Array<{
        description: string;
        quantity: number;
        unitAmountCents: number;
        totalAmountCents: number;
    }>;

    // Totals
    subtotalCents: number;
    totalCents: number;
    currency: string;

    // Payment info
    paymentMethodType: string;
    paidAt: Date;
}

// ─── Supabase row shape for the joined query ───────────────────────────────
interface OrderRow {
    id: string;
    status: string;
    stripe_session_id: string | null;
    payment_intent_id: string | null;
    payment_provider: string | null;
    paid_at: string | null;
    created_at: string;
    storybooks: {
        title: string;
    } | null;
}

/**
 * Retrieve ALL invoice-relevant data from the Stripe checkout session:
 * line items (description, qty, unit price, total), totals, currency,
 * customer billing details, payment method, and timestamp.
 */
async function getStripeInvoiceDetails(
    stripeSessionId: string | null,
    paymentIntentId: string | null
): Promise<StripeInvoiceDetails | null> {
    // ── Primary path: checkout session ──────────────────────────────────
    if (stripeSessionId) {
        try {
            // Retrieve the session with expanded payment data
            const session = await stripe.checkout.sessions.retrieve(
                stripeSessionId,
                { expand: ["payment_intent", "payment_intent.payment_method"] }
            );

            // Retrieve line items separately (they require a list call)
            const lineItemsResponse = await stripe.checkout.sessions.listLineItems(
                stripeSessionId,
                { limit: 100 }
            );

            const paymentIntent = session.payment_intent as Stripe.PaymentIntent | null;
            const paymentMethod = paymentIntent?.payment_method as Stripe.PaymentMethod | null;
            const customerDetails = session.customer_details;

            // Map Stripe line items
            const lineItems = lineItemsResponse.data.map((item) => ({
                description: item.description || "AI-generated personalized children's book",
                quantity: item.quantity || 1,
                unitAmountCents: item.price?.unit_amount || 0,
                totalAmountCents: item.amount_total || 0,
            }));

            return {
                customerName: customerDetails?.name || "",
                customerEmail: customerDetails?.email || "",
                addressLine1: customerDetails?.address?.line1 || "",
                addressLine2: customerDetails?.address?.line2 || "",
                city: customerDetails?.address?.city || "",
                state: customerDetails?.address?.state || "",
                postalCode: customerDetails?.address?.postal_code || "",
                country: customerDetails?.address?.country || "",

                lineItems,

                subtotalCents: session.amount_subtotal || 0,
                totalCents: session.amount_total || 0,
                currency: session.currency || "usd",

                paymentMethodType: paymentMethod?.type || "card",
                paidAt: paymentIntent?.created
                    ? new Date(paymentIntent.created * 1000)
                    : new Date(),
            };
        } catch (err) {
            console.error("[getStripeInvoiceDetails] Session retrieval failed:", err);
        }
    }

    // ── Fallback: payment intent only ───────────────────────────────────
    if (paymentIntentId) {
        try {
            const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
                expand: ["payment_method"],
            });

            const pm = pi.payment_method as Stripe.PaymentMethod | null;
            const totalCents = pi.amount_received || pi.amount || 0;

            return {
                customerName: pm?.billing_details?.name || "",
                customerEmail: pm?.billing_details?.email || "",
                addressLine1: pm?.billing_details?.address?.line1 || "",
                addressLine2: pm?.billing_details?.address?.line2 || "",
                city: pm?.billing_details?.address?.city || "",
                state: pm?.billing_details?.address?.state || "",
                postalCode: pm?.billing_details?.address?.postal_code || "",
                country: pm?.billing_details?.address?.country || "",

                // When we only have payment intent, create a single line item from the total
                lineItems: [{
                    description: "AI-generated personalized children's book",
                    quantity: 1,
                    unitAmountCents: totalCents,
                    totalAmountCents: totalCents,
                }],

                subtotalCents: totalCents,
                totalCents,
                currency: pi.currency || "usd",

                paymentMethodType: pm?.type || "card",
                paidAt: new Date(pi.created * 1000),
            };
        } catch (err) {
            console.error("[getStripeInvoiceDetails] PaymentIntent retrieval failed:", err);
        }
    }

    return null;
}

/**
 * Fetch all data needed to render a downloadable invoice PDF.
 *
 * ALL pricing, line items, currency, customer billing, and payment method
 * data comes directly from the Stripe API. The local DB is only used for:
 * - order ownership verification (user_id)
 * - order status check (invoiceable?)
 * - storybook title (for a nicer description fallback)
 * - profile full_name (fallback if Stripe has no customer name)
 *
 * Returns null if the order is not found, not owned by the caller,
 * or has not been paid yet.
 */
export async function getInvoiceData(
    orderId: string
): Promise<InvoiceData | null> {
    const supabase = await createClient();

    // ── 1. Authenticate ────────────────────────────────────────────────
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return null;
    }

    // ── 2. Fetch order (minimal — just for auth & Stripe IDs) ──────────
    const { data: rawOrder, error: orderError } = await supabase
        .from("orders")
        .select(
            `
            id,
            status,
            stripe_session_id,
            payment_intent_id,
            payment_provider,
            paid_at,
            created_at,
            storybooks (
                title
            )
        `
        )
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single();

    if (orderError || !rawOrder) {
        return null;
    }

    const order = rawOrder as unknown as OrderRow;

    // Only paid/post-paid statuses can generate an invoice
    const invoiceableStatuses = [
        "paid",
        "generating",
        "complete",
        "processing",
        "shipped",
        "delivered",
    ];
    if (!invoiceableStatuses.includes(order.status)) {
        return null;
    }

    // ── 3. Fetch ALL pricing + customer data from Stripe ────────────────
    const stripeData = await getStripeInvoiceDetails(
        order.stripe_session_id,
        order.payment_intent_id
    );

    if (!stripeData) {
        console.error(`[getInvoiceData] Could not retrieve Stripe data for order ${orderId}`);
        return null;
    }

    // ── 4. Fetch user profile as fallback for customer name ─────────────
    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

    // ── 5. Build invoice from Stripe data ───────────────────────────────
    const createdAt = new Date(order.created_at);
    const paidAt = stripeData.paidAt;
    const currency = stripeData.currency;

    // Book title from DB (for nicer line item description)
    const bookTitle =
        (order.storybooks as { title: string } | null)?.title || null;

    // Customer: all from Stripe billing details
    const customerName = stripeData.customerName
        || profile?.full_name
        || user.email?.split("@")[0]
        || "Customer";

    const customerEmail = stripeData.customerEmail || user.email || "";

    const addressParts: string[] = [];
    if (stripeData.addressLine1) addressParts.push(stripeData.addressLine1);
    if (stripeData.addressLine2) addressParts.push(stripeData.addressLine2);

    const cityParts: string[] = [];
    if (stripeData.postalCode) cityParts.push(stripeData.postalCode);
    if (stripeData.city) cityParts.push(stripeData.city);
    if (stripeData.state) cityParts.push(stripeData.state);

    const customer: InvoiceCustomer = {
        name: customerName,
        street: addressParts.join(", "),
        city: cityParts.join(" "),
        country: stripeData.country,
        email: customerEmail,
    };

    // Line items: ALL from Stripe
    const lineItems: InvoiceLineItem[] = stripeData.lineItems.map((item) => {
        // Enhance description with book title if Stripe's description is generic
        const description = bookTitle
            ? `AI-generated personalized children's book – "${bookTitle}"`
            : item.description;

        return {
            description,
            quantity: item.quantity,
            unitPrice: formatPrice(item.unitAmountCents, currency),
            total: formatPrice(item.totalAmountCents, currency),
        };
    });

    // Payment method: from Stripe
    const paymentMethodLabel = `${formatPaymentMethodType(stripeData.paymentMethodType)} (Stripe)`;

    const payment: InvoicePaymentInfo = {
        method: paymentMethodLabel,
        orderId: generateOrderDisplayId(order.id, createdAt),
        paidOn: formatInvoiceDate(paidAt),
    };

    const invoiceData: InvoiceData = {
        invoiceNumber: generateInvoiceNumber(order.id, createdAt),
        issueDate: formatInvoiceDate(paidAt),
        supplyDate: formatInvoiceDate(paidAt),
        dueDate: formatInvoiceDate(paidAt),

        supplier: SUPPLIER,
        customer,

        lineItems,

        // ALL totals from Stripe
        subtotal: formatPrice(stripeData.subtotalCents, currency),
        vatRate: "0%",
        vatAmount: formatPrice(0, currency),
        totalAmountDue: formatPrice(stripeData.totalCents, currency),

        currency,
        payment,
    };

    return invoiceData;
}
