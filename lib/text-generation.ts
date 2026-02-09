/**
 * Text Generation for Age-Appropriate Storybooks
 * 
 * This module provides text complexity settings and prompts for different age ranges.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AgeRange, Theme, SimpleCharacter } from '@/types/storybook';
import { AGE_RANGE_LABELS, TEXT_COMPLEXITY } from '@/types/storybook';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// ============================================
// STORY OUTLINE GENERATION
// ============================================

export interface StoryOutline {
    title: string;
    dedication: string;
    scenes: SceneOutline[];
}

export interface SceneOutline {
    number: number;
    title: string;
    summary: string;
    sceneDescription: string;
    emotionalTone: string;
}

export async function generateMVPStoryOutline(
    characters: SimpleCharacter[],
    ageRange: AgeRange,
    theme: Theme,
    customTitle?: string
): Promise<StoryOutline> {
    const mainCharacter = characters.find(c => c.role === 'main') || characters[0];
    const supportingCharacters = characters.filter(c => c.role === 'supporting');

    const complexity = TEXT_COMPLEXITY[ageRange];
    const ageInfo = AGE_RANGE_LABELS[ageRange];

    const characterList = characters.map(c =>
        `- ${c.name} (${c.entityType}, ${c.gender}${c.role === 'main' ? ' - main character' : ''})`
    ).join('\n');

    const prompt = `Create a children's storybook outline with exactly 12 scenes.

TARGET AUDIENCE: Children aged ${ageRange} years old (${ageInfo.label})
WRITING STYLE: ${complexity.style}
WORDS PER PAGE: Maximum ${complexity.wordsPerPage} words

THEME: ${theme}
MAIN CHARACTER: ${mainCharacter.name}

CHARACTERS:
${characterList}

STORY REQUIREMENTS:
- Create a heartwarming ${theme}-themed story
- The story should be perfect for a personalized gift book
- Each scene should have a clear visual moment for illustration
- End with a positive, loving conclusion
- ${ageRange === '0-2' ? 'Use lots of sound words, repetition, and simple concepts' : ''}
- ${ageRange === '2-4' ? 'Use simple sentences, familiar concepts, and gentle rhythm' : ''}
- ${ageRange === '5-8' ? 'Include dialogue, adventure elements, and clear plot progression' : ''}
- ${ageRange === '9-12' ? 'Include character development, richer vocabulary, and meaningful themes' : ''}

Respond in strict JSON format:
{
  "title": "${customTitle || 'Create an engaging title'}",
  "dedication": "A short, heartfelt dedication message (1 sentence)",
  "scenes": [
    {
      "number": 1,
      "title": "Scene title",
      "summary": "What happens in this scene (1-2 sentences)",
      "sceneDescription": "Visual description for illustration",
      "emotionalTone": "happy/excited/curious/loving/brave/peaceful"
    }
  ]
}

Create exactly 12 scenes. Make sure the story flows naturally from scene to scene.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Failed to parse story outline from AI response');
    }

    return JSON.parse(jsonMatch[0]) as StoryOutline;
}

// ============================================
// PAGE TEXT GENERATION
// ============================================

export interface PageText {
    text: string;
    visualPrompt: string;
}

export async function generatePageText(
    sceneOutline: SceneOutline,
    characters: SimpleCharacter[],
    ageRange: AgeRange,
    previousPageText?: string
): Promise<PageText> {
    const complexity = TEXT_COMPLEXITY[ageRange];
    const ageInfo = AGE_RANGE_LABELS[ageRange];

    const characterNames = characters.map(c => c.name).join(', ');

    const prompt = `Write the text for a single page of a children's storybook.

TARGET AUDIENCE: Children aged ${ageRange} years old (${ageInfo.label})
WRITING STYLE: ${complexity.style}
TARGET WORD COUNT: ${complexity.wordsPerPage} words (THIS IS IMPORTANT - write close to this amount)

SCENE: ${sceneOutline.title}
${sceneOutline.summary}
EMOTIONAL TONE: ${sceneOutline.emotionalTone}
CHARACTERS IN SCENE: ${characterNames}

${previousPageText ? `PREVIOUS PAGE ENDED WITH: "${previousPageText.slice(-150)}..."` : 'This is the opening of the story.'}

INSTRUCTIONS:
${ageRange === '0-2' ? `
- Use 1-5 simple words or short phrases
- Include sound words like "splash!", "boom!", "whoosh!"
- Repetition is great: "The ball went up, up, up!"
- Focus on sensory experiences
` : ''}
${ageRange === '2-4' ? `
- Use 15-25 simple words
- Short, complete sentences
- Familiar, everyday vocabulary
- Light rhyming is nice but not required
` : ''}
${ageRange === '5-8' ? `
- Write 80-120 words - this is essential for a real book feel
- Include engaging dialogue between characters
- Use vivid sensory descriptions (what characters see, hear, feel)
- Show character emotions through actions and expressions
- Create tension and curiosity to keep young readers engaged
- Use a mix of short and longer sentences for rhythm
- The text should feel substantial, like a real published children's book
` : ''}
${ageRange === '9-12' ? `
- Write 150-200 words - this is essential for a chapter book feel
- Include rich, immersive descriptions of settings and atmosphere
- Show character introspection - thoughts, doubts, hopes, fears
- Use sophisticated vocabulary appropriate for pre-teens
- Create complex emotional moments and character development
- Include dialogue that reveals character personality
- Balance action with reflection and description
- The text should feel like a proper young adult novel
` : ''}

Respond in JSON format:
{
  "text": "The page text exactly as it should appear in the book",
  "visualPrompt": "Updated visual description for the illustration based on the text"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Failed to parse page text from AI response');
    }

    return JSON.parse(jsonMatch[0]) as PageText;
}

// ============================================
// COVER TEXT GENERATION
// ============================================

export async function generateCoverElements(
    title: string,
    mainCharacter: SimpleCharacter,
    theme: Theme
): Promise<{ subtitle?: string; tagline?: string }> {
    const prompt = `Create optional cover text elements for a personalized children's storybook.

TITLE: ${title}
MAIN CHARACTER: ${mainCharacter.name}
THEME: ${theme}

Create a short subtitle and tagline that would work on a book cover.
Keep it simple and heartwarming.

Respond in JSON format:
{
  "subtitle": "Optional subtitle (5-8 words max, or null)",
  "tagline": "Optional tagline for back cover (10-15 words, or null)"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        return {};
    }

    return JSON.parse(jsonMatch[0]);
}

// ============================================
// BACK COVER SUMMARY
// ============================================

export async function generateBackCoverSummary(
    title: string,
    storyOutline: StoryOutline,
    characters: SimpleCharacter[],
    ageRange: AgeRange
): Promise<string> {
    const complexity = TEXT_COMPLEXITY[ageRange];

    const prompt = `Write a brief back cover summary for this children's storybook.

TITLE: ${title}
MAIN CHARACTER: ${characters.find(c => c.role === 'main')?.name || characters[0].name}
STORY OVERVIEW: ${storyOutline.scenes.slice(0, 3).map(s => s.summary).join(' ')}

TARGET AUDIENCE: Children aged ${ageRange}
MAXIMUM WORDS: ${Math.min(complexity.wordsPerPage * 2, 100)}

Write an engaging summary that:
- Introduces the main character
- Hints at the adventure without spoilers
- Creates excitement to read the book
- Ends with an inviting question or statement

Return ONLY the summary text, no JSON.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

// ============================================
// ILLUSTRATION PROMPTS
// ============================================

// Character description for visual consistency
export interface CharacterVisualDescription {
    name: string;
    description: string;
    consistencyKeywords: string;
}

/**
 * Generate a detailed visual description for a character to ensure consistency
 */
