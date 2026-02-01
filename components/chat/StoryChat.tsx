'use client';

import { useRef, useEffect } from 'react';
import { useStoryChat } from '@/hooks/useStoryChat';
import { ChatMessage } from './ChatMessage';
import { Send, Sparkles, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function StoryChat() {
    const { messages, isTyping, suggestions, storyState, sendMessage } = useStoryChat();
    const inputRef = useRef<HTMLInputElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        const content = inputRef.current?.value.trim();
        if (!content) return;

        sendMessage(content);
        if (inputRef.current) inputRef.current.value = '';
    };

    const handleSuggestionClick = (suggestion: string) => {
        sendMessage(suggestion);
    };

    const handleCreateStory = () => {
        // This will eventually navigate to the generation page with the collected data
        // For now we just log it or maybe redirect to a specific route
        const queryParams = new URLSearchParams({
            chars: storyState.characterName || '',
            desc: storyState.characterDescription || '',
            setting: storyState.setting || '',
            theme: storyState.theme || ''
        });
        router.push(`/story-generator?${queryParams.toString()}`);
    };

    return (
        <div className="flex flex-col h-screen max-h-screen bg-slate-50">

            {/* Header */}
            <header className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-fuchsia-600 rounded-md flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="font-bold text-lg text-slate-800">Story Assistant</h1>
                </div>

                {/* Progress / Status */}
                <div className="hidden md:flex items-center gap-4 text-sm text-slate-500">
                    <div className={`flex items-center gap-1 ${storyState.characterName ? 'text-fuchsia-600 font-medium' : ''}`}>
                        <span className="w-2 h-2 rounded-full bg-current" />
                        Character
                    </div>
                    <div className={`flex items-center gap-1 ${storyState.setting ? 'text-fuchsia-600 font-medium' : ''}`}>
                        <span className="w-2 h-2 rounded-full bg-current" />
                        Setting
                    </div>
                    <div className={`flex items-center gap-1 ${storyState.theme ? 'text-fuchsia-600 font-medium' : ''}`}>
                        <span className="w-2 h-2 rounded-full bg-current" />
                        Theme
                    </div>
                </div>

                {storyState.isComplete && (
                    <button
                        onClick={handleCreateStory}
                        className="flex items-center gap-2 px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-full font-medium transition-colors animate-pulse"
                    >
                        <BookOpen className="w-4 h-4" />
                        Create Story
                    </button>
                )}
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 md:px-20 scroll-smooth">
                <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-full">
                    {messages.map((msg) => (
                        <ChatMessage key={msg.id} message={msg} />
                    ))}

                    {isTyping && (
                        <div className="flex w-full mb-6 justify-start animate-fade-in">
                            <div className="flex max-w-[80%] gap-4">
                                <div className="w-8 h-8 rounded-full bg-fuchsia-600 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex items-center gap-1 p-4 bg-white border-2 border-fuchsia-50 rounded-2xl rounded-tl-sm">
                                    <span className="w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                <div className="max-w-3xl mx-auto space-y-4">

                    {/* Suggestions */}
                    {!isTyping && suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 animate-fade-in-up">
                            {suggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="px-4 py-2 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 text-sm rounded-full border border-fuchsia-100 transition-colors text-left"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input Form */}
                    <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Type your reply..."
                            disabled={isTyping}
                            className="w-full pl-5 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent disabled:opacity-50 transition-all text-slate-800 placeholder:text-slate-400"
                        />
                        <button
                            type="submit"
                            disabled={isTyping}
                            className="absolute right-2 p-2 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 disabled:hover:bg-fuchsia-600 text-white rounded-full transition-colors"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                    <div className="text-center">
                        <p className="text-xs text-slate-400">AI can make mistakes. Please verify important information.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
