"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// Types — aligned with the actual `profiles` table columns
// ─────────────────────────────────────────────────────────────────────────────

export interface Profile {
    id: string;
    email: string | null;
    fullName: string | null;
    avatarUrl: string | null;
    subscriptionTier: "free" | "basic" | "premium";
    storiesCreated: number;
    charactersCreated: number;
    preferredArtStyle: string | null;
    emailNotifications: boolean;
    createdAt: string; // ISO string — safe to pass across server/client
    updatedAt: string;
    totalOrders: number;
}

export interface UpdateProfileInput {
    fullName: string;
    avatarUrl: string | null;
    preferredArtStyle: string;
    emailNotifications: boolean;
}

export interface ActionResult {
    success: boolean;
    error?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a profile by user id + total order count.
 * Used by the /profile/[id] SSR page.
 */
export async function getProfileById(userId: string): Promise<Profile | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error || !data) {
        return null;
    }

    // Count orders for this user
    const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

    return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        avatarUrl: data.avatar_url,
        subscriptionTier: data.subscription_tier ?? "free",
        storiesCreated: data.stories_created ?? 0,
        charactersCreated: data.characters_created ?? 0,
        preferredArtStyle: data.preferred_art_style,
        emailNotifications: data.email_notifications ?? true,
        createdAt: data.created_at ?? new Date().toISOString(),
        updatedAt: data.updated_at ?? new Date().toISOString(),
        totalOrders: count ?? 0,
    };
}

/**
 * Get the currently authenticated user's profile.
 * Used in places that don't have a userId param.
 */
export async function getProfile(): Promise<Profile | null> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    return getProfileById(user.id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update the authenticated user's own profile.
 * Called via TanStack useMutation from the client.
 */
export async function updateProfileAction(
    input: UpdateProfileInput
): Promise<ActionResult> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
        .from("profiles")
        .update({
            full_name: input.fullName,
            avatar_url: input.avatarUrl,
            preferred_art_style: input.preferredArtStyle || null,
            email_notifications: input.emailNotifications,
            updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath(`/profile/${user.id}`);
    return { success: true };
}

/**
 * Permanently delete the authenticated user's account.
 * profile row cascades via FK on auth.users delete.
 */
export async function deleteAccountAction(): Promise<ActionResult> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase.auth.admin.deleteUser(user.id);

    if (error) {
        return { success: false, error: error.message };
    }

    redirect("/");
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers (used by other parts of the app)
// ─────────────────────────────────────────────────────────────────────────────

export async function updateProfile(data: {
    fullName?: string;
    avatarUrl?: string;
    preferredArtStyle?: string;
    emailNotifications?: boolean;
}): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
        .from("profiles")
        .update({
            full_name: data.fullName,
            avatar_url: data.avatarUrl,
            preferred_art_style: data.preferredArtStyle,
            email_notifications: data.emailNotifications,
            updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath(`/profile/${user.id}`);
    return { success: true };
}

export async function incrementStoryCount(): Promise<void> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.rpc("increment_stories_created", { user_id: user.id });
}

export async function incrementCharacterCount(): Promise<void> {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.rpc("increment_characters_created", { user_id: user.id });
}