export async function generateCharacterVisualDescription(
    character: SimpleCharacter
): Promise<CharacterVisualDescription> {
    const genderDesc = character.gender === 'male' ? 'boy' : character.gender === 'female' ? 'girl' : 'child';

    const prompt = `Analyze this character and create a detailed visual description for illustration consistency.

CHARACTER: ${character.name}
TYPE: ${character.entityType}
GENDER: ${character.gender}

Create a detailed visual description that can be used in every illustration to maintain consistency.
Focus on permanent visual features that should remain the same in every scene.

Respond in JSON format:
{
  "description": "A detailed 2-3 sentence description of the character's appearance including: approximate age (if human), hair color and style, eye color, skin tone, face shape, typical expression, distinctive features",
  "consistencyKeywords": "comma-separated keywords for consistent generation: hair_color, eye_color, skin_tone, clothing_style, any_distinctive_features"
}`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                name: character.name,
                description: parsed.description,
                consistencyKeywords: parsed.consistencyKeywords
            };
        }
    } catch (e) {
        console.error('Failed to generate character description:', e);
    }

    // Fallback description
    return {
        name: character.name,
        description: `${character.name}, a ${genderDesc} character`,
        consistencyKeywords: `${genderDesc}, friendly expression, natural look`
    };
}

// Pixar 3D Cinematic quality boosters
const PIXAR_3D_QUALITY = `
Pixar style 3D cinematic scene, high quality 3D render, ultra detailed,
global illumination, soft shadows, depth of field, warm tones,
cinematic composition, volumetric lighting, subsurface scattering,
professional Pixar/Disney quality animation, octane render, ray tracing
`.trim().replace(/\n/g, ' ');

