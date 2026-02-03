'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { ChatMessage } from './ChatMessage';
import { Send, Sparkles, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ModelMessage } from 'ai';
import { continueConversation } from '@/actions/chat';
import { 
    ChatMessage as ChatMessageType, 
    CharacterGenerationResult,
    StoryGenerationResult,
    FinalizeResult,
    PreMadeCharacterOption,
    PreMadeCharactersMetadata
} from '@/types/chat';

/**
 * Unified AI Chat Interface for Storybook Creation
 * 
 * This component handles the complete storybook creation pipeline:
 * 1. Character count selection (1 or 2 characters)
 * 2. Character details collection
 * 3. Batch character generation with Seedream (parallel)
 * 4. Character preview display
 * 5. Story details collection (setting, theme, description)
 * 6. Full story generation with chapters and illustrations
 * 7. Success message with link to view the created story
 * 
 * Uses Vercel AI SDK with streaming for real-time responses
 */
export function StoryChat() {
    const [messages, setMessages] = useState<ChatMessageType[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [generatedCharacterIds, setGeneratedCharacterIds] = useState<string[]>([]);
    const [storyGenerationStartTime, setStoryGenerationStartTime] = useState<number | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Initial greeting
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                {
                    id: '1',
                    role: 'assistant',
                    content: "Welcome to our magical story studio! ✨\n\nWould you like to:\n1. Create your own custom character\n2. Pick from our pre-made characters\n\nJust let me know your choice!",
                    timestamp: Date.now()
                }
            ]);
        }
    }, [messages.length]);

    // Auto-scroll to bottom
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Focus input on mount
    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    // Auto-resize textarea based on content
    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    }, []);

    // Input handler (no debouncing for immediate responsiveness)
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInput(value);
        
        // Adjust height immediately for visual feedback
        adjustTextareaHeight();
    }, [adjustTextareaHeight]);


    const handleSubmit = async (e?: React.FormEvent, customContent?: string) => {
        e?.preventDefault();
        const content = customContent || input.trim();
        if (!content) return;

        console.log('[StoryChat] Submit triggered with content:', content);
        console.log('[StoryChat] Current character IDs in state:', generatedCharacterIds);

        // User message
        const userMsg: ChatMessageType = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        
        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
        
        setIsTyping(true);

        try {
            // Convert our chat messages to Vercel AI SDK ModelMessages
            const history: ModelMessage[] = messages.concat(userMsg)
                .filter(m => m.content.trim() !== '') // Remove empty messages
                .map(m => ({
                    role: m.role,
                    content: m.content
                }));

            const historyText = JSON.stringify(history);

            // Inject character IDs if available and we haven't started story generation yet
            if (generatedCharacterIds.length > 0 && !historyText.includes('Building your storybook')) {
                console.log('[StoryChat] Injecting character IDs into history:', generatedCharacterIds);
                history.push({
                    role: 'user',
                    content: `[SYSTEM CONTEXT: The user has already selected these character IDs: ${JSON.stringify(generatedCharacterIds)}. You MUST use these exact UUID values when calling generateFullStory. Do not ask for character selection again.]`
                });
                history.push({
                    role: 'assistant',
                    content: `Understood. I will use character IDs: ${generatedCharacterIds.join(', ')} for story generation.`
                });
            }

            // Call the server action which returns an async iterable
            const result = await continueConversation(history);

            let textContent = '';
            let currentToolCall = '';

            // Create a temporary ID for the streaming message
            const assistantMsgId = (Date.now() + 1).toString();

            setMessages(prev => [
                ...prev,
                {
                    id: assistantMsgId,
                    role: 'assistant',
                    content: '', // Start empty
                    timestamp: Date.now()
                }
            ]);

            for await (const delta of result) {
                if (!delta) continue;

                if (delta.type === 'text') {
                    textContent += delta.content;
                    setMessages(prev => prev.map(msg =>
                        msg.id === assistantMsgId
                            ? { ...msg, content: textContent }
                            : msg
                    ));
                } else if (delta.type === 'tool-call') {
                    // Track which tool is being called
                    if (delta.toolName) {
                        currentToolCall = delta.toolName;
                    }
                    
                    // Show loading message based on tool with progress indicator
                    if (delta.toolName === 'generateCharacters') {
                        textContent += '\n\n🎨 Creating your character(s)...';
                        setMessages(prev => prev.map(msg =>
                            msg.id === assistantMsgId
                                ? { ...msg, content: textContent }
                                : msg
                        ));
                    } else if (delta.toolName === 'generateFullStory') {
                        // Start story generation and progress tracking
                        setStoryGenerationStartTime(Date.now());
                        
                        // Initialize story progress with a friendly message
                        setMessages(prev => prev.map(msg =>
                            msg.id === assistantMsgId
                                ? { 
                                    ...msg, 
                                    content: textContent,
                                    storyProgress: {
                                        phase: 'outline',
                                        current: 0,
                                        total: 100,
                                        message: 'Creating your magical story... ✨'
                                    }
                                }
                                : msg
                        ));
                        
                        // Simulate realistic progress (estimated 3-5 minutes for full generation)
                        let progress = 0;
                        const updateProgress = () => {
                            progress += Math.random() * 3 + 1; // Increment by 1-4% each time
                            if (progress > 95) progress = 95; // Cap at 95% until completion
                            
                            const elapsed = Date.now() - (storyGenerationStartTime || Date.now());
                            let phase: 'outline' | 'chapters' | 'illustrations' | 'complete' = 'outline';
                            let message = 'Creating your magical story... ✨';
                            
                            if (progress < 15) {
                                phase = 'outline';
                                message = 'Creating story structure... ✨';
                            } else if (progress < 70) {
                                phase = 'chapters';
                                message = 'Writing chapters... 📖';
                            } else {
                                phase = 'illustrations';
                                message = 'Generating beautiful illustrations... 🎨';
                            }
                            
                            setMessages(prev => prev.map(msg =>
                                msg.id === assistantMsgId && msg.storyProgress
                                    ? { 
                                        ...msg, 
                                        storyProgress: {
                                            phase,
                                            current: Math.round(progress),
                                            total: 100,
                                            message
                                        }
                                    }
                                    : msg
                            ));
                            
                            if (progress < 95) {
                                progressTimerRef.current = setTimeout(updateProgress, 2000 + Math.random() * 2000); // Update every 2-4 seconds
                            }
                        };
                        
                        progressTimerRef.current = setTimeout(updateProgress, 1000);
                    }
                } else if (delta.type === 'tool-result') {
                    // Handle specific tool results with proper typing
                    if (delta.tool === 'listPreMadeCharacters') {
                        const result = delta.result as { 
                            success: boolean; 
                            characters?: PreMadeCharacterOption[]; 
                            hasMore?: boolean;
                            totalCount?: number;
                            displayCount?: number;
                            showingAll?: boolean;
                            message?: string 
                        };
                        
                        console.log('[StoryChat] listPreMadeCharacters result:', result);
                        
                        if (result.success && result.characters) {
                            console.log('[StoryChat] Setting characters on message:', result.characters.length, 'characters');
                            // Update message with pre-made character options and metadata
                            const metadata: PreMadeCharactersMetadata = {
                                hasMore: result.hasMore || false,
                                totalCount: result.totalCount || result.characters.length,
                                displayCount: result.displayCount || result.characters.length,
                                showingAll: result.showingAll || false
                            };
                            
                            setMessages(prev => prev.map(msg =>
                                msg.id === assistantMsgId
                                    ? { 
                                        ...msg, 
                                        preMadeCharacters: result.characters,
                                        preMadeCharactersMetadata: metadata
                                    }
                                    : msg
                            ));
                        } else {
                            console.log('[StoryChat] No characters or failed:', result);
                        }
                    } else if (delta.tool === 'selectPreMadeCharacters') {
                        const result = delta.result as { success: boolean; characterIds?: string[]; characters?: Array<{ name: string; imageUrl?: string }> };
                        
                        console.log('[StoryChat] selectPreMadeCharacters result:', result);
                        
                        if (result.success && result.characterIds) {
                            console.log('[StoryChat] Setting character IDs from selection:', result.characterIds);
                            setGeneratedCharacterIds(result.characterIds);
                            
                            // Show selected characters as previews
                            if (result.characters) {
                                const previews = result.characters.map(c => ({
                                    name: c.name,
                                    imageUrl: c.imageUrl,
                                    success: true
                                }));
                                
                                setMessages(prev => prev.map(msg =>
                                    msg.id === assistantMsgId
                                        ? { ...msg, characterPreviews: previews }
                                        : msg
                                ));
                            }
                        } else {
                            console.error('[StoryChat] Failed to select characters:', result);
                        }
                    } else if (delta.tool === 'generateCharacters') {
                        const result = delta.result as CharacterGenerationResult & { characterIds?: string[] };
                        
                        // Extract character previews
                        const previews = result.characters.map(char => {
                            if (char.status === 'fulfilled' && char.value) {
                                return char.value;
                            } else {
                                return {
                                    name: 'Unknown',
                                    success: false,
                                    error: char.reason || 'Failed to generate',
                                };
                            }
                        });
                        
                        // Store character IDs for later use
                        if (result.characterIds && result.characterIds.length > 0) {
                            setGeneratedCharacterIds(result.characterIds);
                        }
                        
                        // Update message with character previews
                        setMessages(prev => prev.map(msg =>
                            msg.id === assistantMsgId
                                ? { ...msg, characterPreviews: previews }
                                : msg
                        ));
                        
                    } else if (delta.tool === 'generateFullStory') {
                        const result = delta.result as StoryGenerationResult;
                        
                        console.log('[StoryChat] generateFullStory result:', result);
                        
                        // Clear progress timer
                        if (progressTimerRef.current) {
                            clearTimeout(progressTimerRef.current);
                            progressTimerRef.current = null;
                        }
                        
                        // Update with completion and storybook ID
                        setMessages(prev => prev.map(msg =>
                            msg.id === assistantMsgId
                                ? { 
                                    ...msg, 
                                    storybookId: result.storybookId,
                                    storyProgress: {
                                        phase: 'complete',
                                        current: 100,
                                        total: 100,
                                        message: 'Story generation complete! 🎉'
                                    }
                                }
                                : msg
                        ));
                        
                        setStoryGenerationStartTime(null);
                        
                    } else if (delta.tool === 'finalizeStory') {
                        const result = delta.result as FinalizeResult;
                        
                        // Update with final storybook ID and success state
                        setMessages(prev => prev.map(msg =>
                            msg.id === assistantMsgId
                                ? { ...msg, storybookId: result.storybookId }
                                : msg
                        ));
                    }
                } else if (delta.type === 'error') {
                    // Handle errors
                    const errorMsg: ChatMessageType = {
                        id: (Date.now() + 2).toString(),
                        role: 'assistant',
                        content: `I apologize, but I encountered an error: ${delta.content}. Please try again.`,
                        timestamp: Date.now()
                    };
                    setMessages(prev => [...prev, errorMsg]);
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            
            // Clear progress timer on error
            if (progressTimerRef.current) {
                clearTimeout(progressTimerRef.current);
                progressTimerRef.current = null;
            }
            setStoryGenerationStartTime(null);
            
            const errorMessage: ChatMessageType = {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: "I'm having trouble right now. " + 
                         (error instanceof Error ? error.message : "Please try again."),
                timestamp: Date.now()
            };
            
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };
    
    // Cleanup effect
    useEffect(() => {
        return () => {
            if (progressTimerRef.current) {
                clearTimeout(progressTimerRef.current);
            }
        };
    }, []);

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
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 md:px-20 scroll-smooth">
                <div className="max-w-3xl mx-auto flex flex-col justify-end min-h-full">
                    {messages.map((msg) => (
                        <ChatMessage
                            key={msg.id}
                            message={msg}
                            onCharacterSelect={(characterIds) => {
                                console.log('[StoryChat] User selected character IDs:', characterIds);
                                // Store the IDs immediately
                                setGeneratedCharacterIds(characterIds);
                                // Send selection confirmation with explicit IDs
                                handleSubmit(undefined, `I've selected these characters with IDs: ${characterIds.join(', ')}`);
                            }}
                            onShowAllCharacters={() => {
                                console.log('[StoryChat] User requested to show all characters');
                                // User wants to see all characters
                                handleSubmit(undefined, 'Show me all the characters');
                            }}
                            onChapterCountSelect={(count) => {
                                console.log('[StoryChat] User selected chapter count:', count);
                                // Send chapter count selection
                                handleSubmit(undefined, `I want ${count} chapters in my story`);
                            }}
                            isLoading={isTyping}
                        />
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

                    {/* Input Form */}
                    <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={handleInputChange}
                            onKeyDown={(e) => {
                                // Submit on Enter (without Shift)
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            placeholder="Type your reply... (Shift+Enter for new line)"
                            disabled={isTyping}
                            rows={1}
                            className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent disabled:opacity-50 transition-all text-slate-800 placeholder:text-slate-400 resize-none overflow-y-auto"
                            style={{ minHeight: '56px', maxHeight: '200px' }}
                        />
                        <button
                            type="submit"
                            disabled={isTyping || !input.trim()}
                            className="absolute right-2 bottom-2 p-2 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 disabled:hover:bg-fuchsia-600 text-white rounded-full transition-colors"
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
