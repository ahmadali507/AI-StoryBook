"use server";

import { createClient } from "@/lib/supabase/server";

// Interfaces for BookReader
interface BookChapter {
    title: string;
    content: string;
    illustrationUrl?: string;
    illustrationPrompt?: string;
}

interface ReaderStory {
    title: string;
    author?: string;
    coverImageUrl?: string;
    chapters: BookChapter[];
}

// Interface for stored content (matching book-generation.ts)
interface BookPage {
    pageNumber: number;
    type: 'cover' | 'title' | 'story' | 'end' | 'back';
    text?: string;
    illustrationUrl?: string;
    sceneNumber?: number;
}

interface GeneratedBook {
    title: string;
    dedication: string;
    pages: BookPage[];
    pdfUrl?: string;
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
 * Get a specific storybook formatted for the BookReader
 */
export async function getBookForReader(storyId: string): Promise<ReaderStory | null> {
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

    // Transform pages into chapters for BookReader
    const chapters: BookChapter[] = bookContent.pages
        .filter(page => page.type === 'story')
        .map((page, index) => ({
            title: `Chapter ${index + 1}`, // Or use Scene Number
            content: page.text || "",
            illustrationUrl: page.illustrationUrl
        }));

    return {
        title: storybook.title || "Untitled Story",
        author: "AI Storybook", // Could be user's name if we had it
        coverImageUrl: storybook.cover_url,
        chapters
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
