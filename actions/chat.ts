'use server';

import { chatWithStoryteller } from '@/lib/gemini';
import { ChatMessage, StoryState, StoryChatResponse } from '@/types/chat';

export async function sendChatMessage(
    history: ChatMessage[],
    userInput: string,
    currentContext: StoryState
): Promise<StoryChatResponse> {
    try {
        const response = await chatWithStoryteller(history, userInput, currentContext);
        return response;
    } catch (error) {
        console.error('Error in sendChatMessage:', error);
        return {
            reply: "I'm having a little trouble hearing you. could you say that again?",
            suggestions: [],
            isComplete: false
        };
    }
}
