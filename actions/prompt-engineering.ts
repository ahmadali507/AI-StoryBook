import { SimpleCharacter, CharacterVisualDescription     } from "@/types/storybook";

/**
 * Construct a structured prompt for Seedream 4.5 with character references
 */
export function buildScenePrompt(
    sceneDescription: string,
    characters: SimpleCharacter[],
    characterDescriptions: CharacterVisualDescription[],
    artStyle: string = "Pixar style 3D cinematic scene",
    lighting: string = "Cinematic composition, soft shadows, depth of field, warm tones"
): string {
    // 1. Scene Setting
    let prompt = `${artStyle}. ${sceneDescription}, ${lighting}.\n\n`;

    // 2. Character Actions (Mapped to References)
    characters.forEach((char, index) => {
        // Find specific action/expression from scene description if possible,
        // otherwise use a generic placeholder that the model will fill from context
        // For now, we rely on the sceneDescription to contain the action,
        // and we reinforce the identity here.

        // However, the user's format was: "Character 1: [reference image 1] – [Action], [Expression]"
        // We will try to extract action from context or just state their presence
        const charDesc = characterDescriptions.find(d => d.name === char.name);
        const appearance = charDesc ? charDesc.visualPrompt : char.appearance;

        prompt += `Character ${index + 1}: [reference image ${index + 1}] – ${char.name}, ${appearance}\n`;
    });

    // 3. Style enforcement
    prompt += `\nHigh quality 3D render, ultra detailed, global illumination. No text, no logos.`;

    return prompt;
}

/**
 * Get the list of reference image URLs for a scene
 * IMPORTANT: The order MUST match the "Character X" indices in the prompt
 */
export function getSceneReferenceImages(characters: SimpleCharacter[]): string[] {
    return characters
        .map(c => c.referenceImageUrl || c.photoUrl)
        .filter(url => !!url) as string[];
}
