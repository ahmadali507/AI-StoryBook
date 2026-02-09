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
 * Get order with joined storybook data (for order status page)
 */
export async function getOrderWithStorybook(id: string): Promise<{
    id: string;
    status: string;
    storybookId: string;
    storybook?: {
        id: string;
        title: string;
        coverUrl: string | null;
        artStyle: string;
        theme: string;
        ageRange: string;
    };
} | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("orders")
        .select(`
            id,
            status,
            storybook_id,
            storybooks (
                id,
                title,
                cover_url,
                art_style,
                theme,
                age_range
            )
        `)
        .eq("id", id)
        .single();

    if (error || !data) {
        return null;
    }

    const storybook = data.storybooks as any;

    return {
        id: data.id,
        status: data.status,
        storybookId: data.storybook_id,
        storybook: storybook ? {
            id: storybook.id,
            title: storybook.title,
            coverUrl: storybook.cover_url,
            artStyle: storybook.art_style,
            theme: storybook.theme,
            ageRange: storybook.age_range,
        } : undefined,
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

// ============================================
// MVP ORDER FLOW FUNCTIONS
// ============================================

import type {
    SimpleCharacter,
    AgeRange,
    Theme,
    MVPArtStyle,
} from "@/types/storybook";

interface CreateBookOrderInput {
    ageRange: AgeRange;
    theme: Theme;
    artStyle: MVPArtStyle;
    title?: string;
}

/**
 * Create a book order for MVP flow (storybook + order in one step)
 * Requires user authentication
 */
export async function createBookOrder(
    data: CreateBookOrderInput
): Promise<{ success: boolean; orderId?: string; storybookId?: string; error?: string }> {
    const supabase = await createClient();

    let user;
    try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) {
            console.error("[createBookOrder] Auth error:", authError);
            // Check for network issues specifically
            if (authError.message?.includes("fetch") || authError.message?.includes("network")) {
                return { success: false, error: "Network error - please check your internet connection" };
            }
            return { success: false, error: "Authentication failed. Please log in." };
        }
        user = authData.user;
    } catch (error) {
        console.error("[createBookOrder] Auth check failed:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("timeout") || errorMessage.includes("fetch")) {
            return { success: false, error: "Connection timeout - please check your internet connection and try again" };
        }
        return { success: false, error: "Unable to verify authentication. Please try again." };
    }

    if (!user) {
        return { success: false, error: "Please log in to create a book order" };
    }

    try {
        // Create storybook first
        const { data: storybook, error: storybookError } = await supabase
            .from("storybooks")
            .insert({
                user_id: user.id,
                title: data.title || "My Personalized Story",
                art_style: data.artStyle,
                global_seed: Math.floor(Math.random() * 1000000),
                setting: "fantasy",
                theme: data.theme,
                age_range: data.ageRange,
                target_chapters: 12,
                status: "draft",
            })
            .select()
            .single();

        if (storybookError) {
            console.error("[createBookOrder] Storybook error:", storybookError);
            return { success: false, error: storybookError.message };
        }

        // Create order linked to storybook
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                user_id: user.id,
                storybook_id: storybook.id,
                status: "draft",
                product_type: "hardcover",
                quantity: 1,
                unit_price_cents: 2999,
                shipping_cents: 0,
                tax_cents: 0,
                total_cents: 2999,
                currency: "USD",
            })
            .select()
            .single();

        if (orderError) {
            console.error("[createBookOrder] Order error:", orderError);
            return { success: false, error: orderError.message };
        }

        return {
            success: true,
            orderId: order.id,
            storybookId: storybook.id,
        };
    } catch (error) {
        console.error("[createBookOrder] Unexpected error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to create order";
        if (errorMessage.includes("timeout") || errorMessage.includes("fetch")) {
            return { success: false, error: "Connection timeout - please check your internet connection" };
        }
        return { success: false, error: errorMessage };
    }
}

// ============================================
// CHARACTER MANAGEMENT (ORDER-BASED)
// ============================================

interface AddCharacterInput {
    orderId: string;
    name: string;
    photoUrl: string;
    gender: "male" | "female" | "other";
    entityType: "human" | "animal" | "object";
    role: "main" | "supporting";
}

export async function addCharacterToOrder(
    data: AddCharacterInput
): Promise<{ success: boolean; characterId?: string; error?: string }> {
    const supabase = await createClient();

    const { data: character, error } = await supabase
        .from("order_characters")
        .insert({
            order_id: data.orderId,
            name: data.name,
            photo_url: data.photoUrl,
            gender: data.gender,
            entity_type: data.entityType,
            role: data.role,
        })
        .select()
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, characterId: character.id };
}

