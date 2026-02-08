'use server';

import { streamText, ModelMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { generateCharacterSheet, saveCharacter, getCharacters, getCharacter } from '@/actions/character';
import { 
    generateStoryOutline, 
    createStorybook, 
    generateChapter,
    updateStorybook,
    generateAndSaveCover,
    syncStoryContent,
    getStorybookWithChapters
} from '@/actions/story';
import { generateIllustration, saveIllustration } from '@/actions/illustration';
import { 
    Character, 
    CharacterAppearance,
    ArtStyle,
    StorySetting 
} from '@/types/storybook';

export async function* continueConversation(history: ModelMessage[]) {
    try {
        const { fullStream } = streamText({
            model: google('gemini-2.0-flash-001'),
            system: `You are a magical, warm, and encouraging Storyteller.
Your goal is to guide the user through a specific pipeline to create a complete storybook.

### STRICT PIPELINE (Must follow this order):

**PHASE 1: CHARACTER SELECTION (MANDATORY START)**
1.  **Choice:** Ask: "Would you like to create your own characters or pick from our magical pre-made collection?"
    * **If "Create Own":** Proceed to Collect Character Details.
    * **If "Pre-made" (or if user asks to see characters):** 
        * CALL \`listPreMadeCharacters\` with \`showAll: false\` to show first 6 characters.
        * Tell the user to click on characters to select them. The UI will handle the selection.
        * If user wants to see more characters, call \`listPreMadeCharacters\` with \`showAll: true\`.
        * **CRITICAL:** The frontend will send back selected character IDs directly. DO NOT ask user to type names.
        * When you receive character IDs from the user, IMMEDIATELY call \`selectPreMadeCharacters\` with those IDs.

2.  **Collect Character Details (Only for "Create Own"):**
    * Ask for: Name, hair, eyes, skin, clothing, personality, and art style.
    * Once you have ALL details, CALL \`generateCharacters\`.

3.  **Confirmation:**
    * After \`generateCharacters\` OR \`selectPreMadeCharacters\` returns successfully, ask: "These look great! Are you ready to start the story, or do you want to make changes?"

**PHASE 2: STORY GENERATION (Do not start until Phase 1 is DONE)**
4.  **Collect Story Details:**
    * First, ask how many chapters they want (3-7 chapters). Wait for their response.
    * Then ask for: Setting (e.g., forest, space), Theme (e.g., courage), and Plot/Adventure.
    
5.  **Generate Story IMMEDIATELY:**
    * **CRITICAL:** As SOON as you have ALL details (chapters, setting, theme, plot), IMMEDIATELY CALL \`generateFullStory\`. 
    * **DO NOT** ask for confirmation or say anything else first. Just call the tool directly.
    * **INPUT REQUIREMENT:** You MUST pass the \`characterIds\` you obtained in Phase 1 (either from \`selectPreMadeCharacters\` or \`generateCharacters\`). Do not invent IDs. Use the exact UUIDs from the tool outputs.
    * Use the chapter count the user specified (default to 3 if not specified).
    * After calling the tool, you can explain what you're doing.

**PHASE 3: COMPLETION**
6.  Call \`finalizeStory\` and show the link.

### RULES:
- **CHARACTER SELECTION:** The UI displays characters as clickable cards. Users select by clicking, not typing names. The frontend sends back the IDs.
- **SHOW ALL:** If user wants to see more characters, call \`listPreMadeCharacters\` with \`showAll: true\`.
- **NO GLOBAL STATE:** You are responsible for remembering the \`characterIds\` from the tool outputs.
- **TOOL CALLING:** Do not announce tool calls. Just call them.
- **ERROR HANDLING:** If a tool fails, ask the user to try again.
`,
            messages: history,
            tools: {
                listPreMadeCharacters: {
                    description: 'Get a list of pre-made characters. Returns names, IDs, and images for the UI to display as clickable cards.',
                    inputSchema: z.object({
                        showAll: z.boolean().optional().describe('If true, shows all characters. If false or omitted, shows first 6.')
                    }),
                    execute: async ({ showAll = false }) => {
                        try {
                            console.log('[listPreMadeCharacters] Fetching characters, showAll:', showAll);
                            const characters = await getCharacters();
                            console.log('[listPreMadeCharacters] Found characters:', characters.length);
                            
                            if (characters.length === 0) {
                                console.log('[listPreMadeCharacters] No characters in database');
                                return {
                                    success: false,
                                    message: 'No pre-made characters available yet. Let\'s create a custom character instead!'
                                };
                            }
                            
                            // Return characters based on showAll parameter
                            const displayCharacters = showAll ? characters : characters.slice(0, 6);
                            const hasMore = !showAll && characters.length > 6;
                            
                            const result = {
                                success: true,
                                totalCount: characters.length,
                                displayCount: displayCharacters.length,
                                hasMore,
                                showingAll: showAll,
                                // UI should render these as clickable character cards
                                characters: displayCharacters.map(c => ({
                                    id: c.id,
                                    name: c.name,
                                    imageUrl: c.referenceImageUrl,
                                    artStyle: c.artStyle
                                })),
                                message: showAll 
                                    ? `Here are all ${characters.length} pre-made characters! Click on up to 2 characters to select them.`
                                    : `Here are ${displayCharacters.length} pre-made characters! Click on up to 2 to select them. ${hasMore ? `(${characters.length - 6} more available - ask to "show all characters")` : ''}`
                            };
                            
                            console.log('[listPreMadeCharacters] Returning result:', {
                                success: result.success,
                                characterCount: result.characters.length,
                                totalCount: result.totalCount
                            });
                            
                            return result;
                        } catch (error) {
                            console.error('[listPreMadeCharacters] Error:', error);
                            return {
                                success: false,
                                message: 'Could not load pre-made characters.'
                            };
                        }
                    }
                },
                selectPreMadeCharacters: {
                    description: 'Select pre-made character(s) by their IDs. Call this when user provides character IDs (sent from the UI when they click on characters).',
                    inputSchema: z.object({
                        characterIds: z.array(z.string()).min(1).max(2).describe('Array of character UUIDs that the user selected by clicking')
                    }),
                    execute: async ({ characterIds }) => {
                        try {
                            console.log('[selectPreMadeCharacters] Received IDs:', characterIds);
                            
                            // Validate IDs exist in DB
                            const characters = await Promise.all(
                                characterIds.map((id: string) => getCharacter(id))
                            );
                            
                            console.log('[selectPreMadeCharacters] Fetched characters:', characters.map(c => c ? `${c.name} (${c.id})` : 'null'));
                            
                            const validCharacters = characters.filter(c => c !== null);
                            
                            if (validCharacters.length === 0) {
                                console.error('[selectPreMadeCharacters] No valid characters found!');
                                throw new Error('Selected characters not found');
                            }
                            
                            const result = {
                                success: true,
                                message: `Great choice! I've selected ${validCharacters.map(c => c?.name).join(' and ')}.`,
                                characterIds: validCharacters.map(c => c!.id), // Return IDs explicitly for context
                                characters: validCharacters.map(c => ({
                                    name: c!.name,
                                    imageUrl: c!.referenceImageUrl
                                }))
                            }
                            
                            console.log('[selectPreMadeCharacters] Success! Returning:', result);
                            return result;
                        } catch (error) {
                            console.error('[selectPreMadeCharacters] Error:', error);
                            return {
                                success: false,
                                message: 'Could not select those characters. Please try again.',
                                error: error instanceof Error ? error.message : 'Unknown error'
                            };
                        }
                    }
                },
                generateCharacters: {
                    description: 'Generate new characters. Returns the new Character IDs.',
                    inputSchema: z.object({
                        characters: z.array(z.object({
                            name: z.string(),
                            appearance: z.object({
                                hairStyle: z.string(),
                                hairColor: z.string(),
                                eyeColor: z.string(),
                                skinTone: z.string(),
                                clothing: z.string().optional(),
                                age: z.string().optional(),
                            }),
                            personality: z.array(z.string()),
                            artStyle: z.enum(['watercolor', 'cartoon', 'storybook', 'anime', '3d-clay', 'fantasy']),
                        })).min(1).max(2),
                    }),
                    execute: async ({ characters }) => {
                        console.log('[Character Generation] Starting...');
                        
                        const results = await Promise.allSettled(
                            characters.map(async (char: any) => {
                                const sheet = await generateCharacterSheet({
                                    name: char.name,
                                    appearance: char.appearance,
                                    personality: char.personality,
                                    artStyle: char.artStyle,
                                });

                                const saved = await saveCharacter({
                                    name: char.name,
                                    appearance: char.appearance,
                                    personality: char.personality,
                                    visualPrompt: sheet.visualPrompt,
                                    artStyle: char.artStyle,
                                    seedNumber: sheet.seed,
                                    referenceImageUrl: sheet.imageUrl,
                                });

                                if (!saved.success) throw new Error(saved.error);

                                return {
                                    name: char.name,
                                    imageUrl: sheet.imageUrl,
                                    characterId: saved.characterId,
                                    success: true,
                                };
                            })
                        );

                        const successfulResults = results
                            .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value.success)
                            .map(r => r.value);
                            
                        const validIds = successfulResults.map(r => r.characterId);

                        return {
                            success: true,
                            characterIds: validIds,
                            characters: successfulResults,
                            message: `Generated characters. IDs: ${validIds.join(', ')}`
                        };
                    },
                },
                generateFullStory: {
                    description: 'Generate the complete storybook with real-time progress. Requires Character IDs from previous steps.',
                    inputSchema: z.object({
                        characterIds: z.array(z.string()).describe('Array of character IDs from previous steps'),
                        setting: z.string(),
                        theme: z.string(),
                        description: z.string(),
                        targetChapters: z.number().min(3).max(7).default(3),
                    }),
                    execute: async ({ characterIds, setting, theme, description, targetChapters }, { abortSignal }) => {
                        try {
                            // Validate character IDs
                            const characters = await Promise.all(
                                characterIds.map(async (id: string) => getCharacter(id))
                            );
                            
                            const validCharacters = characters.filter((c): c is Character => c !== null);
                            
                            if (validCharacters.length === 0) {
                                throw new Error('I could not find those character IDs. Please try generating characters again.');
                            }

                            const validIds = validCharacters.map(c => c.id);
                            const artStyle = validCharacters[0].artStyle;

                            // Create Storybook
                            const sbResult = await createStorybook(
                                'New Adventure', 
                                validIds,
                                setting as StorySetting || 'fantasy',
                                artStyle,
                                targetChapters,
                                theme,
                                description
                            );

                            if (!sbResult.success || !sbResult.storybookId) {
                                throw new Error(sbResult.error || 'Failed to create storybook');
                            }

                            const storybookId = sbResult.storybookId;

                            // Generate Outline
                            const outlineResult = await generateStoryOutline({
                                characterIds: validIds,
                                setting: setting as StorySetting || 'fantasy',
                                targetChapters,
                                theme,
                                additionalDetails: description,
                            });

                            if (!outlineResult.success || !outlineResult.outline) {
                                throw new Error('Failed to generate outline');
                            }
                            
                            await updateStorybook(storybookId, { title: outlineResult.outline.title });
                            generateAndSaveCover(storybookId).catch((err: unknown) => {
                                console.error('Cover generation error:', err);
                            });

                            // 4. Generate Chapters with progress tracking
                            console.log('[generateFullStory] Step 4: Generating chapters and illustrations...');
                            console.log(`[generateFullStory] Total chapters to generate: ${outlineResult.outline.chapters.length}`);
                            
                            // Create ONE Supabase client for all database operations
                            // This ensures all INSERTs and SELECTs use the SAME database connection
                            // to avoid connection pooling + read-after-write consistency issues
                            const { createClient } = await import('@/lib/supabase/server');
                            const sharedSupabaseClient = await createClient();
                            console.log('[generateFullStory] Created shared database client for transaction consistency');
                            
                            let completedChapters = 0;
                            const totalChapters = outlineResult.outline.chapters.length;
                            
                            for (const chapterOutline of outlineResult.outline.chapters) {
                                console.log(`[generateFullStory] ━━━ Chapter ${chapterOutline.number}/${totalChapters} ━━━`);
                                console.log(`[generateFullStory] Title: ${chapterOutline.title}`);
                                console.log(`[generateFullStory] Progress: ${completedChapters}/${totalChapters} chapters complete`);
                                
                                const chapterResult = await generateChapter(
                                    storybookId,
                                    chapterOutline.number,
                                    chapterOutline.title,
                                    chapterOutline.summary,
                                    chapterOutline.sceneDescription,
                                    sharedSupabaseClient // Pass the SAME client
                                );

                                if (chapterResult.success && chapterResult.chapterId) {
                                    console.log(`[generateFullStory] ✓ Chapter ${chapterOutline.number} text generated (${chapterResult.content?.length || 0} chars)`);
                                    completedChapters++;
                                    
                                    try {
                                        console.log(`[generateFullStory] Generating illustration for chapter ${chapterOutline.number}...`);
                                        const illustration = await generateIllustration({
                                            characters: validCharacters,
                                            sceneDescription: chapterOutline.sceneDescription,
                                            artStyle,
                                            seedNumber: Math.floor(Math.random() * 999999) + 1,
                                        });

                                        await saveIllustration(
                                            chapterResult.chapterId,
                                            illustration.imageUrl,
                                            illustration.promptUsed,
                                            Math.floor(Math.random() * 999999) + 1
                                        );
                                        console.log(`[generateFullStory] ✓ Illustration saved for chapter ${chapterOutline.number}`);
                                        console.log(`[generateFullStory] ✓✓ Chapter ${chapterOutline.number} FULLY COMPLETE (${completedChapters}/${totalChapters})`);
                                    } catch (e) {
                                        console.error(`[generateFullStory] ⚠️  Illustration failed for chapter ${chapterOutline.number}:`, e);
                                        console.log(`[generateFullStory] Chapter ${chapterOutline.number} saved without illustration`);
                                    }
                                } else {
                                    console.error(`[generateFullStory] ❌ Failed to generate chapter ${chapterOutline.number}`);
                                    console.error(`[generateFullStory] Error:`, chapterResult.error);
                                }
                            }
                            
                            // Final sync to ensure all content is in the JSON column
                            // Query chapters DIRECTLY with the same client to avoid transaction isolation issues
                            console.log('[generateFullStory] ✓ All chapters generated successfully');
                            console.log('[generateFullStory] Building content object directly...');
                            
                            // Direct query with shared client
                            let { data: finalChapters, error: finalError } = await sharedSupabaseClient
                                .from("chapters")
                                .select("id, chapter_number, title, content, illustrations(image_url)")
                                .eq("storybook_id", storybookId)
                                .order("chapter_number", { ascending: true });
                            
                            console.log('[generateFullStory] Supabase client query found', finalChapters?.length || 0, 'chapters');
                            
                            if (finalError) {
                                console.error('[generateFullStory] Error querying chapters:', finalError);
                            }
                            
                            // If Supabase client returns 0, try RAW HTTP fetch as fallback
                            if (!finalChapters || finalChapters.length === 0) {
                                console.log('[generateFullStory] Trying raw HTTP fetch...');
                                try {
                                    const response = await fetch(
                                        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/chapters?storybook_id=eq.${storybookId}&order=chapter_number.asc&select=id,chapter_number,title,content`,
                                        {
                                            headers: {
                                                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                                                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
                                                'Content-Type': 'application/json'
                                            },
                                            cache: 'no-store'
                                        }
                                    );
                                    
                                    if (response.ok) {
                                        finalChapters = await response.json();
                                        console.log('[generateFullStory] Raw HTTP found', finalChapters?.length || 0, 'chapters');
                                    }
                                } catch (fetchError) {
                                    console.error('[generateFullStory] Raw fetch failed:', fetchError);
                                }
                            }
                            
                            // Get storybook title
                            const { data: finalStorybook } = await sharedSupabaseClient
                                .from("storybooks")
                                .select("title")
                                .eq("id", storybookId)
                                .single();
                            
                            // Build content object
                            const contentToSave = {
                                title: finalStorybook?.title || "New Adventure",
                                author: "AI Storybook",
                                chapters: (finalChapters || []).map((ch: any) => ({
                                    title: ch.title,
                                    content: ch.content,
                                    illustrationUrl: ch.illustrations?.[0]?.image_url
                                }))
                            };
                            
                            console.log('[generateFullStory] Content object:', {
                                title: contentToSave.title,
                                chaptersCount: contentToSave.chapters.length
                            });
                            
                            // Update storybook with content and status
                            const { error: updateError } = await sharedSupabaseClient
                                .from("storybooks")
                                .update({ 
                                    content: contentToSave,
                                    status: 'complete' as const
                                })
                                .eq("id", storybookId);
                            
                            if (updateError) {
                                console.error('[generateFullStory] Error updating storybook:', updateError);
                            } else {
                                console.log('[generateFullStory] ✓ Content synced successfully!');
                            }
                            
                            return {
                                storybookId,
                                status: 'complete',
                                completedChapters,
                                totalChapters: outlineResult.outline.chapters.length,
                                title: outlineResult.outline.title,
                                message: `Story "${outlineResult.outline.title}" created with ${completedChapters} chapters!`,
                            };
                        } catch (error) {
                            throw new Error(error instanceof Error ? error.message : 'Story generation failed');
                        }
                    },
                },
                finalizeStory: {
                    description: 'Finalize the story process.',
                    inputSchema: z.object({
                        storybookId: z.string(),
                    }),
                    execute: async ({ storybookId }) => {
                        return { storybookId, status: 'complete', message: 'Enjoy your story!' };
                    },
                },
            },
        });

        for await (const part of fullStream) {
            if (part.type === 'text-delta') {
                yield { type: 'text', content: part.text };
            } else if (part.type === 'tool-call') {
                yield { type: 'tool-call', toolName: part.toolName, toolCallId: part.toolCallId };
            } else if (part.type === 'tool-result') {
                yield { type: 'tool-result', tool: part.toolName, result: part.output };
            }
        }
    } catch (error) {
        console.error('Error:', error);
        yield { type: 'error', content: 'An unexpected error occurred' };
    }
}