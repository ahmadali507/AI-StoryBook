export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface StoryState {
    characterName?: string;
    characterDescription?: string;
    setting?: string;
    theme?: string;
    isComplete: boolean;
}

export interface StoryChatResponse {
    reply: string;
    suggestions: string[];
    extractedData?: Partial<StoryState>;
    isComplete: boolean;
}
