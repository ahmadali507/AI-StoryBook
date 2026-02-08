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
MAXIMUM WORDS: ${complexity.wordsPerPage}

SCENE: ${sceneOutline.title}
${sceneOutline.summary}
EMOTIONAL TONE: ${sceneOutline.emotionalTone}
CHARACTERS IN SCENE: ${characterNames}

${previousPageText ? `PREVIOUS PAGE ENDED WITH: "${previousPageText.slice(-100)}..."` : 'This is the opening of the story.'}

INSTRUCTIONS:
${ageRange === '0-2' ? `
- Use 1-5 simple words or short phrases
- Include sound words like "splash!", "boom!", "whoosh!"
- Repetition is great: "The ball went up, up, up!"
- Focus on sensory experiences
` : ''}
${ageRange === '2-4' ? `
- Use 10-20 simple words
- Short, complete sentences
- Familiar, everyday vocabulary
- Light rhyming is nice but not required
` : ''}
${ageRange === '5-8' ? `
- Use 30-50 words
- Include some dialogue
- Clear action and description
- Engaging pace with variety
` : ''}
${ageRange === '9-12' ? `
- Use 60-100 words
- Richer vocabulary and description
- Character thoughts and feelings
- More complex sentence structures
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

export async function generateIllustrationPromptForScene(
    scene: SceneOutline,
    characters: SimpleCharacter[],
    artStyle: string,
    globalSeed: number
): Promise<string> {
    const characterDescriptions = characters.map(c => {
        const typeDesc = c.entityType === 'human' ?
            `a ${c.gender} child` :
            c.entityType === 'animal' ?
                'an animal character' :
                'an animated object character';
        return `${c.name} (${typeDesc})`;
    }).join(', ');

    const prompt = `Create a detailed illustration prompt for a children's book scene.

CHARACTERS: ${characterDescriptions}
SCENE: ${scene.sceneDescription}
EMOTIONAL TONE: ${scene.emotionalTone}
ART STYLE: ${artStyle} style children's book illustration

Create a single, detailed illustration prompt that includes:
- Character positions and expressions matching the ${scene.emotionalTone} tone
- Background setting details
- Lighting (warm, soft lighting typical of children's books)
- Key props and visual elements
- Style guidance: ${artStyle}, child-friendly, colorful, whimsical

IMPORTANT: 
- Describe characters by their visual appearance for consistency
- Keep the scene child-appropriate and heartwarming
- Focus on the emotional moment of the scene

Return ONLY the illustration prompt text (150-200 words), no JSON.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

// ============================================
// COVER ILLUSTRATION PROMPT
// ============================================

export async function generateCoverIllustrationPrompt(
    title: string,
    characters: SimpleCharacter[],
    theme: Theme,
    artStyle: string
): Promise<string> {
    const mainCharacter = characters.find(c => c.role === 'main') || characters[0];

    const prompt = `Create a detailed illustration prompt for a children's storybook cover.

TITLE: ${title}
MAIN CHARACTER: ${mainCharacter.name} (${mainCharacter.entityType}, ${mainCharacter.gender})
THEME: ${theme}
ART STYLE: ${artStyle}

Create a captivating book cover illustration prompt that:
- Features the main character prominently
- Captures the ${theme} theme
- Has a magical, inviting atmosphere
- Uses the ${artStyle} art style
- Is suitable for a professional children's book cover
- Has good composition for portrait orientation (3:4 ratio)

DO NOT include any text, words, or titles in the illustration.

Return ONLY the illustration prompt text (150-200 words), no JSON.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}
