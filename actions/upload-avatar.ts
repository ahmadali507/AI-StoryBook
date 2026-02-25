"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UploadAvatarResult {
    success: boolean;
    avatarUrl?: string;
    error?: string;
}

/**
 * Upload a cropped profile picture to Supabase Storage
 * Bucket: "characters", folder: "profile_pictures/<userId>"
 * Overwrites previous avatar if one exists.
 */
export async function uploadProfilePicture(
    base64Data: string
): Promise<UploadAvatarResult> {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    try {
        // Strip the data:image/...;base64, prefix
        const base64Match = base64Data.match(
            /^data:image\/(\w+);base64,(.+)$/
        );
        if (!base64Match) {
            return { success: false, error: "Invalid image data" };
        }

        const ext = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
        const rawBase64 = base64Match[2];
        const buffer = Buffer.from(rawBase64, "base64");

        const filePath = `profile_pictures/${user.id}/avatar.${ext}`;

        // Upsert — overwrite existing avatar
        const { error: uploadError } = await supabase.storage
            .from("characters")
            .upload(filePath, buffer, {
                contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
                upsert: true,
            });

        if (uploadError) {
            console.error("Avatar upload error:", uploadError);
            return { success: false, error: uploadError.message };
        }

        // Get the permanent public URL
        const {
            data: { publicUrl },
        } = supabase.storage.from("characters").getPublicUrl(filePath);

        // Append a cache-buster so the browser picks up the new image
        const avatarUrl = `${publicUrl}?v=${Date.now()}`;

        // Update the profile row
        const { error: updateError } = await supabase
            .from("profiles")
            .update({
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

        if (updateError) {
            return { success: false, error: updateError.message };
        }

        revalidatePath(`/profile/${user.id}`);
        return { success: true, avatarUrl };
    } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        return { success: false, error: message };
    }
}
