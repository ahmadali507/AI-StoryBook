import {
    Character,
    CharacterAppearance,
    ArtStyle,
    ART_STYLE_PROMPTS
} from '@/types/storybook';

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
    personality: string[]
): string {
    const parts: string[] = [];

    // Basic description
    parts.push(`A character named ${name}`);

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

Maintain exact character appearance throughout. Consistent proportions and features.`;
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

All characters interacting naturally. Maintain consistent art style and character proportions throughout.`;
}

/**
 * Builds a character sheet prompt for reference generation
 */
export function buildCharacterSheetPrompt(
    name: string,
    appearance: CharacterAppearance,
    personality: string[],
    artStyle: ArtStyle
): string {
    const visualPrompt = buildVisualPrompt(name, appearance, personality);
    const artStylePrompt = ART_STYLE_PROMPTS[artStyle];

    return `${artStylePrompt}

Character reference sheet for ${name}:
${visualPrompt}

Multiple views: front view, 3/4 view, side profile
Multiple expressions: happy, curious, surprised, determined
White/simple background
Consistent character design across all views
Children's book character style`;
}
