// Character types
export interface CharacterAppearance {
    hairStyle: string;
    hairColor: string;
    eyeColor: string;
    skinTone: string;
    clothing?: string;
    accessories?: string[];
    distinctiveFeatures?: string[];
    age?: string;
}

export interface Character {
    id: string;
    userId?: string;
    name: string;
    appearance: CharacterAppearance;
    personality: string[];
    visualPrompt: string;
    artStyle: ArtStyle;
    seedNumber: number;
    referenceImageUrl?: string;
    createdAt?: Date;
}

// Art styles
export type ArtStyle =
    | 'watercolor'
    | 'cartoon'
    | 'storybook'
    | 'anime'
    | '3d-clay'
    | 'fantasy';

export const ART_STYLE_PROMPTS: Record<ArtStyle, string> = {
    watercolor: "Beautiful watercolor painting, soft edges, pastel colors, artistic, detailed, masterpiece, soft natural lighting, high quality",
    cartoon: "High fidelity modern cartoon style, clean lines, vibrant colors, expressive characters, smooth gradients, 4k resolution, highly detailed",
    storybook: "Magical realism storybook illustration, intricate details, golden hour lighting, enchanting atmosphere, matte painting style, highly detailed, masterpiece",
    anime: "High quality anime style, Studio Ghibli inspired, detailed background, expressive eyes, soft shading, cinematic lighting, masterpiece, 8k",
    '3d-clay': "3D claymation style, octane render, ray tracing, volumetric lighting, detailed textures, depth of field, best quality, Pixar style",
    fantasy: "Epic fantasy concept art, digital painting, cinematic lighting, intricate details, sharp focus, artstation, 8k, majestic, masterpiece"
};

export const ART_STYLE_LABELS: Record<ArtStyle, string> = {
    watercolor: "Soft Watercolor",
    cartoon: "Modern Cartoon",
    storybook: "Classic Storybook",
    anime: "Whimsical Anime",
    '3d-clay': "3D Claymation",
    fantasy: "Fantasy Art"
};

// Story settings
export type StorySetting =
    | 'forest'
    | 'castle'
    | 'ocean'
    | 'space'
    | 'village'
    | 'mountain'
    | 'fantasy';

export const STORY_SETTING_LABELS: Record<StorySetting, string> = {
    forest: "Enchanted Forest",
    castle: "Castle Kingdom",
    ocean: "Ocean World",
    space: "Space Adventure",
    village: "Cozy Village",
    mountain: "Mountain Quest",
    fantasy: "Magical Fantasy World"
};

// Storybook types
export interface Storybook {
    id: string;
    userId?: string;
    title: string;
    artStyle: ArtStyle;
    globalSeed: number;
    setting: StorySetting;
    theme?: string;
    targetChapters: number;
    status: StoryStatus;
    description?: string;
    characterIds?: string[];
    characters?: Character[];
    chapters?: Chapter[];
    content?: any;
    coverUrl?: string;
    coverImageUrl?: string;
    createdAt?: Date;
}

export type StoryStatus = 'draft' | 'generating' | 'complete' | 'printed';

// Chapter types
export interface Chapter {
    id: string;
    storybookId: string;
    chapterNumber: number;
    title: string;
    content: string;
    sceneDescription?: string;
    illustrations?: Illustration[];
    createdAt?: Date;
}

export interface Illustration {
    id: string;
    chapterId: string;
    imageUrl: string;
    promptUsed: string;
    seedUsed: number;
    position: number;
    createdAt?: Date;
}

// Generation request types
export interface GenerateCharacterSheetRequest {
    name: string;
    appearance: CharacterAppearance;
    personality: string[];
    artStyle: ArtStyle;
    additionalDetails?: string;
}

export interface GenerateStoryOutlineRequest {
    characterIds: string[];
    setting: StorySetting;
    theme?: string;
    targetChapters: number;
    additionalDetails?: string;
}

export interface GenerateIllustrationRequest {
    characters: Character[];
    sceneDescription: string;
    artStyle: ArtStyle;
    seedNumber: number;
}

// ============================================
// MVP SIMPLIFIED TYPES
// ============================================

// Gender and entity types for photo-based characters
export type Gender = 'male' | 'female' | 'other';
export type EntityType = 'human' | 'animal' | 'object';
export type CharacterRole = 'main' | 'supporting';

// Simplified character for MVP (photo-based)
export interface SimpleCharacter {
    id?: string;
    name: string;
    photoUrl: string;
    aiAvatarUrl?: string;
    gender: Gender;
    entityType: EntityType;
    role: CharacterRole;
}

// Age ranges for text complexity
export type AgeRange = '0-2' | '2-4' | '5-8' | '9-12';

export const AGE_RANGE_LABELS: Record<AgeRange, { label: string; emoji: string; description: string }> = {
    '0-2': { label: 'Baby', emoji: '👶', description: 'Simple sounds & pictures' },
    '2-4': { label: 'Toddler', emoji: '🧒', description: 'Short sentences' },
    '5-8': { label: 'Kids', emoji: '🧑', description: 'Full story' },
    '9-12': { label: 'Pre-teen', emoji: '📚', description: 'Rich storytelling' },
};

