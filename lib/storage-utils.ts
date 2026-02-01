import { createClient } from './supabase/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * Downloads an image from a URL and uploads it to Supabase Storage
 * Returns the permanent public URL of the uploaded image
 */
export async function uploadImageFromUrl(
    tempUrl: string,
    bucketName: string,
    userId: string,
    folderPath: string = 'generated'
): Promise<string> {
    try {
        // 1. Fetch the image
        const response = await fetch(tempUrl);
        if (!response.ok) {
            throw new Error(`Failed to download image: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 2. Prepare file path
        // Format: userId/folderPath/timestamp-uuid.webp
        const timestamp = Date.now();
        const fileName = `${timestamp}-${uuidv4()}.webp`;
        const filePath = `${userId}/${folderPath}/${fileName}`;

        // 3. Upload to Supabase
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

        // 4. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error processing image upload:', error);
        // If upload fails, return original URL (fallback) or rethrow
        // Rethrowing is safer to prevent saving broken data if the user expects perm storage
        throw error;
    }
}
