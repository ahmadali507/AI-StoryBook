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
    characters?: Character[];
    chapters?: Chapter[];
    content?: any;
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