// Text complexity settings by age
export const TEXT_COMPLEXITY: Record<AgeRange, {
    wordsPerPage: number;
    style: string;
    vocabulary: string;
    promptHint: string;
}> = {
    '0-2': {
        wordsPerPage: 5,
        style: 'Very simple words, sounds like "boom", "splash", "whoosh", repetition',
        vocabulary: 'basic',
        promptHint: 'Write like a board book for infants. 1-5 words max per page. Use sounds and simple words.',
    },
    '2-4': {
        wordsPerPage: 20,
        style: 'Simple sentences, rhyming optional, familiar concepts',
        vocabulary: 'simple',
        promptHint: 'Write like a picture book for toddlers. 15-25 words per page. Simple sentences.',
    },
    '5-8': {
        wordsPerPage: 100,
        style: 'Rich sentences, engaging plot, dialogue, vivid descriptions',
        vocabulary: 'standard',
        promptHint: 'Write like a real children\'s book. 80-120 words per page. Include dialogue, action, and sensory details. Make the text substantial and immersive.',
    },
    '9-12': {
        wordsPerPage: 180,
        style: 'Rich vocabulary, complex plot, character introspection, immersive narrative',
        vocabulary: 'advanced',
        promptHint: 'Write like a young adult chapter book. 150-200 words per page. Rich descriptions, character thoughts, emotional depth, and immersive storytelling.',
    },
};

// Theme options
export type Theme =
    | 'adventure'
    | 'animals'
    | 'bedtime'
    | 'friendship'
    | 'fantasy'
    | 'learning'
    | 'family'
    | 'nature';

export const THEME_OPTIONS: { id: Theme; name: string; emoji: string; description: string }[] = [
    { id: 'adventure', name: 'Adventure', emoji: '🏔️', description: 'Exciting journeys and discoveries' },
    { id: 'animals', name: 'Animals', emoji: '🐾', description: 'Furry and feathered friends' },
    { id: 'bedtime', name: 'Bedtime', emoji: '🌙', description: 'Calming stories for sleep' },
    { id: 'friendship', name: 'Friendship', emoji: '🤝', description: 'Making and keeping friends' },
    { id: 'fantasy', name: 'Fantasy', emoji: '✨', description: 'Magic and wonder' },
    { id: 'learning', name: 'Learning', emoji: '📖', description: 'Fun educational stories' },
    { id: 'family', name: 'Family', emoji: '👨‍👩‍👧', description: 'Family love and togetherness' },
    { id: 'nature', name: 'Nature', emoji: '🌿', description: 'Exploring the natural world' },
];

// Simplified art styles for MVP (5 options including Pixar 3D)
export type MVPArtStyle = 'watercolor' | 'soft-illustration' | 'classic-storybook' | 'modern-cartoon' | 'pixar-3d';

export const MVP_ART_STYLES: { id: MVPArtStyle; name: string; preview: string; prompt: string }[] = [
    {
        id: 'pixar-3d',
        name: 'Pixar 3D Cinematic',
        preview: '/art-styles/pixar-3d.png',
        prompt: 'Pixar style 3D cinematic scene, high quality 3D render, ultra detailed, global illumination, soft shadows, depth of field, warm tones, cinematic composition, volumetric lighting, subsurface scattering, professional Pixar/Disney quality animation, octane render, ray tracing',
    },
    {
        id: 'soft-illustration',
        name: 'Soft Illustration',
        preview: '/art-styles/soft-illustration.png',
        prompt: 'Pixar style 3D cinematic, soft digital illustration, rounded shapes, warm colors, cozy atmosphere, professional children\'s book art, gentle and inviting',
    },
    {
        id: 'modern-cartoon',
        name: 'Modern 3D Cartoon',
        preview: '/art-styles/modern-cartoon.png',
        prompt: 'Pixar style 3D cinematic, modern cartoon style, clean lines, vibrant colors, expressive characters, smooth gradients, professional animation quality, 3D render',
    },
    {
        id: 'watercolor',
        name: 'Soft Watercolor',
        preview: '/art-styles/watercolor.png',
        prompt: 'Beautiful watercolor painting, soft edges, pastel colors, artistic, gentle lighting, high quality, children\'s book illustration',
    },
    {
        id: 'classic-storybook',
        name: 'Classic Storybook',
        preview: '/art-styles/classic-storybook.png',
        prompt: 'Classic storybook illustration style, detailed backgrounds, timeless feel, golden hour lighting, reminiscent of beloved children\'s books',
    },
];

// Order status for MVP flow
export type OrderStatus =
    | 'draft'           // Form incomplete
    | 'cover_preview'   // Cover generated, awaiting payment
    | 'paid'            // Payment confirmed
    | 'generating'      // Full book being generated
    | 'complete'        // Book ready for download
    | 'processing'      // Being printed (physical)
    | 'shipped'         // In transit (physical)
    | 'delivered';      // Delivered (physical)

// Book order for MVP
export interface BookOrder {
    id?: string;
    ageRange: AgeRange;
    theme: Theme;
    artStyle: MVPArtStyle;
    characters: SimpleCharacter[];
    title?: string;
    coverUrl?: string;
    pdfUrl?: string;
    status: OrderStatus;
    createdAt?: Date;
    paidAt?: Date;
    completedAt?: Date;
}

// Story template for pre-made stories
export interface StoryTemplate {
    id: string;
    name: string;
    description: string;
    ageRange: AgeRange;
    theme: Theme;
    storyOutline: { scene: number; prompt: string }[];
    isActive: boolean;
}

// Book format constants (24 pages)
export const BOOK_FORMAT = {
    totalPages: 24,
    frontCover: 1,
    titlePage: 1,
    storyPages: 20,      // 10 spreads = 10 illustrations + 10 text pages
    theEndPage: 1,
    backCover: 1,
    illustrationCount: 12, // Cover + 10 story + back cover
    textPageCount: 12,     // Title + 10 text + The End
};

