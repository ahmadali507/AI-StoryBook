"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export interface AuthResult {
    success: boolean;
    error?: string;
    redirectTo?: string;
    requiresEmailConfirmation?: boolean;
}

export interface User {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
}

/**
 * Sign up with email and password
 */
export async function signUp(data: {
    email: string;
    password: string;
    name: string;
}): Promise<AuthResult> {
    const supabase = await createClient();

    const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
            data: {
                full_name: data.name,
            },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        },
    });

    if (error) {
        return { success: false, error: error.message };
    }

    // Supabase returns an empty identities array if the user already exists
    if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
        return { success: false, error: "already registered" };
    }

    // Default to requiring email confirmation
    return { success: true, requiresEmailConfirmation: true };
}

/**
 * Sign in with email and password
 */
export async function signIn(data: {
    email: string;
    password: string;
}): Promise<AuthResult> {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true, redirectTo: "/create" };
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<AuthResult> {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        },
    });

    if (error) {
        return { success: false, error: error.message };
    }

    if (data.url) {
        redirect(data.url);
    }

    return { success: true };
}

/**
 * Sign out
 */
export async function signOut(): Promise<AuthResult> {
    const supabase = await createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true, redirectTo: "/" };
}

/**
 * Reset password (send reset email)
 */
export async function resetPassword(email: string): Promise<AuthResult> {
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

/**
 * Update password (after reset)
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, redirectTo: "/login" };
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
    const supabase = await createClient();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        return null;
    }

    return {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name,
        avatarUrl: user.user_metadata?.avatar_url,
    };
}

/**
 * Update user profile
 */
export async function updateProfile(data: {
    name?: string;
    avatarUrl?: string;
}): Promise<AuthResult> {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
        data: {
            full_name: data.name,
            avatar_url: data.avatarUrl,
        },
    });

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/", "layout");
    return { success: true };
}