const PIXAR_3D_NEGATIVE = `
2D, flat, cartoon, anime, sketch, drawing, painting, illustration,
low quality, blurry, pixelated, bad anatomy, distorted features,
text, words, logos, watermark, signature, ugly, deformed,
extra limbs, missing limbs, bad proportions, gross proportions
`.trim().replace(/\n/g, ' ');

// Photorealistic quality boosters (keeping for backwards compatibility)
const PHOTOREALISTIC_QUALITY = `
photorealistic, hyperrealistic, 8k resolution, professional photography,
cinematic lighting with soft key light and fill light, shallow depth of field,
natural skin textures with subtle imperfections, realistic eye reflections and catchlights,
subsurface scattering on skin, detailed hair strands, volumetric lighting,
shot on Sony A7R IV, 85mm lens, f/1.8 aperture, golden hour lighting
`.trim().replace(/\n/g, ' ');

const PHOTOREALISTIC_NEGATIVE = `
cartoon, anime, illustration, painting, drawing, sketch, artwork,
plastic skin, mannequin-like, uncanny valley, artificial, CGI look,
oversaturated colors, unrealistic lighting, flat lighting,
bad anatomy, distorted features, extra limbs, missing limbs,
blurry, low quality, pixelated, text, watermark, signature
`.trim().replace(/\n/g, ' ');

/**
 * Generate a structured illustration prompt with character references and actions
 * Uses Pixar 3D cinematic style by default for best quality
 */
