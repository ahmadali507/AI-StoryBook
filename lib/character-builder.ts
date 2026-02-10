import {
    Character,
    CharacterAppearance,
    ArtStyle,
    ART_STYLE_PROMPTS
} from '@/types/storybook';

// Quality boosters to append to all prompts
const QUALITY_BOOSTERS = "masterpiece, best quality, high resolution, 8k, extremely detailed, cinematic lighting, perfect composition, high fidelity";

// Default negative prompt for basic quality control
const BASE_NEGATIVE_PROMPT = "bad anatomy, low quality, blurry, pixelated, watermark, text, bad proportions, out of frame, disfigured, ugly, distorted, noise, grainy";

/**
 * Get negative prompt based on art style
 */
export function getNegativePrompt(artStyle: ArtStyle): string {
    let styleNegatives = "";

    switch (artStyle) {
        case 'watercolor':
        case 'cartoon':
        case 'storybook':
            // For stylized art, avoid realistic artifacts
            styleNegatives = "photorealistic, photograph, real photo, 3d render, clay";
            break;
        case 'anime':
            styleNegatives = "photorealistic, 3d, western cartoon, sketch, rough";
            break;
        case '3d-clay':
            styleNegatives = "2d, painting, drawing, sketch, cartoon, anime, illustration, flat";
            break;
        case 'fantasy':
            // For realistic/epic fantasy, avoid childish styles
            styleNegatives = "cartoon, sketch, anime, childish, doodle, flat color, simple";
            break;
    }

    return `${BASE_NEGATIVE_PROMPT}, ${styleNegatives}, young, old, aging, wrinkles, beard, mustache, different hair, different clothes, changing face, morphing, deformed, bad hands, missing fingers`;
}

// Strict consistency instruction to append to prompts
const STRICT_CONSISTENCY = "STRICT ADHERENCE TO CHARACTER DESIGN. Do not change age. Do not change clothing. Character must look exactly like the reference description. Maintain consistent facial features and proportions.";

/**
 * Generates a unique seed number for character consistency
 */
export function generateSeed(): number {
    return Math.floor(Math.random() * 999999) + 1;
}

/**
 * Builds a detailed visual description prompt for a character
 */
export function buildVisualPrompt(
    name: string,
    appearance: CharacterAppearance,
    personality: string[],
    additionalDetails?: string
): string {
    const parts: string[] = [];

    // Basic description
    parts.push(`A character named ${name}`);

    // [NEW] Description from user (high priority)
    if (appearance.description) {
        parts.push(appearance.description);
    }

    // Additional User Details (Prioritize this for uniqueness)
    if (additionalDetails) {
        parts.push(additionalDetails);
    }

    // Hair
    if (appearance.hairStyle && appearance.hairColor) {
        parts.push(`with ${appearance.hairStyle.toLowerCase()} ${appearance.hairColor.toLowerCase()} hair`);
    }

    // Eyes
    if (appearance.eyeColor) {
        parts.push(`${appearance.eyeColor.toLowerCase()} eyes`);
    }

    // Skin tone
    if (appearance.skinTone) {
        parts.push(`${appearance.skinTone.toLowerCase()} skin tone`);
    }

    // Clothing
    if (appearance.clothing) {
        parts.push(`wearing ${appearance.clothing.toLowerCase()}`);
    }

    // Accessories
    if (appearance.accessories && appearance.accessories.length > 0) {
        parts.push(`with ${appearance.accessories.join(', ').toLowerCase()}`);
    }

    // Distinctive features
    if (appearance.distinctiveFeatures && appearance.distinctiveFeatures.length > 0) {
        parts.push(`distinctive features: ${appearance.distinctiveFeatures.join(', ').toLowerCase()}`);
    }

    // Personality-based expression
    if (personality.length > 0) {
        const primaryTrait = personality[0].toLowerCase();
        const expressionMap: Record<string, string> = {
            brave: 'confident and determined expression',
            curious: 'wide-eyed and curious expression',
            kind: 'warm and gentle smile',
            funny: 'cheerful and playful expression',
            clever: 'thoughtful and knowing look',
            creative: 'imaginative and dreamy expression',
            adventurous: 'excited and eager expression',
            gentle: 'soft and caring smile'
        };
        const expression = expressionMap[primaryTrait] || 'friendly expression';
        parts.push(expression);
    }

    return parts.join(', ');
}

/**
 * Builds a complete scene prompt with character and art style
 */
export function buildScenePrompt(
    character: Character,
    sceneDescription: string
): string {
    const artStylePrompt = ART_STYLE_PROMPTS[character.artStyle];

    return `${artStylePrompt}

Character: ${character.visualPrompt}

Scene: ${sceneDescription}

Maintain exact character appearance throughout. Consistent proportions and features.
${STRICT_CONSISTENCY}
${QUALITY_BOOSTERS}`;
}

/**
 * Builds a multi-character scene prompt
 */
export function buildMultiCharacterScenePrompt(
    characters: Character[],
    sceneDescription: string,
    artStyle: ArtStyle
): string {
    const artStylePrompt = ART_STYLE_PROMPTS[artStyle];

    const characterDescriptions = characters.map((char, index) => {
        const position = index === 0 ? 'left' : index === 1 ? 'right' : 'center';
        return `- ${char.name}: ${char.visualPrompt} (positioned on the ${position})`;
    }).join('\n');

    return `${artStylePrompt}

Scene with multiple characters:
${characterDescriptions}

They are ${sceneDescription}

All characters interacting naturally. Maintain consistent art style and character proportions throughout.
${STRICT_CONSISTENCY}
${QUALITY_BOOSTERS}`;
}

/**
 * Builds a character sheet prompt for reference generation
 */
export function buildCharacterSheetPrompt(
    name: string,
    appearance: CharacterAppearance,
    personality: string[],
    artStyle: ArtStyle,
    additionalDetails?: string
): string {
    const visualPrompt = buildVisualPrompt(name, appearance, personality, additionalDetails);
    const artStylePrompt = ART_STYLE_PROMPTS[artStyle];

    return `${artStylePrompt}

Character reference sheet for ${name}:
${visualPrompt}

Multiple views: front view, 3/4 view, side profile
Multiple expressions: happy, curious, surprised, determined
White/simple background
Consistent character design across all views
Children's book character style
${QUALITY_BOOSTERS}`;
}
