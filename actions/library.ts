"use server";

import { createClient } from "@/lib/supabase/server";

// Interface for stored content (matching book-generation.ts)
export interface BookPage {
    pageNumber: number;
    type: 'cover' | 'title' | 'story' | 'end' | 'back';
    text?: string;
    illustrationUrl?: string;
    sceneNumber?: number;
}

export interface GeneratedBook {
    title: string;
    dedication: string;
    pages: BookPage[];
    pdfUrl?: string;
}

// New page-based reader interface
export interface PageBasedStory {
    title: string;
    author?: string;
    coverImageUrl?: string;
    dedication?: string;
    pages: BookPage[];
}

/**
 * Get all orders for the current user
 */
export async function getUserOrders() {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error("Not authenticated");
    }

    const { data: orders, error } = await supabase
        .from("orders")
        .select(`
            id,
            created_at,
            status,
            storybooks (
                id,
                title,
                cover_url
            )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    return orders;
}

/**
 * Get a specific storybook formatted for the BookReader (page-based)
 */
export async function getBookForReader(storyId: string): Promise<PageBasedStory | null> {
    const supabase = await createClient();

    // Fetch storybook with content
    const { data: storybook, error } = await supabase
        .from("storybooks")
        .select("*")
        .eq("id", storyId)
        .single();

    if (error || !storybook) {
        return null;
    }

    // Access the 'content' JSONB column
    const bookContent = storybook.content as GeneratedBook;

    if (!bookContent || !bookContent.pages) {
        return null;
    }

    // Return pages directly for page-based rendering
    return {
        title: storybook.title || bookContent.title || "Untitled Story",
        author: "AI Storybook",
        coverImageUrl: storybook.cover_url,
        dedication: bookContent.dedication,
        pages: bookContent.pages
    };
}

/**
 * Get order ID from story ID (helper for redirection if needed)
 */
export async function getOrderIdFromStoryId(storyId: string): Promise<string | null> {
    const supabase = await createClient();

    const { data } = await supabase
        .from("orders")
        .select("id")
        .eq("storybook_id", storyId)
        .single();

    return data?.id || null;
}
