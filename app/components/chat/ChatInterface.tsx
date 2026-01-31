"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Send, Plus, Sparkles, Loader2 } from "lucide-react";
import { ProgressSteps } from "@/app/components/shared";

interface Message {
    id: number;
    role: "assistant" | "user";
    content: string;
}

const steps = [
    { id: 1, label: "Character", key: "character" },
    { id: 2, label: "Story", key: "story" },
    { id: 3, label: "Generate", key: "generate" },
];

const conversationFlow = {
    character: [
        "Hi there! 👋 I'm your AI story assistant. Let's create a magical story together!",
        "First, tell me about your main character. What's their name?",
    ],
    story: [
        "Great! Now let's set the scene. Where does your story take place?",
        "What kind of adventure should your character go on?",
    ],
    generate: [
        "Wonderful! I have everything I need to create your story.",
        "Click the button below to generate your personalized storybook!",
    ],
};

function ChatMessage({ message }: { message: Message }) {
    return (
        <div className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${message.role === "assistant"
                ? "bg-primary/10 text-primary"
                : "bg-secondary/10 text-secondary"
                }`}>
                {message.role === "assistant" ? (
                    <Sparkles className="w-5 h-5" />
                ) : (
                    <span className="text-sm font-medium">You</span>
                )}
            </div>
            <div className={`max-w-[80%] ${message.role === "user" ? "text-right" : ""}`}>
                <div className={`inline-block px-4 py-3 rounded-2xl ${message.role === "assistant"
                    ? "bg-surface border border-border text-foreground"
                    : "bg-secondary text-white"
                    }`}>
                    <p className="text-sm sm:text-base">{message.content}</p>
                </div>
            </div>
        </div>
    );
}

function TypingIndicator() {
    return (
        <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="bg-surface border border-border px-4 py-3 rounded-2xl">
                <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
            </div>
        </div>
    );
}

export default function ChatInterface() {
    const [currentStep, setCurrentStep] = useState(1);
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, role: "assistant", content: conversationFlow.character[0] },
        { id: 2, role: "assistant", content: conversationFlow.character[1] },
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now(),
            role: "user",
            content: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsTyping(true);

        // Simulate AI response
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setIsTyping(false);

        // Add AI response based on step
        const stepKey = currentStep === 1 ? "story" : "generate";
        const response: Message = {
            id: Date.now() + 1,
            role: "assistant",
            content: conversationFlow[stepKey]?.[0] || "Let's continue building your story!",
        };
        setMessages((prev) => [...prev, response]);

        if (currentStep < 3) {
            setCurrentStep((s) => s + 1);
        }
    };

    return (
        <main className="pt-20 pb-4 h-screen flex flex-col">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col h-full">
                {/* Header */}
                <div className="py-4 border-b border-border mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-heading font-semibold text-foreground">Story Creator</span>
                        </Link>
                        <Link
                            href="/character-creator"
                            className="flex items-center gap-2 text-sm text-primary hover:underline cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            New Character
                        </Link>
                    </div>
                    <ProgressSteps steps={steps} currentStep={currentStep} />
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 py-4">
                    {messages.map((message) => (
                        <ChatMessage key={message.id} message={message} />
                    ))}
                    {isTyping && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="py-4 border-t border-border">
                    {currentStep < 3 ? (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                            className="flex gap-3"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your response..."
                                className="flex-1 px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className="w-12 h-12 bg-secondary text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {isTyping ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </form>
                    ) : (
                        <Link
                            href="/order"
                            className="w-full flex items-center justify-center gap-2 bg-secondary text-white py-4 rounded-xl font-semibold hover:opacity-90 transition-all cursor-pointer"
                        >
                            <Sparkles className="w-5 h-5" />
                            Generate & Preview Story
                        </Link>
                    )}
                </div>
            </div>
        </main>
    );
}
