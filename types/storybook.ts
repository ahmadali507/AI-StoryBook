// Character types
export interface CharacterVisualDescription {
    name: string;
    visualPrompt: string;
}

export interface CharacterAppearance {
    hairStyle: string;
    hairColor: string;
    eyeColor: string;
    skinTone: string;
    clothing?: string;
    accessories?: string[];
    distinctiveFeatures?: string[];
    age?: string;
    description?: string;
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
    referenceImageUrl?: string;
}

export interface GenerateStoryOutlineRequest {
    characterIds: string[];
    setting: StorySetting;
    theme?: string;
    targetChapters: number;
    additionalDetails?: string;
    title?: string;
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
    referenceImageUrl?: string; // For consistency
    appearance?: string; // Text description for prompt
    gender: Gender;
    entityType: EntityType;
    role: CharacterRole;
    age?: string;
    clothingStyle?: string;
    description?: string;
    storyRole?: string;       // e.g. "father", "big sister", "best friend"
    useFixedClothing?: boolean;
    animalType?: string;      // e.g. "dog", "cat", "rabbit"
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
        style: 'Clear, simple sentences with engaging plot, character thoughts, and immersive narrative',
        vocabulary: 'beginner-friendly',
        promptHint: 'Write for pre-teens using EASY, beginner-level vocabulary. 150-200 words per page. Keep sentences short and clear. Avoid difficult words. Use simple, everyday language while telling an engaging story with character emotions and plot development.',
    },
};

// Theme options
// Based on the user's request
export type Theme =
    | 'educational'
    | 'fairy-tales'
    | 'adventure'
    | 'activities'
    | 'worlds'
    | 'stories'
    | 'holidays'
    | 'family';

export const THEME_OPTIONS: { id: Theme; name: string; emoji: string; description: string }[] = [
    { id: 'educational', name: 'Educational', emoji: '📚', description: 'Fun learning moments' },
    { id: 'fairy-tales', name: 'Fairy Tales', emoji: '🦄', description: 'Magical kingdoms & creatures' },
    { id: 'adventure', name: 'Adventure', emoji: '🗺️', description: 'Exciting journeys & quests' },
    { id: 'activities', name: 'Activities', emoji: '🛝', description: 'Fun games & play' },
    { id: 'worlds', name: 'Worlds', emoji: '🌍', description: 'Exploring new places' },
    { id: 'stories', name: 'Stories', emoji: '📜', description: 'Classic storytelling' },
    { id: 'holidays', name: 'Holidays', emoji: '🎄', description: 'Festive celebrations' },
    { id: 'family', name: 'Family', emoji: '👨‍👩‍👧‍👦', description: 'Heartwarming family moments' },
];

// Story Subjects
export interface Subject {
    id: string;
    name: string;
    emoji: string;
    prompt?: string;
}

