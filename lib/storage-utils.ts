import { createClient } from './supabase/server';
import { createAdminClient } from './supabase/admin';
import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Single bucket for all AI-generated images */
const GENERATED_IMAGES_BUCKET = 'generated-images';

/** Sub-folder names inside the bucket */
export type GeneratedImageType = 'avatars' | 'covers' | 'illustrations';

// ─────────────────────────────────────────────────────────────────────────────
// Core upload helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Downloads an image from a URL and uploads it to Supabase Storage
 * using the **user-scoped** client.
 * Returns the permanent public URL of the uploaded image.
 */
export async function uploadImageFromUrl(
    tempUrl: string,
    bucketName: string,
    userId: string,
    folderPath: string = 'generated'
): Promise<string> {
    try {
        const response = await fetch(tempUrl);
        if (!response.ok) {
            throw new Error(`Failed to download image: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const timestamp = Date.now();
        const fileName = `${timestamp}-${uuidv4()}.webp`;
        const filePath = `${userId}/${folderPath}/${fileName}`;

        const supabase = await createClient();

        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, buffer, {
                contentType: 'image/webp',
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase storage upload error:', uploadError);
            throw new Error(`Failed to upload to storage: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error processing image upload:', error);
        throw error;
    }
}

/**
 * Downloads an image from a URL and uploads it to Supabase Storage
 * using the **admin / service-role** client.
 *
 * Use this in server-side pipelines that don't have a user session
 * (e.g. `generateFullBook` which already writes with the admin client).
 */
export async function uploadImageFromUrlAdmin(
    tempUrl: string,
    bucketName: string,
    userId: string,
    folderPath: string = 'generated'
): Promise<string> {
    try {
        const response = await fetch(tempUrl);
        if (!response.ok) {
            throw new Error(`Failed to download image: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const timestamp = Date.now();
        const fileName = `${timestamp}-${uuidv4()}.webp`;
        const filePath = `${userId}/${folderPath}/${fileName}`;

        const supabase = createAdminClient();

        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, buffer, {
                contentType: 'image/webp',
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase storage upload error (admin):', uploadError);
            throw new Error(`Failed to upload to storage: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error processing image upload (admin):', error);
        throw error;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience wrappers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Persist a Replicate-generated image to the `generated-images` bucket,
 * routing to the correct sub-folder based on `imageType`.
 *
 * Uses the **user-scoped** Supabase client.
 */
export async function persistGeneratedImage(
    replicateUrl: string,
    userId: string,
    imageType: GeneratedImageType
): Promise<string> {
    return uploadImageFromUrl(replicateUrl, GENERATED_IMAGES_BUCKET, userId, imageType);
}

/**
 * Same as `persistGeneratedImage` but uses the **admin** client.
 * For server-side pipelines without a user session.
 */
export async function persistGeneratedImageAdmin(
    replicateUrl: string,
    userId: string,
    imageType: GeneratedImageType
): Promise<string> {
    return uploadImageFromUrlAdmin(replicateUrl, GENERATED_IMAGES_BUCKET, userId, imageType);
}
