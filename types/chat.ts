export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    characterPreviews?: CharacterPreview[];
    preMadeCharacters?: PreMadeCharacterOption[];
    preMadeCharactersMetadata?: PreMadeCharactersMetadata;
    chapterCountOptions?: boolean;
    storyProgress?: StoryProgress;
    storybookId?: string;
}

export interface PreMadeCharacterOption {
    id: string;
    name: string;
    imageUrl?: string;
    artStyle: string;
}

export interface PreMadeCharactersMetadata {
    hasMore: boolean;
    totalCount: number;
    displayCount: number;
    showingAll: boolean;
}

export interface CharacterPreview {
    name: string;
    imageUrl?: string;
    characterId?: string;
    success: boolean;
    error?: string;
}

export interface StoryProgress {
    phase: 'outline' | 'chapters' | 'illustrations' | 'complete';
    current: number;
    total: number;
    message: string;
}

// Tool result types for Vercel AI SDK
export interface CharacterGenerationResult {
    characters: Array<{
        status: 'fulfilled' | 'rejected';
        value?: CharacterPreview;
        reason?: string;
    }>;
}

export interface StoryGenerationResult {
    storybookId: string;
    status: 'generating';
    message: string;
}

export interface FinalizeResult {
    storybookId: string;
    status: 'complete';
    message: string;
}
