import Replicate from 'replicate';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

interface SeedreamInput {
    prompt: string;
    seed?: number;
    aspect_ratio?: string;
    output_format?: string;
    output_quality?: number;
    negative_prompt?: string;
    image_input?: string[];
    sequential_image_generation?: string;
    max_images?: number;
}

/**
 * Generate an image using Seedream 4.5 with automatic retry logic
 */
export async function generateWithSeedream(
    prompt: string,
    seed?: number,
    aspectRatio: string = '4:3',
    negativePrompt?: string,
    imageInput?: string[],
    maxRetries: number = 3
): Promise<string> {
    const input: SeedreamInput = {
        prompt,
        seed: seed ?? Math.floor(Math.random() * 999999) + 1,
        aspect_ratio: aspectRatio,
        output_format: 'webp',
        output_quality: 95,
        negative_prompt: negativePrompt,
        image_input: imageInput,
        sequential_image_generation: 'disabled',
        max_images: 1
    };

    let lastError: Error | unknown;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            console.log(`[generateWithSeedream] Attempt ${attempt + 1}/${maxRetries} - Generating image...`);

            // Direct API call without manual timeout to avoid premature cancellation
            // The Replicate client or the API itself should handle timeouts if necessary
            const output = await replicate.run('bytedance/seedream-4.5', { input });
            console.log(`[generateWithSeedream] API call returned for attempt ${attempt + 1}`);

            // Seedream returns an array of image URLs or a single URL
            if (Array.isArray(output) && output.length > 0) {
                console.log(`[generateWithSeedream] ✓ Success on attempt ${attempt + 1}`);
                return String(output[0]);
            }

            if (typeof output === 'string') {
                console.log(`[generateWithSeedream] ✓ Success on attempt ${attempt + 1}`);
                return output;
            }

            // Handle object output with URL property
            if (output && typeof output === 'object' && 'url' in output) {
                console.log(`[generateWithSeedream] ✓ Success on attempt ${attempt + 1}`);
                return String((output as { url: string }).url);
            }

            throw new Error('Unexpected output format from Seedream');

        } catch (error) {
            lastError = error;
            const errorMessage = error instanceof Error ? error.message : String(error);

            console.error(`[generateWithSeedream] ✗ Attempt ${attempt + 1}/${maxRetries} failed:`, errorMessage);

            // If it's the last attempt, throw the error
            if (attempt === maxRetries - 1) {
                console.error(`[generateWithSeedream] All ${maxRetries} attempts failed. Giving up.`);
                throw error;
            }

            // Wait before retrying (exponential backoff: 2s, 4s, 8s)
            const waitTime = Math.pow(2, attempt + 1) * 1000;
            console.log(`[generateWithSeedream] Retrying in ${waitTime / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    throw lastError;
}

/**
 * Generate a character reference sheet
 */
export async function generateCharacterSheet(
    prompt: string,
    seed: number,
    negativePrompt?: string,
    imageInput?: string[]
): Promise<string> {
    return generateWithSeedream(prompt, seed, '16:9', negativePrompt, imageInput);
}

/**
 * Generate a scene illustration
 */
export async function generateSceneIllustration(
    prompt: string,
    seed: number,
    negativePrompt?: string,
    imageInput?: string[]
): Promise<string> {
    return generateWithSeedream(prompt, seed, '3:4', negativePrompt, imageInput);
}

/**
 * Generate a book cover illustration
 */
export async function generateBookCover(
    prompt: string,
    seed: number,
    negativePrompt?: string,
    imageInput?: string[]
): Promise<string> {
    return generateWithSeedream(prompt, seed, '3:4', negativePrompt, imageInput);
}
