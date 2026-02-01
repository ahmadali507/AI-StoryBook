
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    ChevronLeft,
    Share2,
    Settings,
    ShoppingCart
} from "lucide-react";
import BookReader from "@/app/components/story/BookReader";
import { createClient } from "@/lib/supabase/client";

export default function StoryViewer() {
    const params = useParams();
    const id = params?.id as string;
    const [story, setStory] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchStory = async () => {
            if (!id) return;

            try {
                const { data, error } = await supabase
                    .from("storybooks")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (error) {
                    console.error("Error fetching story:", error);
                } else {
                    // Start with default structure
                    let storyData: {
                        title: string;
                        author: string;
                        chapters: any[];
                        coverImageUrl?: string;
                    } = {
                        title: data.title,
                        author: "AI Storybook", // Could fetch user name if needed
                        chapters: [],
                        coverImageUrl: undefined
                    };

                    // If content exists, use it
                    if (data.content) {
                        try {
                            const content = typeof data.content === 'string'
                                ? JSON.parse(data.content)
                                : data.content;

                            storyData = { ...storyData, ...content, coverImageUrl: data.cover_image_url };
                        } catch (e) {
                            console.error("Error parsing story content:", e);
                        }
                    } else if (data.cover_image_url) {
                        storyData = { ...storyData, coverImageUrl: data.cover_image_url };
                    }

                    setStory(storyData);
                }
            } catch (err) {
                console.error("Unexpected error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStory();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!story) {
        return (
            <div className="min-h-screen bg-[#F5F0E6] flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold text-stone-800">Story not found</h1>
                <Link
                    href="/library"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Back to Library
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F0E6] flex flex-col">
            {/* Top Toolbar */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/library"
                                className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                <span className="hidden sm:inline font-medium">Back to Library</span>
                            </Link>
                            <div className="h-6 w-px bg-stone-200" />
                            <h1 className="font-heading text-lg font-bold text-stone-800 truncate max-w-[200px] sm:max-w-none">
                                {story.title}
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                href="/order"
                                className="flex items-center gap-2 bg-amber-700 text-white px-4 py-2 rounded-full font-semibold hover:bg-amber-800 transition-all cursor-pointer shadow-sm text-sm"
                            >
                                <ShoppingCart className="w-4 h-4" />
                                <span className="hidden sm:inline">Order Print</span>
                            </Link>
                            <button
                                className="p-2 rounded-full hover:bg-stone-100 transition-colors cursor-pointer text-stone-600"
                                aria-label="Share"
                            >
                                <Share2 className="w-5 h-5" />
                            </button>
                            <button
                                className="p-2 rounded-full hover:bg-stone-100 transition-colors cursor-pointer text-stone-600"
                                aria-label="Settings"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 pt-20 pb-8 overflow-hidden flex items-center justify-center bg-slate-200">
                <div className="w-full max-w-7xl px-4 perspective-1000">
                    <BookReader story={story} />
                </div>
            </main>
        </div>
    );
}