export async function generateIllustrationPromptForScene(
    scene: SceneOutline,
    characters: SimpleCharacter[],
    artStyle: string,
    globalSeed: number,
    characterDescriptions?: CharacterVisualDescription[]
): Promise<string> {
    // Determine the art style type
    const isPixar3D = artStyle.toLowerCase().includes('pixar') ||
        artStyle.toLowerCase().includes('3d') ||
        artStyle.toLowerCase().includes('cinematic') ||
        artStyle.toLowerCase().includes('soft-illustration') ||
        artStyle.toLowerCase().includes('modern-cartoon');

    const isPhotorealistic = artStyle.toLowerCase().includes('photorealistic') ||
        artStyle.toLowerCase().includes('realistic');

    // Build character action descriptions with reference images
    const characterActions = characters.map((char, index) => {
        const charDesc = characterDescriptions?.find(d => d.name === char.name);
        const entityDesc = char.entityType === 'human' ?
            `${char.gender} child` :
            char.entityType === 'animal' ?
                'pet/animal' : 'character';

        return `Character ${index + 1} (${char.name}, ${entityDesc}): [reference image ${index + 1}] – [ACTION_PLACEHOLDER_${index + 1}]`;
    }).join('\n\n');

    // Create prompt to generate character actions for the scene
    const actionPrompt = `You are creating an illustration prompt for a Pixar-style 3D children's book scene.

SCENE DESCRIPTION: ${scene.sceneDescription}
EMOTIONAL TONE: ${scene.emotionalTone}

CHARACTERS IN SCENE:
${characters.map((c, i) => `- ${c.name} (${c.entityType}, ${c.gender}, role: ${c.role})`).join('\n')}

For each character, describe their SPECIFIC action, pose, and expression in this scene.
Use natural, cozy, warm descriptions suitable for a children's book.

Respond in JSON format:
{
  "setting": "Detailed description of the environment (e.g., 'Cozy home interior, morning sunlight coming through the window, warm soft light, peaceful atmosphere')",
  "characterActions": [
    {
      "name": "${characters[0]?.name || 'Character 1'}",
      "action": "specific pose and action (e.g., 'sitting on the floor, playing with a small toy, focused and joyful expression')"
    }${characters.length > 1 ? `,
    {
      "name": "${characters[1]?.name || 'Character 2'}",
      "action": "specific pose and action"
    }` : ''}${characters.length > 2 ? `,
    {
      "name": "${characters[2]?.name || 'Character 3'}",
      "action": "specific pose and action"
    }` : ''}
  ]
}`;

    let setting = scene.sceneDescription;
    const charActions: { name: string; action: string }[] = [];

    try {
        const result = await model.generateContent(actionPrompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            setting = parsed.setting || setting;
            if (parsed.characterActions) {
                charActions.push(...parsed.characterActions);
            }
        }
    } catch (e) {
        console.error('Failed to generate character actions:', e);
        // Fallback: generic actions
        characters.forEach(c => {
            charActions.push({
                name: c.name,
                action: c.role === 'main' ? 'in the center of the scene, engaged in the main action' : 'nearby, watching with interest'
            });
        });
    }

    // Build the final structured prompt in the user's preferred format
    let finalPrompt = `Pixar style 3D cinematic scene. ${setting}.\n\n`;

    characters.forEach((char, index) => {
        const charDesc = characterDescriptions?.find(d => d.name === char.name);
        const action = charActions.find(a => a.name === char.name)?.action ||
            `in the scene with ${scene.emotionalTone} expression`;

        const entityDesc = char.entityType === 'human' ?
            (char.gender === 'male' ? 'boy' : char.gender === 'female' ? 'girl' : 'child') :
            char.entityType === 'animal' ? 'pet' : 'character';

        // Include character description for visual consistency
        const visualDesc = charDesc ? ` (${charDesc.consistencyKeywords})` : '';

        finalPrompt += `Character ${index + 1}: [reference image ${index + 1}]${visualDesc} – ${action}\n\n`;
    });

    // Add quality keywords
    finalPrompt += `Cinematic composition, soft shadows, depth of field, warm tones.\n`;
    finalPrompt += `${PIXAR_3D_QUALITY}\n`;
    finalPrompt += `No text, no logos.`;

    return finalPrompt;
}

/**
 * Get the negative prompt for image generation based on art style
 */
export function getNegativePrompt(artStyle: string): string {
    const isPixar3D = artStyle.toLowerCase().includes('pixar') ||
        artStyle.toLowerCase().includes('3d') ||
        artStyle.toLowerCase().includes('cinematic') ||
        artStyle.toLowerCase().includes('soft-illustration') ||
        artStyle.toLowerCase().includes('modern-cartoon');

    const isPhotorealistic = artStyle.toLowerCase().includes('photorealistic') ||
        artStyle.toLowerCase().includes('realistic');

    if (isPixar3D) {
        return PIXAR_3D_NEGATIVE;
    }

    if (isPhotorealistic) {
        return PHOTOREALISTIC_NEGATIVE;
    }

    return 'blurry, bad quality, distorted, text, words, letters, low resolution, pixelated';
}

// ============================================
// COVER ILLUSTRATION PROMPT
// ============================================

export async function generateCoverIllustrationPrompt(
    title: string,
    characters: SimpleCharacter[],
    theme: Theme,
    artStyle: string,
    characterDescriptions?: CharacterVisualDescription[]
): Promise<string> {
    const mainCharacter = characters.find(c => c.role === 'main') || characters[0];
    const mainCharDesc = characterDescriptions?.find(d => d.name === mainCharacter.name);

    // Use Pixar 3D style for covers
    const coverPrompt = `Pixar style 3D cinematic book cover illustration.

Theme: ${theme} adventure
Setting: A magical, inviting scene that captures the spirit of ${theme}

Main Character: [reference image 1]${mainCharDesc ? ` (${mainCharDesc.consistencyKeywords})` : ''} – standing prominently in the center, ${theme === 'adventure' ? 'looking excited and ready for adventure' : theme === 'bedtime' ? 'peaceful and cozy' : 'happy and curious'}

Background: Beautiful, atmospheric environment matching the ${theme} theme
Lighting: Warm golden hour light, soft and inviting, volumetric rays

${PIXAR_3D_QUALITY}
Portrait orientation (3:4 ratio), perfect for book cover.
No text, no titles, no logos.`;

    return coverPrompt;
}

