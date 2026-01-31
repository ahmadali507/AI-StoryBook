"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Get the current user's profile
 */
export async function getProfile(): Promise<Profile | null> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (error || !data) {
        return null;
    }

    return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        avatarUrl: data.avatar_url,
        subscriptionTier: data.subscription_tier,
        storiesCreated: data.stories_created,
        charactersCreated: data.characters_created,
        preferredArtStyle: data.preferred_art_style,
        emailNotifications: data.email_notifications,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
    };
}

/**
 * Update the current user's profile
 */
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

    revalidatePath("/settings");
    return { success: true };
}

/**
 * Increment story count for user
 */
export async function incrementStoryCount(): Promise<void> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.rpc("increment_stories_created", { user_id: user.id });
}

/**
 * Increment character count for user
 */
export async function incrementCharacterCount(): Promise<void> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.rpc("increment_characters_created", { user_id: user.id });
}
