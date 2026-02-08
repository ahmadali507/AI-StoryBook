"use server";

import { streamText, ModelMessage } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
    createBookOrder,
    addCharacterToOrder,
    uploadCharacterPhoto,
    getOrderCharacters
} from "@/actions/order";
import { generateCoverForOrder } from "@/actions/book-generation";
import type { SimpleCharacter, AgeRange, Theme, MVPArtStyle } from "@/types/storybook";

/**
 * MVP Chatbot - Simplified order-focused conversation flow
 * 
 * Flow:
 * 1. Greet and ask about the child (who's the book for?)
 * 2. Get photo upload for main character
 * 3. Optional: Get supporting characters
 * 4. Ask about age range
 * 5. Suggest theme based on conversation
 * 6. Generate cover preview
 * 7. Show payment CTA
 */

export async function* mvpChatConversation(history: ModelMessage[]) {
    try {
        const { fullStream } = streamText({
            model: google("gemini-2.0-flash-001"),
            system: `You are a friendly, warm Storybook Creator helping families make personalized storybooks as gifts.

### YOUR PERSONALITY:
- Warm, encouraging, and excited to help
- Focus on the emotional value of personalized books
- Keep responses concise (2-3 sentences max)
- Ask one question at a time

### ORDER CREATION FLOW:

**STEP 1: WELCOME & MAIN CHARACTER**
- Greet warmly and ask who the book is for (child's/pet's name)
- Once you have a name, ask them to upload a photo
- Say: "Upload a photo of [name] and I'll create a magical character!"

**STEP 2: CHARACTER DETAILS**
- After photo upload, ask simple questions:
  - "Is [name] a boy or girl?" (or for pets: "What kind of animal is [name]?")
- Use the \`addPhotoCharacter\` tool with the info

**STEP 3: ADDITIONAL CHARACTERS (Optional)**
- Ask: "Would you like to add another person or pet to the story? (You can add up to 2 more)"
- If yes, repeat photo upload process
- If no, move to settings

**STEP 4: BOOK SETTINGS**
- Ask about age range: "How old is [name]? (This helps us adjust the story text)"
  - 0-2: Baby board book style
  - 2-4: Simple picture book
  - 5-8: Classic children's story
  - 9-12: Richer chapter-style
- Ask about theme preference: "What kind of adventure would [name] love?"
  - Suggest 2-3 options based on the conversation

**STEP 5: GENERATE PREVIEW**
- Use \`createOrderWithPreview\` to create the order and generate cover
- Tell user: "I'm creating a magical cover for your book! This takes about 30 seconds..."

**STEP 6: PAYMENT**
- After cover is ready, show excitement about the cover
- Say: "Click 'Continue to Checkout' below to complete your order!"

### RULES:
- NEVER skip getting the photo upload - it's required
- Always confirm details before generating cover
- Keep the conversation flowing naturally
- If user seems confused, offer simple choices
- Maximum 3 characters per book
- Be encouraging and celebrate their choices

### TOOL USAGE:
- Use \`startOrder\` when you first learn the main character's name
- Use \`addPhotoCharacter\` after each photo upload with character details
- Use \`updateOrderSettings\` to set age range and theme
- Use \`generateCoverPreview\` when ready to show the cover
`,
            messages: history,
            tools: {
                startOrder: {
                    description: "Start a new book order. Call this when you first learn the main character's name.",
                    inputSchema: z.object({
                        mainCharacterName: z.string().describe("Name of the main character (the child or pet the book is for)"),
                    }),
                    execute: async ({ mainCharacterName }) => {
                        try {
                            const result = await createBookOrder({
                                artStyle: "soft-illustration", // Default
                                theme: "adventure", // Default
                                ageRange: "5-8", // Default
                            });

                            if (!result.success) {
                                return {
                                    success: false,
                                    message: "Could not start the order. Please try again.",
                                };
                            }

                            return {
                                success: true,
                                orderId: result.orderId,
                                storybookId: result.storybookId,
                                mainCharacterName,
                                message: `Great! I've started creating a book for ${mainCharacterName}! Now, please upload a photo of ${mainCharacterName}.`,
                            };
                        } catch (error) {
                            console.error("[startOrder] Error:", error);
                            return {
                                success: false,
                                message: "Something went wrong. Please try again.",
                            };
                        }
                    },
                },

                addPhotoCharacter: {
                    description: "Add a character to the order after photo upload. Call this with character details.",
                    inputSchema: z.object({
                        orderId: z.string().describe("The order ID from startOrder"),
                        name: z.string().describe("Character name"),
                        gender: z.enum(["male", "female", "other"]).describe("Character gender"),
                        entityType: z.enum(["human", "animal", "object"]).default("human").describe("Type of character"),
                        photoUrl: z.string().describe("URL of the uploaded photo"),
                        isMain: z.boolean().default(true).describe("Whether this is the main character"),
                    }),
                    execute: async ({ orderId, name, gender, entityType, photoUrl, isMain }) => {
                        try {
                            const result = await addCharacterToOrder({
                                orderId,
                                name,
                                photoUrl,
                                gender,
                                entityType,
                                role: isMain ? "main" : "supporting"
                            });

                            if (!result.success) {
                                return {
                                    success: false,
                                    message: "Could not add the character. Please try uploading the photo again.",
                                };
                            }

                            return {
                                success: true,
                                characterId: result.characterId,
                                name,
                                message: `Perfect! I've added ${name} to your story!`,
                            };
                        } catch (error) {
                            console.error("[addPhotoCharacter] Error:", error);
                            return {
                                success: false,
                                message: "Something went wrong adding the character.",
                            };
                        }
                    },
                },

                updateOrderSettings: {
                    description: "Update the order with age range and theme settings.",
                    inputSchema: z.object({
                        orderId: z.string().describe("The order ID"),
                        storybookId: z.string().describe("The storybook ID"),
                        ageRange: z.enum(["0-2", "2-4", "5-8", "9-12"]).describe("Target age range"),
                        theme: z.enum([
                            "adventure", "animals", "bedtime", "friendship",
                            "fantasy", "learning", "family", "nature"
                        ]).describe("Story theme"),
                        artStyle: z.enum([
                            "watercolor", "soft-illustration", "classic-storybook", "modern-cartoon"
                        ]).optional().describe("Art style preference"),
                    }),
                    execute: async ({ orderId, storybookId, ageRange, theme, artStyle }) => {
                        try {
                            const supabase = await createClient();

                            // Update storybook settings
                            const { error } = await supabase
                                .from("storybooks")
                                .update({
                                    age_range: ageRange,
                                    theme,
                                    art_style: artStyle || "soft-illustration",
                                })
                                .eq("id", storybookId);

                            if (error) {
                                throw error;
                            }

                            return {
                                success: true,
                                message: `Settings updated: Age ${ageRange}, ${theme} theme!`,
                                ageRange,
                                theme,
                            };
                        } catch (error) {
                            console.error("[updateOrderSettings] Error:", error);
                            return {
                                success: false,
                                message: "Could not update settings.",
                            };
                        }
                    },
                },

                generateCoverPreview: {
                    description: "Generate the book cover preview. Call this when you have all required info.",
                    inputSchema: z.object({
                        orderId: z.string().describe("The order ID"),
                    }),
                    execute: async ({ orderId }) => {
                        try {
                            const result = await generateCoverForOrder(orderId);

                            if (!result.success) {
                                return {
                                    success: false,
                                    message: result.error || "Could not generate cover. Please try again.",
                                };
                            }

                            return {
                                success: true,
                                coverUrl: result.coverUrl,
                                orderId,
                                message: "Your cover is ready! Take a look at this magical preview!",
                                checkoutUrl: `/order/${orderId}/checkout`,
                            };
                        } catch (error) {
                            console.error("[generateCoverPreview] Error:", error);
                            return {
                                success: false,
                                message: "Cover generation failed. Please try again.",
                            };
                        }
                    },
                },

                getOrderStatus: {
                    description: "Get the current order status and character list.",
                    inputSchema: z.object({
                        orderId: z.string().describe("The order ID"),
                    }),
                    execute: async ({ orderId }) => {
                        try {
                            const characters = await getOrderCharacters(orderId);
                            const supabase = await createClient();

                            const { data: order } = await supabase
                                .from("orders")
                                .select("status, storybooks(title, theme, age_range, art_style, cover_url)")
                                .eq("id", orderId)
                                .single();

                            return {
                                success: true,
                                orderId,
                                status: order?.status,
                                characters: characters.map(c => ({
                                    name: c.name,
                                    role: c.role,
                                })),
                                characterCount: characters.length,
                                storybook: order?.storybooks,
                            };
                        } catch (error) {
                            console.error("[getOrderStatus] Error:", error);
                            return {
                                success: false,
                                message: "Could not get order status.",
                            };
                        }
                    },
                },
            },
        });

        for await (const part of fullStream) {
            if (part.type === "text-delta") {
                yield { type: "text", content: part.text };
            } else if (part.type === "tool-call") {
                yield { type: "tool-call", toolName: part.toolName, toolCallId: part.toolCallId };
            } else if (part.type === "tool-result") {
                yield { type: "tool-result", tool: part.toolName, result: part.output };
            }
        }
    } catch (error) {
        console.error("[mvpChatConversation] Error:", error);
        yield { type: "error", content: "An unexpected error occurred. Please try again." };
    }
}
