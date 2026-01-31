

"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ChevronLeft,
    Share2,
    Settings,
    ShoppingCart
} from "lucide-react";
import BookReader from "@/app/components/story/BookReader";

export default function StoryViewer() {
    // Dummy story data for demonstration
    const story = {
        title: "Luna's Forest Adventure",
        author: "AI Storybook",
        chapters: [
            {
                title: "The Whispering Grove",
                content: "Luna stepped deeper into the ancient woods, the canopy above filtering the sunlight into golden ribbons on the mossy ground. The air hummed with the quiet symphony of the forest, and with each step, the whispering of the leaves grew louder, promising secrets and wonder.",
                illustrationUrl: "/placeholder-1.jpg"
            },
            {
                title: "A Fox's Tale",
                content: "A small, curious fox peeked out from behind a fern, its eyes wide with wonder, beckoning her to follow. Luna hesitated for a moment, but the fox's playful yip encouraged her to take a step forward.",
                illustrationUrl: "/placeholder-2.jpg"
            },
            {
                title: "The Hidden Clearing",
                content: "They arrived at a clearing bathed in magical light, where the laws of nature seemed to dance to a different rhythm. Fireflies woven from pure sunlight drifted through the afternoon air, their glow pulsing in time with the heartbeat of the forest. In the center stood a tree of impossible stature, its bark shimmering like spun silver and its leaves chiming softly like thousands of tiny diamonds colliding in a gentle breeze.\n\nLuna approached the tree with a mixture of reverence and curiosity. The ground beneath her boots felt soft, like walking on a cloud of moss. As she reached out to touch the silver bark, a warm hum vibrated through her fingertips, spreading up her arm and warming her chest. It was a sensation of pure welcome, as if the tree had been waiting for her—and only her—for a thousand years.\n\n\"This is the Heart of the Woods,\" said a soft voice, not from the fox, but from the air itself. Luna spun around, but saw no one. The fox merely sat, wrapping its tail around its paws, looking at her with knowing eyes. The voice continued, echoing gently, \"It remembers every story ever told, and it has been waiting for a new storyteller to awaken its magic.\"\n\nWith a deep breath, Luna realized why she had felt drawn to the forest. It wasn't just an adventure; it was a calling. She sat at the base of the silver tree, opened her journal, and began to write, the words flowing from her pen like water from a spring. afjaslf asfdaldflka skdlf alsdfasldf ajsdklfa dlfalkdj faldk jfalksd ",
                illustrationUrl: "/placeholder-3.jpg"
            }
        ]
    };

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
