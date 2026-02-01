import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, StoryState, StoryChatResponse } from '@/types/chat';
import { sendChatMessage } from '@/actions/chat';

export function useStoryChat() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [storyState, setStoryState] = useState<StoryState>({ isComplete: false });
    const [isTyping, setIsTyping] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [streamingContent, setStreamingContent] = useState<string>("");

    // Initialize chat
    useEffect(() => {
        if (messages.length === 0) {
            handleInitialMessage();
        }
    }, []);

    const handleInitialMessage = async () => {
        setIsTyping(true);
        // Simulate initial delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const initialResponse: StoryChatResponse = {
            reply: "Hello! I'm your magical Storyteller. I'm so excited to help you create a meaningful story. To start, could you tell me what kind of setting you'd like our story to take place in?",
            suggestions: ["A magical forest", "Outer space", "A hidden underwater city", "A busy modern city"],
            isComplete: false
        };

        await streamResponse(initialResponse);
    };

    const streamResponse = async (response: StoryChatResponse) => {
        setIsTyping(true);
        setSuggestions([]); // Hide suggestions while typing

        // Update story state if data was extracted
        if (response.extractedData) {
            setStoryState(prev => ({ ...prev, ...response.extractedData }));
        }
        if (response.isComplete) {
            setStoryState(prev => ({ ...prev, isComplete: true }));
        }

        const messageId = uuidv4();
        const fullContent = response.reply;

        // Add empty assistant message
        setMessages(prev => [...prev, {
            id: messageId,
            role: 'assistant',
            content: '',
            timestamp: Date.now()
        }]);

        // Stream content line by line or chunk by chunk for effect
        let currentText = "";
        const chunkSize = 2; // chars per tick

        for (let i = 0; i < fullContent.length; i += chunkSize) {
            currentText += fullContent.slice(i, i + chunkSize);
            setMessages(prev => prev.map(msg =>
                msg.id === messageId ? { ...msg, content: currentText } : msg
            ));
            await new Promise(resolve => setTimeout(resolve, 20)); // typing speed
        }

        setIsTyping(false);
        setSuggestions(response.suggestions);
    };

    const sendMessage = useCallback(async (content: string) => {
        // Add user message
        const userMsg: ChatMessage = {
            id: uuidv4(),
            role: 'user',
            content,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        try {
            // Check if we need to call API or if we are verifying locally
            // Ideally we always send to API to maintain persona
            const response = await sendChatMessage(messages.concat(userMsg), content, storyState);
            await streamResponse(response);
        } catch (error) {
            console.error(error);
            setIsTyping(false);
        }
    }, [messages, storyState]);

    return {
        messages,
        isTyping,
        suggestions,
        storyState,
        sendMessage
    };
}
