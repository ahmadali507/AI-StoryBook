import { GoogleGenerativeAI } from '@google/generative-ai';
import { Character, StorySetting, STORY_SETTING_LABELS } from '@/types/storybook';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

interface StoryOutline {
    title: string;
    chapters: ChapterOutline[];
}

interface ChapterOutline {
    number: number;
    title: string;
    summary: string;
    sceneDescription: string;
}

/**
 * Generate a story outline with chapter summaries
 */
export async function generateStoryOutline(
    characters: Character[],
    setting: StorySetting,
    targetChapters: number,
    theme?: string,
    additionalDetails?: string
): Promise<StoryOutline> {
    const characterDescriptions = characters.map(c =>
        `${c.name}: ${c.personality.join(', ')}`
    ).join('\n');

    const settingName = STORY_SETTING_LABELS[setting];

    const prompt = `Create a comprehensive storybook outline with exactly ${targetChapters} chapters.

Characters:
${characterDescriptions}

Setting: ${settingName}
${theme ? `Theme: ${theme}` : ''}
${additionalDetails ? `Additional details: ${additionalDetails}` : ''}

Requirements:
- Age-appropriate for children/adults.
- Each chapter should be engaging and move the story forward
- Include clear scene descriptions for illustrations
- End with a positive, heartwarming conclusion

Respond in JSON format:
{
  "title": "Story title",
  "chapters": [
    {
      "number": 1,
      "title": "Chapter title",
      "summary": "2-3 sentence chapter summary",
      "sceneDescription": "Detailed visual scene description for illustration"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Failed to parse story outline from AI response');
    }

    return JSON.parse(jsonMatch[0]) as StoryOutline;
}

/**
 * Generate full chapter content
 */
export async function generateChapterContent(
    characters: Character[],
    chapterOutline: ChapterOutline,
    previousChapterSummary?: string
): Promise<{ content: string; sceneDescription: string }> {
    const characterNames = characters.map(c => c.name).join(', ');

    const prompt = `Write a children's storybook chapter.

Characters: ${characterNames}
Chapter ${chapterOutline.number}: ${chapterOutline.title}
Summary: ${chapterOutline.summary}
${previousChapterSummary ? `Previous chapter: ${previousChapterSummary}` : ''}

Requirements:
- Write 150-250 words
- Age-appropriate language for children 4-10
- Engaging and descriptive prose
- Include dialogue when appropriate
- End with a hook or transition to next chapter

Also provide an updated scene description for the illustration.

Respond in JSON format:
{
  "content": "The chapter text...",
  "sceneDescription": "Visual scene description for illustration"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Failed to parse chapter content from AI response');
    }

    return JSON.parse(jsonMatch[0]);
}

/**
 * Generate illustration prompts for a scene
 */
export async function generateIllustrationPrompt(
    characters: Character[],
    sceneDescription: string,
    artStyle: string
): Promise<string> {
    const characterDescriptions = characters.map(c =>
        `${c.name}: ${c.visualPrompt}`
    ).join('\n');

    const prompt = `Create a detailed illustration prompt for a children's book scene.

Characters:
${characterDescriptions}

Scene: ${sceneDescription}
Art Style: ${artStyle}

Create a single, detailed prompt that describes:
- Character positions and actions
- Facial expressions and body language
- Background elements
- Lighting and atmosphere
- Key visual details

Keep the prompt under 200 words. Return only the prompt text, no JSON.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}