export async function updateCharacterAvatar(
    characterId: string,
    avatarUrl: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("order_characters")
        .update({ ai_avatar_url: avatarUrl })
        .eq("id", characterId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function removeCharacterFromOrder(
    characterId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { error } = await supabase
        .from("order_characters")
        .delete()
        .eq("id", characterId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function getOrderCharacters(
    orderId: string
): Promise<SimpleCharacter[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("order_characters")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

    if (error || !data) {
        return [];
    }

    return data.map((char) => ({
        id: char.id,
        name: char.name,
        photoUrl: char.photo_url,
        aiAvatarUrl: char.ai_avatar_url,
        gender: char.gender,
        entityType: char.entity_type,
        role: char.role,
    }));
}
// ============================================
// PHOTO UPLOAD (Data URL - no bucket needed)
// ============================================

export async function uploadCharacterPhoto(
    formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: "Please log in to upload photos" };
    }

    const file = formData.get("photo") as File;
    if (!file) {
        return { success: false, error: "No file provided" };
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
        return {
            success: false,
            error: "Invalid file type. Please upload a JPEG, PNG, or WebP image.",
        };
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
        return { success: false, error: "File too large. Maximum size is 50MB." };
    }

    try {
        // Generate unique file path
        const fileExt = file.name.split('.').pop() || 'jpg';
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 15);
        const filePath = `${user.id}/characters/${timestamp}-${randomId}.${fileExt}`;

        // Convert File to ArrayBuffer for upload
        const arrayBuffer = await file.arrayBuffer();

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from("characters")
            .upload(filePath, arrayBuffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error("[uploadCharacterPhoto] Storage upload error:", uploadError);
            return { success: false, error: `Upload failed: ${uploadError.message}` };
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from("characters")
            .getPublicUrl(filePath);

        return { success: true, url: publicUrl };
    } catch (error) {
        console.error("[uploadCharacterPhoto] Error uploading file:", error);
        return { success: false, error: "Failed to upload image" };
    }
}

// ============================================
// COVER GENERATION
// ============================================

export async function generateCoverPreview(
    orderId: string
): Promise<{ success: boolean; coverUrl?: string; error?: string }> {
    const supabase = await createClient();

    // Get order details
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(
            `
            *,
            storybooks (
                id,
                title,
                art_style,
                theme,
                age_range,
                global_seed
            )
        `
        )
        .eq("id", orderId)
        .single();

    if (orderError || !order) {
        return { success: false, error: "Order not found" };
    }

    // Get characters
    const characters = await getOrderCharacters(orderId);
    if (characters.length === 0) {
        return { success: false, error: "At least one character is required" };
    }

    try {
        // Import Seedream
        const { generateBookCover } = await import("@/lib/replicate");

        // Build character descriptions for the prompt
        const mainChar = characters.find(c => c.role === "main") || characters[0];
        const charDescriptions = characters.map(c => {
            const genderDesc = c.gender === "male" ? "boy" : c.gender === "female" ? "girl" : "child";
            const typeDesc = c.entityType === "human" ? genderDesc : c.entityType;
            return `${c.name} (a friendly ${typeDesc})`;
        }).join(", ");

        // Art style mapping
        const artStylePrompts: Record<string, string> = {
            "pixar-3d": "Pixar style 3D cinematic scene, high quality 3D render, ultra detailed, global illumination",
            "storybook": "classic children's book illustration style, warm and inviting",
            // Legacy fallbacks
            "watercolor": "soft watercolor painting style, gentle colors, dreamy atmosphere",
            "digital-art": "vibrant digital art style, rich colors, polished illustration",
            "cartoon": "fun cartoon style, bold colors, expressive characters",
            "realistic": "detailed realistic illustration, lifelike characters",
            "anime": "anime-inspired illustration, expressive eyes, dynamic poses"
        };

        // Theme mapping
        const themePrompts: Record<string, string> = {
            "adventure": "exciting adventure scene, magical journey",
            "friendship": "heartwarming friendship moment, connection",
            "learning": "educational discovery, curious exploration",
            "fantasy": "magical fantasy world, enchanted setting",
            "nature": "beautiful natural scenery, outdoor adventure",
            "bedtime": "peaceful nighttime scene, cozy atmosphere"
        };

        const artStyle = order.storybooks?.art_style || "storybook";
        const theme = order.storybooks?.theme || "adventure";
        const title = order.storybooks?.title || `${mainChar.name}'s Adventure`;
        const seed = order.storybooks?.global_seed || Math.floor(Math.random() * 999999);

        // Generate AI Avatar if missing and photo is available
        const referenceImages: string[] = [];

        for (const char of characters) {
            if (char.aiAvatarUrl) {
                referenceImages.push(char.aiAvatarUrl);
            } else if (char.photoUrl) {
                console.log(`[generateCoverPreview] Generating avatar for ${char.name}...`);
                try {
                    // Import helper dynamically to avoid circular dependencies if any
                    const { generateAvatarFromPhoto } = await import("@/actions/character");

                    const avatarUrl = await generateAvatarFromPhoto(
                        char.photoUrl,
                        char.name,
                        char.gender,
                        char.entityType,
                        artStyle
                    );

                    // Save to DB (using the imported function from this file or character file?)
                    // Actually updateCharacterAvatar is exported from THIS file (actions/order.ts)
                    await updateCharacterAvatar(char.id!, avatarUrl);

                    // Update local object
                    char.aiAvatarUrl = avatarUrl;
                    referenceImages.push(avatarUrl);
                    console.log(`[generateCoverPreview] ✓ Avatar generated for ${char.name}`);
                } catch (err) {
                    console.error(`[generateCoverPreview] Failed to generate avatar for ${char.name}:`, err);
                    // Fallback to photo if avatar generation fails
                    referenceImages.push(char.photoUrl);
                }
            }
        }

        // Build the cover prompt
        const coverPrompt = `Children's book cover illustration featuring ${charDescriptions}. 
Title: "${title}". 
${themePrompts[theme] || "magical adventure"}. 
${artStylePrompts[artStyle] || "classic children's book illustration style"}.
Beautiful, colorful, engaging book cover for children, high quality illustration, 
professional children's book art, suitable for ages ${order.storybooks?.age_range || "3-6"}.`;

        const negativePrompt = "text, words, letters, typography, watermark, signature, scary, violent, dark themes, realistic human faces, photo-realistic, low quality, blurry";

        console.log(`[generateCoverPreview] Generating cover for order ${orderId}...`);
        console.log(`[generateCoverPreview] Prompt: ${coverPrompt.substring(0, 200)}...`);
        console.log(`[generateCoverPreview] Using ${referenceImages.length} reference images`);

        // Generate the cover with Seedream
        const coverUrl = await generateBookCover(coverPrompt, seed, negativePrompt, referenceImages);

        console.log(`[generateCoverPreview] ✓ Cover generated: ${coverUrl.substring(0, 50)}...`);

        // Update storybook with cover URL
        await supabase
            .from("storybooks")
            .update({ cover_url: coverUrl })
            .eq("id", order.storybooks.id);

        // Update order status
        await supabase
            .from("orders")
            .update({
                status: "cover_preview",
                cover_generated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

        revalidatePath(`/order/${orderId}`);

        return { success: true, coverUrl };
    } catch (error) {
        console.error("[generateCoverPreview] Error generating cover:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to generate cover";
        return { success: false, error: errorMessage };
    }
}

// ============================================
// BOOK GENERATION AFTER PAYMENT
// ============================================

export async function triggerBookGeneration(
    orderId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // First, check current status to prevent duplicate triggers
    const { data: currentOrder, error: fetchError } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

    if (fetchError) {
        return { success: false, error: fetchError.message };
    }

    // If already generating or complete, don't trigger again
    if (currentOrder?.status === "generating") {
        console.log(`[triggerBookGeneration] Order ${orderId} is already generating, skipping duplicate trigger`);
        return { success: true }; // Return success since generation is in progress
    }

    if (currentOrder?.status === "complete") {
        console.log(`[triggerBookGeneration] Order ${orderId} is already complete`);
        return { success: true };
    }

    // Update status to generating
    const { error } = await supabase
        .from("orders")
        .update({
            status: "generating",
            book_generation_started_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        // Only update if status allows (prevents race condition)
        .in("status", ["paid", "pending", "cover_preview"]);

    if (error) {
        return { success: false, error: error.message };
    }

    // Import and call the book generation pipeline
    // Note: In production, this should be offloaded to a background job/edge function
    // to avoid blocking the request
    const { generateFullBook } = await import("@/actions/book-generation");

    // Start generation asynchronously (don't await - let it run in background)
    generateFullBook(orderId)
        .then(result => {
            if (!result.success) {
                console.error(`Book generation failed for order ${orderId}:`, result.error);
            } else {
                console.log(`Book generation completed for order ${orderId}`);
            }
        })
        .catch(err => {
            console.error(`Book generation error for order ${orderId}:`, err);
        });

    console.log(`Book generation triggered for order: ${orderId}`);
    return { success: true };
}

// ============================================
// STORY TEMPLATES
// ============================================

export async function getStoryTemplates(
    ageRange?: AgeRange,
    theme?: Theme
): Promise<any[]> {
    const supabase = await createClient();

    let query = supabase
        .from("story_templates")
        .select("*")
        .eq("is_active", true);

    if (ageRange) {
        query = query.eq("age_range", ageRange);
    }

    if (theme) {
        query = query.eq("theme", theme);
    }

    const { data, error } = await query;

    if (error || !data) {
        return [];
    }

    return data;
}

// ============================================
// COMPLETE ORDER WITH PAYMENT
// ============================================

export async function completeOrderWithPayment(
    orderId: string,
    paymentIntentId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // Update order with payment info
    const { error } = await supabase
        .from("orders")
        .update({
            status: "paid",
            payment_status: "paid",
            payment_provider: "stripe",
            payment_intent_id: paymentIntentId,
            paid_at: new Date().toISOString(),
        })
        .eq("id", orderId);

    if (error) {
        return { success: false, error: error.message };
    }

    // Trigger full book generation (async)
    await triggerBookGeneration(orderId);

    revalidatePath(`/order/${orderId}`);
    return { success: true };
}

