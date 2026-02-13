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
// Dedicated model for detailed visual descriptions (User Request: gemini 3.0 flash preview)
const modelCharacterDesc = genAI.getGenerativeModel({ model: 'gemini-3.0-flash-preview' });

// ============================================
// HELPER: RETRY LOGIC FOR API CALLS
// ============================================

async function generateWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 2000
): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error: any) {
            lastError = error;

            // Check if it's a rate limit error (429) or server error (5xx)
            // Google Generative AI throws errors with status or message
            const isRateLimit = error.message?.includes('429') || error.status === 429 || error.message?.includes('Too Many Requests');
            const isServerError = error.message?.includes('500') || error.status === 500;

            if (!isRateLimit && !isServerError) {
                throw error; // Don't retry for other errors (e.g. invalid prompt)
            }

            if (attempt === maxRetries - 1) {
                console.error(`[generateWithRetry] All ${maxRetries} attempts failed. Last error:`, error);
                throw error;
            }

            const delay = initialDelay * Math.pow(2, attempt); // Exponential backoff
            console.log(`[generateWithRetry] Attempt ${attempt + 1} failed (${isRateLimit ? 'Rate Limit' : 'Error'}). Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

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
    customTitle?: string,
    description?: string, // User context/details
    subject?: string // Specific story subject/activity
): Promise<StoryOutline> {
    const mainCharacter = characters.find(c => c.role === 'main') || characters[0];
    const supportingCharacters = characters.filter(c => c.role === 'supporting');

    const complexity = TEXT_COMPLEXITY[ageRange];
    const ageInfo = AGE_RANGE_LABELS[ageRange];

    const characterList = characters.map(c => {
        let details = `- ${c.name} (${c.entityType}, ${c.gender}${c.role === 'main' ? ' - main character' : ''})`;
        if (c.description) details += `: ${c.description}`;
        if (c.clothingStyle) details += ` (Wearing: ${c.clothingStyle})`;
        return details;
    }).join('\n');

    // CRITICAL: If a custom title is provided, use it directly!
    const titleInstruction = customTitle
        ? `use the provided title "${customTitle}" exactly.`
        : `create a short, engaging title (3-8 words). The title must be a single string, NO synopsis, NO outline summary. Just the title suitable for a book cover.`;

    const prompt = `Create a children's storybook outline with exactly 12 scenes.

TARGET AUDIENCE: Children aged ${ageRange} years old (${ageInfo.label})
WRITING STYLE: ${complexity.style}
WORDS PER PAGE: Maximum ${complexity.wordsPerPage} words

THEME (Atmosphere/Setting): ${theme}
${subject ? `STORY SUBJECT (Central Plot/Activity): ${subject}` : ''}
MAIN CHARACTER: ${mainCharacter.name}
${description ? `USER CONTEXT: "${description}"\nCRITICAL INSTRUCTION: The story must revolve around the "STORY SUBJECT" while incorporating the "USER CONTEXT" details naturally.` : ''}

CHARACTERS:
${characterList}

STORY REQUIREMENTS:
- Create a ${theme}-themed story
- The story should be perfect for a personalized gift book
- Each scene should have a clear visual moment for illustration
- End with a positive, loving conclusion
- ${ageRange === '0-2' ? 'Use lots of sound words, repetition, and simple concepts' : ''}
- ${ageRange === '2-4' ? 'Use simple sentences, familiar concepts, and gentle rhythm' : ''}
- ${ageRange === '5-8' ? 'Include dialogue, adventure elements, and clear plot progression' : ''}
- ${ageRange === '9-12' ? 'Include character development, richer vocabulary, and meaningful themes' : ''}

Respond in strict JSON format:
{
  "title": "${customTitle || 'The exact title of the book'}",
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

Create exactly 12 scenes. Make sure the story flows naturally from scene to scene.
CRITICAL FOR TITLE: ${titleInstruction}
`;

    const result = await generateWithRetry(() => model.generateContent(prompt));
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

    const characterNames = characters.map(c => `${c.name} (${c.role})`).join(', ');

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
- The MAIN character (${characters.find(c => c.role === 'main')?.name}) should drive the action.
- Ensure the story flows naturally from the previous page.
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
- Use clear, easy-to-understand vocabulary but complex sentence structures (avoid overly difficult words)
- Create complex emotional moments and character development
- Include dialogue that reveals character personality
- Balance action with reflection and description
- The text should feel like a proper young adult novel but accessible
` : ''}

Respond in JSON format:
{
  "text": "The page text exactly as it should appear in the book",
  "visualPrompt": "Updated visual description for the illustration based on the text. START with the main character action."
}`;

    const result = await generateWithRetry(() => model.generateContent(prompt));
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

    const result = await generateWithRetry(() => model.generateContent(prompt));
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

    const result = await generateWithRetry(() => model.generateContent(prompt));
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
    visualPrompt: string;
}

/**
 * Generate a detailed visual description for a character to ensure consistency
 */
export async function generateCharacterVisualDescription(
    character: SimpleCharacter
): Promise<CharacterVisualDescription> {
    let genderDesc = 'character';
    if (character.entityType === 'human') {
        genderDesc = character.gender === 'male' ? 'boy' : character.gender === 'female' ? 'girl' : 'child';
    } else if (character.entityType === 'animal') {
        genderDesc = character.description || 'animal';
    } else {
        genderDesc = character.description || 'object';
    }

    const isAnimal = character.entityType === 'animal';
    const isObject = character.entityType === 'object';

    let prompt = "";

    if (isAnimal) {
        prompt = `Analyze this ANIMAL character and create a detailed visual description for illustration consistency.

CHARACTER: ${character.name}
TYPE: ${character.entityType}
GENDER: ${character.gender}
DESCRIPTION: ${character.description || ''}

Create a detailed visual description for a Pixar-style 3D animated movie.
Focus on: Fur/skin texture, body shape, distinct markings, ears, tail, and expression.

CRITICAL CONSTRAINTS for ANIMALS:
- Do NOT describe human features (no "blonde hair", no "fair skin", no "human hands").
- Use terms like "fur", "scales", "feathers", "snout", "paws".
- Keep the description focused purely on the animal's physical traits.
- If the user provided a description (${character.description}), prioritise those details (e.g. "Dalmatian", "Golden Retriever").

Respond in JSON format:
{
  "description": "A detailed 2-3 sentence description of the animal's appearance",
  "consistencyKeywords": "comma-separated keywords: fur_color, breed, distinct_features, texture",
  "visualPrompt": "A concise, comma-separated visual description string optimized for image generation (e.g. 'golden retriever puppy, fluffy golden fur, floppy ears, happy expression, red collar')"
}`;
    } else if (isObject) {
        prompt = `Analyze this OBJECT character and create a detailed visual description.

CHARACTER: ${character.name}
TYPE: ${character.entityType}
DESCRIPTION: ${character.description || ''}

Create a detailed visual description for a Pixar-style 3D animated movie.
Focus on: Material, texture, shape, color, and anthropomorphic features if applicable (eyes, mouth).

Respond in JSON format:
{
  "description": "A detailed description of the object",
  "consistencyKeywords": "comma-separated keywords: material, color, shape",
  "visualPrompt": "concise visual description"
}`;
    } else {
        // HUMAN PROMPT
        prompt = `Analyze this HUMAN character and create a detailed visual description for illustration consistency.

CHARACTER: ${character.name}
TYPE: ${character.entityType}
GENDER: ${character.gender}
DESCRIPTION: ${character.description || ''}

Create a detailed visual description for a Pixar-style 3D animated movie.
Focus on permanent visual features: hair, eyes, skin tone, face shape.

CRITICAL: accurately reflect the body type from reference photos.
- Do NOT describe characters as "muscular", "ripped", or "athletic" unless explicitly stated.
- For children, use terms like "child-like", "small", "cute".
- For average adults, use "average build", "slim", or "soft features".

Respond in JSON format:
{
  "description": "A detailed 2-3 sentence description including age, hair, eyes, skin, face shape",
  "consistencyKeywords": "comma-separated keywords: hair_color, eye_color, skin_tone, clothing_style",
  "visualPrompt": "A concise, comma-separated visual description string"
}`;
    }

    try {
        const result = await generateWithRetry(() => modelCharacterDesc.generateContent(prompt));
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                name: character.name,
                description: parsed.description,
                consistencyKeywords: parsed.consistencyKeywords,
                visualPrompt: parsed.visualPrompt || parsed.consistencyKeywords
            };
        }
    } catch (e) {
        console.error('Failed to generate character description:', e);
    }

    // Fallback description
    return {
        name: character.name,
        description: `${character.name}, a ${genderDesc} character`,
        consistencyKeywords: `${genderDesc}, friendly expression, natural look`,
        visualPrompt: `${genderDesc}, friendly expression, natural look`
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
/**
 * Generate a structured illustration prompt with character references and actions
 * Uses the user's professional structured format
 */
export async function generateIllustrationPromptForScene(
    scene: SceneOutline,
    characters: SimpleCharacter[],
    artStyle: string,
    globalSeed: number,
    characterDescriptions?: CharacterVisualDescription[]
): Promise<string> {

    // 1. Generate Character Actions for this specific scene
    const actionPrompt = `You are an expert art director for a Pixar-style 3D animated movie.
    
SCENE CONTEXT:
${scene.sceneDescription}
EMOTIONAL TONE: ${scene.emotionalTone}

CHARACTERS IN SCENE:
${characters.map((c, i) => {
        const clothingNote = c.useFixedClothing
            ? "WEARING FIXED OUTFIT (Do not describe clothing)"
            : "WEARING SCENE-APPROPRIATE CLOTHING (Describe their outfit matching the scene/theme)";

        // Critical: Strict species definition
        const speciesDef = c.entityType === 'human'
            ? `HUMAN (${c.gender})`
            : `NON-HUMAN ANIMAL (${c.description || c.entityType})`;

        return `- ${c.name} [${speciesDef}] (role: ${c.role}) - ${clothingNote}`;
    }).join('\n')}

Task: Describe the EXACT ACTION and POSE for each character in this specific scene.

CRITICAL INSTRUCTIONS:
1. **NO SPECIES HALLUCINATION**: You must respect the "NON-HUMAN ANIMAL" definition exactly. 
   - If a character is a "Golden Retriever", DO NOT describe them as a "fox", "wolf", "mouse", or anything else.
   - DO NOT add new animals that are not in the character list.
2. **ACTION ONLY**: Describe *only* what the character is DOING. 
   - DO NOT re-describe their appearance (e.g. do NOT say "Tommay, a small brown fox...").
   - START the sentence with the action verb or the character's name.
   - Example: "Jumps over the log with excitement" or "Tommay barks happily at the butterfly."
3. **PHYSICAL GROUNDING**: Actions must be physically possible for that entity type.
   - Animals should act like animals (on four legs, sniffing, running), unless it's a "fantasy" setting, but even then, maintain their species identity.

Respond in JSON format:
{
  "setting": "Detailed description of the environment/background only (NO characters). Focus on lighting, atmosphere, and small details.",
  "lighting": "Cinematic lighting description (e.g., 'Soft volumetric lighting, warm candlelight, deep shadows')",
  "characterActions": [
    {
      "name": "${characters[0]?.name}",
      "action": "Specific action/pose ONLY. Do not describe the character's appearance/species."
    }
    // ... for other characters
  ]
}`;

    let setting = scene.sceneDescription;
    let lighting = "Cinematic framing, soft volumetric lighting, realistic global illumination, subtle depth of field, shallow focus on the main subject, warm color palette, high contrast between light and shadow, filmic atmosphere, naturalistic reflections.";
    const charActions: { name: string; action: string }[] = [];

    try {
        const result = await generateWithRetry(() => model.generateContent(actionPrompt));
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.setting) setting = parsed.setting;
            if (parsed.lighting) lighting = parsed.lighting + ", realistic global illumination, subtle depth of field.";
            if (parsed.characterActions && Array.isArray(parsed.characterActions)) {
                charActions.push(...parsed.characterActions);
            }
        }
    } catch (e) {
        console.error('Failed to generate character actions:', e);
        // Fallback: generic actions
        characters.forEach(c => {
            charActions.push({
                name: c.name,
                action: c.role === 'main' ? 'Standing in the center, looking engaged' : 'Standing nearby, watching'
            });
        });
    }

    // 2. Build the Final Professional Prompt
    let finalPrompt = `[SCENE]\n\n`;
    finalPrompt += `Pixar-style 3D cinematic scene. ${setting}. The mood is ${scene.emotionalTone}.\n\n`;

    finalPrompt += `[COMPOSITION & LIGHTING]\n\n`;
    finalPrompt += `${lighting}\n\n`;

    finalPrompt += `[CHARACTER ACTIONS]\n\n`;

    characters.forEach((char, index) => {
        const action = charActions.find(a => a.name === char.name)?.action ||
            `in the scene with ${scene.emotionalTone} expression`;

        // EXACT TEMPLATE MATCH: 
        // Character N (Name) — FIXED APPEARANCE (reference image N)
        // ACTION IN THIS SCENE:
        // [Action Text]
        finalPrompt += `Character ${index + 1} (${char.name}) — FIXED APPEARANCE (reference image ${index + 1})\n\n`;
        finalPrompt += `ACTION IN THIS SCENE:\n`;
        finalPrompt += `${action}\n\n`;
    });

    finalPrompt += `[RENDER DEFAULT]\n\n`;
    finalPrompt += `High-quality 3D render, ultra-detailed textures, physically accurate global illumination, realistic volumetric light, cinematic camera lens, photorealistic materials, clean composition. No text, no logos.`;

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
    characterDescriptions?: CharacterVisualDescription[],
    characterImageCounts?: number[] // Optional: How many images per character
): Promise<string> {
    const mainCharacter = characters.find(c => c.role === 'main') || characters[0];

    // 1. Generate Cover Actions/Composition using LLM
    const coverActionPrompt = `You are an expert art director for a Pixar-style 3D animated movie.
    
    Task: Design the COVER ART for a children's book.
    TITLE: ${title}
    THEME: ${theme}
    ART STYLE: ${artStyle}
    
    CHARACTERS TO FEATURE:
    ${characters.map(c => `- ${c.name} (${c.entityType}, ${c.gender})`).join('\n')}
    
    Design a compelling, high-quality cover composition.
    - The main character (${mainCharacter.name}) should be the focal point.
    - The lighting should be magical and cinematic (Golden Hour / Volumetric).
    - The background should clearly establish the ${theme} setting.
    - Action should be inviting and adventurous.
    
    Respond in JSON format:
    {
      "setting": "Detailed background description (NO characters).",
      "lighting": "Cinematic lighting description.",
      "characterActions": [
        {
          "name": "${mainCharacter.name}",
          "action": "Specific commanding pose, looking at camera or into distance, engaging expression."
        }
        // ... other characters if present
      ]
    }`;

    let setting = `A magical ${theme} world`;
    let lighting = "Warm golden hour light, soft and inviting, volumetric rays, cinematic depth of field";
    const charActions: { name: string; action: string }[] = [];

    try {
        const result = await generateWithRetry(() => model.generateContent(coverActionPrompt));
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.setting) setting = parsed.setting;
            if (parsed.lighting) lighting = parsed.lighting;
            if (parsed.characterActions && Array.isArray(parsed.characterActions)) {
                charActions.push(...parsed.characterActions);
            }
        }
    } catch (e) {
        console.error("Failed to generate cover actions:", e);
    }

    // 2. Build Structural Prompt (Same format as scenes)
    let finalPrompt = `[SCENE]\n\n`;
    finalPrompt += `Pixar-style 3D cinematic book cover. ${setting}. \n\n`;

    finalPrompt += `[COMPOSITION & LIGHTING]\n\n`;
    finalPrompt += `${lighting}, 8k resolution, ultra-detailed textures, physically accurate global illumination. Portrait orientation.\n\n`;

    finalPrompt += `[CHARACTER ACTIONS]\n\n`;

    characters.forEach((char, index) => {
        const action = charActions.find(a => a.name === char.name)?.action ||
            `Standing prominently in the center, smiling warmly, inviting pose`;

        // EXACT TEMPLATE MATCH:
        // Character N (Name) — FIXED APPEARANCE (reference image N)
        // ACTION IN THIS SCENE:
        // [Action Text]
        finalPrompt += `Character ${index + 1} (${char.name}) — FIXED APPEARANCE (reference image ${index + 1})\n\n`;
        finalPrompt += `ACTION IN THIS SCENE:\n`;
        finalPrompt += `${action}\n\n`;
    });

    finalPrompt += `[RENDER DEFAULT]\n\n`;
    finalPrompt += `High-quality 3D render, ultra-detailed textures, physically accurate global illumination, realistic volumetric light, cinematic camera lens, photorealistic materials, clean composition. No text, no logos.`;

    return finalPrompt;
}