export const THEME_SUBJECTS: Record<Theme, Subject[]> = {
    educational: [
        { id: 'walking', name: 'Learning to walk', emoji: '👣' },
        { id: 'first-words', name: 'First Words', emoji: '🗣️' },
        { id: 'body-parts', name: 'Body Parts', emoji: '🦶' },
        { id: 'pacifier', name: 'Weaning off the pacifier', emoji: '👶' },
        { id: 'thumb-sucking', name: 'Stop thumb sucking', emoji: '👍' },
        { id: 'brushing-teeth', name: 'Brushing teeth', emoji: '🪥' },
        { id: 'potty-training', name: 'Potty Training', emoji: '🚽' },
        { id: 'shapes-colours', name: 'Shapes and colours', emoji: '🔺' },
        { id: 'counting', name: 'Learning to Count', emoji: '🔢' },
        { id: 'seasons', name: 'Seasons and Weather', emoji: '🌦️' },
        { id: 'bike', name: 'Learning to Ride a Bike', emoji: '🚲' },
        { id: 'alphabet', name: 'Alphabet', emoji: '🔤' },
        { id: 'shoelaces', name: 'Tying shoelaces', emoji: '👟' },
        { id: 'time', name: 'Telling the time', emoji: '⏰' },
    ],
    'fairy-tales': [
        { id: 'unicorns', name: 'Unicorns', emoji: '🦄' },
        { id: 'princess', name: 'Princes and Princesses', emoji: '👑' },
        { id: 'knights', name: 'Knights and Dragons', emoji: '⚔️' },
        { id: 'wizard', name: 'Wizard School', emoji: '🪄' },
        { id: 'forest', name: 'The Magic Forest', emoji: '🌳' },
        { id: 'mermaids', name: 'Mermaids', emoji: '🧜‍♀️' },
        { id: 'gnomes', name: 'Gnomes', emoji: '🍄' },
        { id: 'fairies', name: 'Fairies and Elves', emoji: '🧚‍♀️' },
    ],
    adventure: [
        { id: 'garbage-truck', name: 'Garbage truck', emoji: '🚛' },
        { id: 'construction', name: 'Construction machinery', emoji: '🏗️' },
        { id: 'airplane', name: 'Airplane', emoji: '✈️' },
        { id: 'racing', name: 'Racing', emoji: '🏎️' },
        { id: 'fire-dept', name: 'Fire Department', emoji: '🚒' },
        { id: 'police', name: 'Police', emoji: '🚓' },
        { id: 'dinosaurs', name: 'Dinosaurs', emoji: '🦖' },
        { id: 'pirates', name: 'Pirates', emoji: '🏴‍☠️' },
        { id: 'superhero', name: 'Superhero', emoji: '🦸' },
        { id: 'camping', name: 'Camping', emoji: '⛺' },
        { id: 'travel', name: 'Travel', emoji: '🧳' },
        { id: 'treasure', name: 'Treasure Hunts', emoji: '💎' },
        { id: 'secret-mission', name: 'Secret Missions', emoji: '🕵️' },
        { id: 'haunted-house', name: 'Haunted House', emoji: '👻' },
        { id: 'time-travel', name: 'Time Travel', emoji: '⏳' },
    ],
    activities: [
        { id: 'outdoor', name: 'Outdoor Play', emoji: '🛝' },
        { id: 'dancing', name: 'Dancing', emoji: '💃' },
        { id: 'music', name: 'Making Music', emoji: '🥁' },
        { id: 'farm', name: 'To the Farm', emoji: '🚜' },
        { id: 'forest-trip', name: 'To the forest', emoji: '🌲' },
        { id: 'beach', name: 'Go to the beach', emoji: '🏖️' },
        { id: 'crafts', name: 'Arts and crafts', emoji: '✂️' },
        { id: 'painting', name: 'Painting', emoji: '🎨' },
        { id: 'cooking', name: 'Cooking and Baking', emoji: '🍳' },
        { id: 'gardening', name: 'Gardening', emoji: '🌻' },
        { id: 'school', name: 'To school', emoji: '🎒' },
        { id: 'library', name: 'To the library', emoji: '📚' },
        { id: 'doctor', name: 'Visit the Doctor', emoji: '🩺' },
        { id: 'dentist', name: 'Visit the Dentist', emoji: '🦷' },
        { id: 'train', name: 'Train travel', emoji: '🚂' },
        { id: 'zoo', name: 'Visit the zoo', emoji: '🦁' },
        { id: 'circus', name: 'To the Circus', emoji: '🎪' },
        { id: 'amusement', name: 'Visiting Amusement Parks', emoji: '🎡' },
        { id: 'sports', name: 'Sports', emoji: '⚽' },
        { id: 'animals', name: 'Caring for Animals', emoji: '🐕' },
        { id: 'treehouse', name: 'Building a Treehouse', emoji: '🪵' },
        { id: 'gaming', name: 'Gaming', emoji: '🎮' },
    ],
    worlds: [
        { id: 'jungle', name: 'In the Jungle', emoji: '🌿' },
        { id: 'savanna', name: 'The Savanna', emoji: '🦁' },
        { id: 'ocean', name: 'Deep in the Ocean', emoji: '🌊' },
        { id: 'north-pole', name: 'At the North Pole', emoji: '🐻‍❄️' },
        { id: 'candyland', name: 'Candy Land', emoji: '🍭' },
        { id: 'middle-ages', name: 'The Middle Ages', emoji: '🏰' },
        { id: 'space', name: 'In Space', emoji: '👩‍🚀' },
        { id: 'future', name: 'In the Future', emoji: '🤖' },
        { id: 'prehistoric', name: 'The Prehistoric Age', emoji: '🦣' },
        { id: 'wild-west', name: 'The Wild West', emoji: '🤠' },
        { id: 'vikings', name: 'The Vikings', emoji: '🛡️' },
        { id: '1001-nights', name: '1001 Nights', emoji: '🧞' },
        { id: 'ancient-egypt', name: 'Ancient Egypt', emoji: '🔺' },
        { id: 'ancient-greece', name: 'Ancient Greece', emoji: '🏛️' },
    ],
    stories: [
        { id: 'bedtime', name: 'Bedtime story', emoji: '😴' },
        { id: 'humorous', name: 'Humorous story', emoji: '🤡' },
    ],
    holidays: [
        { id: 'birthday', name: 'Birthday', emoji: '🎂' },
        { id: 'christmas', name: 'Christmas', emoji: '🎄' },
        { id: 'mothers-day', name: 'Mother\'s Day', emoji: '👩‍👧' },
        { id: 'fathers-day', name: 'Father\'s Day', emoji: '👨‍👦' },
        { id: 'grandparents-day', name: 'Grandparents Day', emoji: '👵' },
        { id: 'childrens-day', name: 'Children\'s Day', emoji: '🎈' },
        { id: 'valentines', name: 'Valentine\'s Day', emoji: '💝' },
        { id: 'easter', name: 'Easter', emoji: '🥚' },
        { id: 'three-kings', name: 'Three Kings Day', emoji: '👑' },
        { id: 'communion', name: 'First Holy Communion', emoji: '🕯️' },
        { id: 'eid-al-fitr', name: 'Eid al-Fitr', emoji: '🕌' },
        { id: 'eid-al-adha', name: 'Eid al-Adha', emoji: '🐑' },
        { id: 'hanukkah', name: 'Hanukkah', emoji: '🕎' },
        { id: 'independence', name: 'Independence Day', emoji: '🎆' },
        { id: 'thanksgiving', name: 'Thanksgiving', emoji: '🦃' },
        { id: 'carnival', name: 'Carnival', emoji: '🎭' },
        { id: 'halloween', name: 'Halloween', emoji: '👻' },
        { id: 'st-patricks', name: 'St. Patrick\'s Day', emoji: '☘️' },
        { id: 'new-years', name: 'New Years Eve', emoji: '🎉' },
        { id: 'animal-day', name: 'World Animal Day', emoji: '🐾' },
    ],
    family: [
        { id: 'new-baby', name: 'New baby', emoji: '👶' },
        { id: 'little-sister', name: 'Gets a little sister', emoji: '👧' },
        { id: 'little-brother', name: 'Gets a little brother', emoji: '👦' },
        { id: 'moving', name: 'Moving', emoji: '📦' },
        { id: 'vacation', name: 'Vacation', emoji: '🏖️' },
        { id: 'sleepover', name: 'Sleepover', emoji: '🛌' },
        { id: 'marriage', name: 'Marriage', emoji: '👰' },
        { id: 'separation', name: 'Parents\' separation', emoji: '💔' },
        { id: 'blended-family', name: 'Blended family', emoji: '👨‍👩‍👧‍👦' },
        { id: 'goodbye', name: 'Saying goodbye', emoji: '🪦' },
    ],
};

// Simplified art styles for MVP (2 options)
export type MVPArtStyle = 'pixar-3d' | 'storybook';

export const MVP_ART_STYLES: { id: MVPArtStyle; name: string; preview: string; prompt: string }[] = [
    {
        id: 'pixar-3d',
        name: 'Pixar 3D Cinematic',
        preview: '/images/art-styles/pixar-3d.png',
        prompt: 'Pixar style 3D cinematic scene, high quality 3D render, ultra detailed, global illumination, soft shadows, depth of field, warm tones, cinematic composition, volumetric lighting, subsurface scattering, professional Pixar/Disney quality animation, octane render, ray tracing',
    },
    {
        id: 'storybook',
        name: 'Classic Storybook',
        preview: '/images/art-styles/storybook.webp',
        prompt: 'Classic storybook illustration style, detailed backgrounds, timeless feel, golden hour lighting, reminiscent of beloved children\'s books, highly detailed, masterpiece',
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

