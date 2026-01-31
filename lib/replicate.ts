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
}

/**
 * Generate an image using Seedream 4.5
 */
export async function generateWithSeedream(
    prompt: string,
    seed?: number,
    aspectRatio: string = '4:3'
): Promise<string> {
    const input: SeedreamInput = {
        prompt,
        seed: seed ?? Math.floor(Math.random() * 999999) + 1,
        aspect_ratio: aspectRatio,
        output_format: 'webp',
        output_quality: 90,
    };

    const output = await replicate.run('bytedance/seedream-4.5', { input });

    // Seedream returns an array of image URLs or a single URL
    if (Array.isArray(output) && output.length > 0) {
        return String(output[0]);
    }

    if (typeof output === 'string') {
        return output;
    }

    // Handle object output with URL property
    if (output && typeof output === 'object' && 'url' in output) {
        return String((output as { url: string }).url);
    }

    throw new Error('Unexpected output format from Seedream');
}

/**
 * Generate a character reference sheet
 */
export async function generateCharacterSheet(
    prompt: string,
    seed: number
): Promise<string> {
    return generateWithSeedream(prompt, seed, '16:9');
}

/**
 * Generate a scene illustration
 */
export async function generateSceneIllustration(
    prompt: string,
    seed: number
): Promise<string> {
    return generateWithSeedream(prompt, seed, '4:3');
}

/**
 * Generate a book cover illustration
 */
export async function generateBookCover(
    prompt: string,
    seed: number
): Promise<string> {
    return generateWithSeedream(prompt, seed, '3:4');
}
