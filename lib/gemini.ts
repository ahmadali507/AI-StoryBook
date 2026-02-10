import { GoogleGenerativeAI } from '@google/generative-ai';
import { Character, StorySetting, STORY_SETTING_LABELS } from '@/types/storybook';
import { ChatMessage } from '@/types/chat';

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

// Legacy types for unused chatWithStoryteller function
interface StoryState {
    characterName?: string;
    characterDescription?: string;
    setting?: string;
    theme?: string;
}

interface StoryChatResponse {
    reply: string;
    extractedInfo?: Partial<StoryState>;
    suggestions?: string[];
}

/**
 * Helper to safely parse JSON from AI response
 */
function parseAIResponse(text: string): any {
    try {
        // First try to find JSON block
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const jsonStr = jsonMatch[0];
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('Failed to parse AI response:', text);
        throw new Error('Failed to parse AI response: ' + (error instanceof Error ? error.message : String(error)));
    }
}

/**
 * Generate a story outline with chapter summaries
 */
export async function generateStoryOutline(
    characters: Character[],
    setting: StorySetting,
    targetChapters: number,
    theme?: string,
    additionalDetails?: string,
    title?: string
): Promise<StoryOutline> {
    const characterDescriptions = characters.map(c =>
        `${c.name}: ${c.personality.join(', ')}`
    ).join('\n');

    const settingName = STORY_SETTING_LABELS[setting];

    const prompt = `Create a comprehensive storybook outline with exactly ${targetChapters} chapters.

Characters:
${characterDescriptions}

${title ? `Story Title: "${title}" (Use this exact title)` : ''}
Setting: ${settingName}
${theme ? `Theme: ${theme}` : ''}
${additionalDetails ? `Additional details: ${additionalDetails}` : ''}

Requirements:
- Age-appropriate for children/adults.
- Each chapter should be engaging and move the story forward
- Include clear scene descriptions for illustrations
- End with a positive, heartwarming conclusion
- ${title ? `The story must be about "${title}"` : 'Create a catchy title'}

Respond in strict JSON format. IMPORTANT: Escape all newlines in string values (use \\n). Do not use control characters.
{
  "title": "${title || 'Story title'}",
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
    const parsed = parseAIResponse(text) as StoryOutline;

    // Force strict title adherence if provided
    if (title) {
        parsed.title = title;
    }

    return parsed;
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

Respond in strict JSON format. IMPORTANT: Escape all newlines in string values (use \\n). Do not use control characters.
{
  "content": "The chapter text...",
  "sceneDescription": "Visual scene description for illustration"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseAIResponse(text);
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

/**
 * Generate a cover image prompt
 */
export async function generateCoverPrompt(
    title: string,
    setting: string,
    artStyle: string,
    theme?: string
): Promise<string> {
    const prompt = `Create a detailed illustration prompt for a storybook cover.

Title: ${title}
Setting: ${setting}
Art Style: ${artStyle}
${theme ? `Theme: ${theme}` : ''}

Create a single, detailed prompt that describes:
- A captivating central scene representing the story
- Magical and inviting atmosphere
- High quality, detailed, professional book cover art
- No text or words in the image (except maybe stylized title if implied, but better to avoid text)

Keep the prompt under 200 words. Return only the prompt text, no JSON.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

/**
 * Storyteller Persona System Prompt
 */
const STORYTELLER_PERSONA = `You are a magical, warm, and encouraging Storyteller. 
Your goal is to help the user create a unique story for a storybook.
You need to gather specific information from the user to build the story:
1. Character Name & Description (Appearance, Personality)
2. Setting (Where the story takes place)
3. Theme (The moral or feeling of the story)

Talk to the user naturally. Be curious. Ask one question at a time.
Verify you have the details before moving on.
If the user gives short answers, ask for a bit more detail to make the illustrations better.

Output must be in strict JSON format:
{
  "reply": "Your conversational response to the user...",
  "extractedData": {
    "characterName": "Name if found",
    "characterDescription": "Description if found",
    "setting": "Setting if found",
    "theme": "Theme if found"
  },
  "suggestions": ["Short suggestion 1", "Short suggestion 2", "Short suggestion 3"],
  "isComplete": boolean // Set to true ONLY when you have all 3 key elements confirmed
}
`;

/**
 * Enhanced chat function with NLU and Persona
 */
export async function chatWithStoryteller(
    history: ChatMessage[],
    userInput: string,
    currentContext: StoryState
): Promise<StoryChatResponse> {
    const historyText = history.map(msg => `${msg.role}: ${msg.content}`).join('\n');

    const contextPrompt = `
Current collected data:
- Character Name: ${currentContext.characterName || 'Not set'}
- Character Description: ${currentContext.characterDescription || 'Not set'}
- Setting: ${currentContext.setting || 'Not set'}
- Theme: ${currentContext.theme || 'Not set'}

User Input: ${userInput}

Based on the history and new input, continue the conversation. 
Extract any new information. 
Provide helpful short suggestions for the user's next response.
`;

    const fullPrompt = `${STORYTELLER_PERSONA}\n\nConversation History:\n${historyText}\n${contextPrompt}`;

    const result = await model.generateContent(fullPrompt);
    const text = result.response.text();
    return parseAIResponse(text) as StoryChatResponse;
}
