"use server";

import { randomUUID } from 'crypto';
import { createClient } from "@/lib/supabase/server";
import { generateCharacterSheet as generateSheet } from "@/lib/replicate";
import { uploadImageFromUrl } from "@/lib/storage-utils";
import {
    buildVisualPrompt,
    buildCharacterSheetPrompt,
    generateSeed,
} from "@/lib/character-builder";
import {
    Character,
    CharacterAppearance,
    ArtStyle,
    GenerateCharacterSheetRequest,
} from "@/types/storybook";

// ─────────────────────────────────────────────────────────────────────────────
// generateCharacterSheet
// ─────────────────────────────────────────────────────────────────────────────

export async function generateCharacterSheet(
    data: GenerateCharacterSheetRequest
): Promise<{ imageUrl: string; seed: number; visualPrompt: string }> {
    const seed = generateSeed();
    const visualPrompt = buildVisualPrompt(
        data.name,
        data.appearance,
        data.personality,
        data.additionalDetails
    );
    const sheetPrompt = buildCharacterSheetPrompt(
        data.name,
        data.appearance,
        data.personality,
        data.artStyle,
        data.additionalDetails
    );

    const imageInput = data.referenceImageUrl ? [data.referenceImageUrl] : undefined;
    const imageUrl = await generateSheet(sheetPrompt, seed, undefined, imageInput);

    return { imageUrl, seed, visualPrompt };
}

// ─────────────────────────────────────────────────────────────────────────────
// saveCharacter
// ─────────────────────────────────────────────────────────────────────────────

export async function saveCharacter(
    character: Omit<Character, "id" | "userId" | "createdAt">
): Promise<{ success: boolean; characterId?: string; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated" };

    const characterId = randomUUID();
    let permReferenceUrl = character.referenceImageUrl;

    if (character.referenceImageUrl) {
        try {
            permReferenceUrl = await uploadImageFromUrl(
                character.referenceImageUrl,
                'characters',
                user.id
            );
        } catch (uploadError) {
            console.error('Failed to upload character image:', uploadError);
            return { success: false, error: "Failed to save character image to storage" };
        }
    }

    const { error } = await supabase.from("characters").insert({
        id: characterId,
        user_id: user.id,
        name: character.name,
        appearance: character.appearance,
        personality: character.personality,
        visual_prompt: character.visualPrompt,
        art_style: character.artStyle,
        seed_number: character.seedNumber,
        reference_image_url: permReferenceUrl,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, characterId };
}

// ─────────────────────────────────────────────────────────────────────────────
// getCharacters / getCharacter / deleteCharacter
// ─────────────────────────────────────────────────────────────────────────────

export async function getCharacters(): Promise<Character[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("characters")
        .select("*")
        .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        appearance: row.appearance as CharacterAppearance,
        personality: row.personality || [],
        visualPrompt: row.visual_prompt,
        artStyle: row.art_style as ArtStyle,
        seedNumber: row.seed_number,
        referenceImageUrl: row.reference_image_url,
        createdAt: new Date(row.created_at),
    }));
}

export async function getCharacter(id: string): Promise<Character | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("characters")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        appearance: data.appearance as CharacterAppearance,
        personality: data.personality || [],
        visualPrompt: data.visual_prompt,
        artStyle: data.art_style as ArtStyle,
        seedNumber: data.seed_number,
        referenceImageUrl: data.reference_image_url,
        createdAt: new Date(data.created_at),
    };
}

export async function deleteCharacter(
    id: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { error } = await supabase.from("characters").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT ENGINEERING — DESIGN PRINCIPLES
//
// ① POSITIONAL TOKEN WEIGHTING
//    Most diffusion models apply stronger guidance to earlier tokens in both
//    the positive and negative prompts. Critical constraints (entity lock,
//    clothing lock, solo subject) must appear at position 0–20 tokens.
//
// ② STYLE COHERENCE — NEVER MIX INCOMPATIBLE TRAINING CORPORA
//    "Wildlife photography" + "Pixar 3D render" are learned from disjoint
//    datasets with incompatible compositional patterns. Mixing them forces
//    the model to average across both, producing neither.
//    → ANIMAL prompts: Pixar 3D animated style throughout — same corpus as
//      human prompts. This gives style coherence across the whole storybook.
//    → Remove all photography/nature framing from animal prompts.
//
// ③ SOLO ANCHOR vs. NEGATIVE-ONLY EXCLUSION
//    Negative prompts suppress; they do not redirect. "no humans" alone
//    leaves compositional space empty, which the model fills probabilistically.
//    A positive SOLO ANCHOR ("ONE [subject] ONLY, single subject centered")
//    actively assigns that compositional space to the intended subject.
//    Use BOTH: positive solo anchor + negative exclusion list.
//
// ④ SPECIFICITY OVER REPETITION
//    Repeating "MANDATORY" or "MUST" provides no additional guidance weight.
//    Specificity does: "red zip-up hoodie with kangaroo pocket, navy chinos"
//    beats "casual outfit (MANDATORY)" every time because specificity reduces
//    the model's sampling space to a much tighter distribution.
//
// ⑤ NEGATIVE PROMPT ORDERING
//    Front-load the most critical exclusions. For animals: human presence
//    exclusions first. For humans: anatomy artifacts first (these are the
//    most common failure modes). General quality negatives go last.
//
// ⑥ AGE-PROPORTIONAL ANATOMY
//    Pixar models heavily bias toward adult proportions unless age is
//    explicitly anchored with physical descriptors, not just numbers.
//    "5 years old" alone is weak. Pair it with physical anchors:
//    "child-proportioned body, large head, short limbs, small hands".
//
// ⑦ REFERENCE IMAGE ROLE
//    The reference image provides: face likeness, fur/skin coloring, breed,
//    markings. The PROMPT governs everything else: clothing, pose, background,
//    style. Never rely on the reference alone for style — prompt it explicitly.
//
// ⑧ ANIMAL FRAMING — NO "NAMED PET" LANGUAGE AT PROMPT START
//    Opening with "portrait of [Name] the dog" activates "pet + owner" 
//    compositional patterns from training (Dug+Carl, Bolt+Penny, etc.).
//    Instead: open with species/breed, use name only for character identity,
//    and anchor SOLO before the name appears.
// ─────────────────────────────────────────────────────────────────────────────

/** ─── Shared negative prompt segments ─────────────────────────────── */

// Quality / artifact negatives shared by all entity types.
// Kept short so they don't eat into positional budget of critical exclusions.
const QUALITY_NEGATIVES = [
    "blurry", "low quality", "low resolution", "pixelated",
    "watermark", "text overlay", "signature", "jpeg artifacts",
    "overexposed", "underexposed", "bad lighting",
].join(", ");

const ANATOMY_NEGATIVES = [
    "bad anatomy", "malformed limbs", "extra limbs", "missing limbs",
    "fused fingers", "too many fingers", "mutated hands",
    "deformed face", "asymmetrical eyes", "cross-eyed",
].join(", ");

// Human-presence exclusions used in animal / object prompts.
const HUMAN_PRESENCE_NEGATIVES = [
    "human", "person", "man", "woman", "boy", "girl", "child", "baby",
    "people", "crowd", "group", "faces", "human face",
    "owner", "rider", "handler", "trainer", "companion", "family",
    "human hands", "human feet", "human skin", "human hair",
    "human body", "human silhouette",
].join(", ");

// Anthropomorphism exclusions — keep animals looking like animals.
const ANTHRO_NEGATIVES = [
    "anthropomorphic", "humanoid animal", "standing upright like human",
    "cartoon human features", "human expression", "smiling like human",
    "clothed animal unless specified", "dressed animal unless specified",
].join(", ");

// Duo / multi-subject exclusions.
const MULTI_SUBJECT_NEGATIVES = [
    "two subjects", "multiple subjects", "duo", "pair",
    "second character", "background character", "person in background",
].join(", ");

// ─────────────────────────────────────────────────────────────────────────────
// HUMAN AVATAR
//
// IMPROVEMENTS vs. original:
// 1. Constraint block (entity lock + solo anchor) at token position 0.
// 2. Age uses PHYSICAL ANCHORS, not just a number — dramatically improves
//    Pixar model's body proportion accuracy for children vs adults.
// 3. Clothing instruction moved to token position 2 (immediately after lock),
//    with specific descriptor parsing rather than a generic "MANDATORY" label.
// 4. Face-matching instruction references specific anatomical features for
//    the ip-adapter/reference image guidance to latch onto.
// 5. Negative prompt front-loaded with anatomy artifacts (most common failure
//    mode for human generation) rather than generic quality terms.
// 6. "multiple people / second person" exclusions added — Pixar scenes often
//    default to duo compositions.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns physical proportion descriptors appropriate to the character's age.
 * These anchor Pixar's body proportion system far more reliably than a number alone.
 */
function getAgePhysicalDescriptors(age?: string): { label: string; proportions: string } {
    if (!age) return { label: "adult", proportions: "adult proportions, average height, natural limb length" };

    const num = parseInt(age, 10);
    if (isNaN(num)) {
        // Non-numeric age string (e.g. "toddler", "teenage") — pass through
        return { label: age, proportions: "proportions matching age" };
    }

    if (num <= 2)  return { label: `${num}-year-old toddler`,  proportions: "toddler proportions, very large head relative to body, chubby limbs, very short stature, pudgy cheeks, tiny hands and feet" };
    if (num <= 5)  return { label: `${num}-year-old child`,    proportions: "young child proportions, large head, short limbs, rounded cheeks, small nose, wide eyes, small stature" };
    if (num <= 9)  return { label: `${num}-year-old child`,    proportions: "child proportions, head slightly large for body, lean limbs, small stature, youthful face" };
    if (num <= 12) return { label: `${num}-year-old preteen`,  proportions: "preteen proportions, nearly adult head size, growing limbs, slim build, youthful face" };
    if (num <= 17) return { label: `${num}-year-old teenager`, proportions: "teenage proportions, adult-sized head, longer limbs, lean build, youthful facial features" };
    if (num <= 30) return { label: `${num}-year-old young adult`, proportions: "young adult proportions, natural limb length, fit build" };
    if (num <= 55) return { label: `${num}-year-old adult`,    proportions: "adult proportions, natural build" };
    return             { label: `${num}-year-old senior`,     proportions: "senior proportions, slightly shorter stature, softer facial features, natural aging signs" };
}

/**
 * Builds prompt config for a HUMAN avatar.
 *
 * KEY IMPROVEMENTS:
 * - Constraint block at token position 0 (entity lock + solo anchor)
 * - Age-proportional physical descriptors instead of bare number
 * - Clothing at position 2 with specificity-first framing
 * - Face-match instruction calls out specific anatomical features
 * - Negative: anatomy artifacts front-loaded, duo-composition excluded
 */
function buildHumanPromptConfig(
    photoUrl: string,
    name: string,
    gender: string,
    age?: string,
    clothingStyle?: string,
    description?: string,
    storyRole?: string
): { prompt: string; negativePrompt: string; imageInput: string[] } {

    const { label: ageLabel, proportions: ageProportions } = getAgePhysicalDescriptors(age);

    // Clothing: specificity beats vagueness. If no clothing given, use a
    // neutral fallback that at least anchors the model away from generic defaults.
    const clothingDesc = clothingStyle?.trim()
        ? clothingStyle.trim()
        : "casual everyday outfit appropriate to age";

    // Role context — only included if provided, placed after clothing so it
    // doesn't interfere with subject + clothing anchoring.
    const roleContext = storyRole?.trim()
        ? `Story role: ${storyRole.trim()}.`
        : "";

    // Extra physical/personality details — appended last.
    const extraDesc = description?.trim() ? `Additional details: ${description.trim()}.` : "";

    // ── POSITIVE PROMPT ──────────────────────────────────────────────────────
    // Structure: [LOCK] → [SUBJECT] → [CLOTHING] → [FACE MATCH] → [BODY] → [STYLE] → [FRAMING]
    //
    // "ONE character ONLY" at pos 0 prevents duo/group compositions.
    // Clothing placed at pos 3 — close enough to the front to carry strong weight
    // while still after the subject anchor (which needs highest priority).
    const prompt = `ONE character ONLY, single subject, solo portrait.
Pixar 3D animated character portrait of ${name}, ${ageLabel}, ${gender}.
WEARING: ${clothingDesc}. This specific outfit only — no substitutions.
${roleContext}
FACE: Match face shape, skin tone, hair color, and hair style exactly from reference photo.
BODY: ${ageProportions}. Correct scale and proportions for ${ageLabel}.
${extraDesc}
COMPOSITION: Centered, waist-up or full body, looking toward camera, neutral to warm expression.
STYLE: Pixar/Disney 3D animation style, subsurface skin scattering, individual hair strands,
expressive eyes, soft global illumination, clean light gradient background.
Ultra detailed, 8k render quality.`.trim();

    // ── NEGATIVE PROMPT ──────────────────────────────────────────────────────
    // Order: anatomy (most common failure) → duo/multi → clothing override → quality
    const negativePrompt = [
        // Anatomy — most common human generation failure mode
        ANATOMY_NEGATIVES,
        // Duo/multi-subject — Pixar defaults to duo compositions
        MULTI_SUBJECT_NEGATIVES,
        "animals", "pets", "dogs", "cats",
        // Clothing overrides — prevent model swapping the specified outfit
        "different clothing", "generic clothing", "changed outfit", "default outfit",
        "school uniform", "hospital gown", "suit and tie", "tuxedo",
        ...(clothingStyle ? [] : ["elaborate costume", "superhero suit", "princess dress"]),
        // Age-proportion guarding for children
        ...(age && parseInt(age) <= 12 ? [
            "adult body proportions on child", "adult sized limbs", "mature face on child",
        ] : []),
        // Quality
        QUALITY_NEGATIVES,
    ].join(", ");

    return { prompt, negativePrompt, imageInput: [photoUrl] };
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMAL AVATAR
//
// ROOT CAUSE RECAP:
//   Original used "wildlife photography" framing + "Pixar 3D render" — two
//   incompatible training corpora. The model averaged between them, producing
//   neither style reliably AND activating photography's compositional bias
//   toward environmental context (which often includes humans).
//
// KEY IMPROVEMENTS:
// 1. Unified Pixar 3D style throughout — same corpus as human prompts.
//    This removes the photography/3D conflict and gives cross-character
//    style consistency in the storybook.
// 2. Solo anchor expanded: "[BREED] ONLY, solo subject, no humans, no other animals"
//    at tokens 0–10 before any character info.
// 3. Species/breed description is built with defensive fallbacks to avoid
//    nonsense like "male animal" when description is empty.
// 4. "Named pet" framing removed from token-0 area — activates duo patterns.
//    Name appears later, in a supporting role only.
// 5. Negative prompt: human-presence exclusions at front (most critical for
//    animal generation), anthropomorphism next, quality last.
// 6. Clothing/accessory logic: when no clothing given, positive prompt
//    explicitly states "no clothing, natural fur/feathers/scales only" so the
//    model doesn't dress the animal by default (Pixar-style animals are often
//    clothed in training data — Zootopia, etc.).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a clean, defensively-safe species description string.
 * Avoids bare "male animal" or "female" when no description is given.
 */
function buildSpeciesDescription(
    gender: string,
    description?: string
): string {
    const genderLabel = gender === "male" ? "male" : gender === "female" ? "female" : "";

    if (description?.trim()) {
        // If user gave a description (e.g. "golden retriever with fluffy coat"),
        // prepend gender only if it's meaningful (male/female, not "other").
        return genderLabel
            ? `${genderLabel} ${description.trim()}`
            : description.trim();
    }

    // No description — use a safe generic that at least gives the model a species context.
    // Avoid bare "animal" which is too abstract for Pixar models to resolve cleanly.
    return genderLabel ? `${genderLabel} animal` : "animal";
}

/**
 * Builds prompt config for an ANIMAL avatar.
 *
 * KEY IMPROVEMENTS:
 * - Unified Pixar 3D style (no photography framing conflict)
 * - Hard solo anchor at token position 0 with explicit species lock
 * - Breed/species description built defensively
 * - "No clothing" explicitly stated in positive prompt when not requested
 *   (critical because Pixar training data frequently clothes animals)
 * - Negative prompt: human exclusions front-loaded, then anthro, then quality
 * - "Named pet" opening pattern removed — name appears mid-prompt only
 */
function buildAnimalPromptConfig(
    photoUrl: string,
    name: string,
    gender: string,
    description?: string,
    clothingStyle?: string
): { prompt: string; negativePrompt: string; imageInput: string[] } {

    const speciesDesc = buildSpeciesDescription(gender, description);

    // Accessory/clothing block:
    // If clothing given → state it positively with high specificity.
    // If not → explicitly state "no clothing" to counter Pixar's clothed-animal bias.
    const clothingBlock = clothingStyle?.trim()
        ? `ACCESSORY: The animal is wearing ${clothingStyle.trim()}. Clearly visible and correctly fitted to the animal's body.`
        : `APPEARANCE: Natural fur, feathers, or scales only. No clothing, no accessories, no human items on the animal.`;

    // ── POSITIVE PROMPT ──────────────────────────────────────────────────────
    // Structure: [LOCK] → [SPECIES] → [NAME IDENTITY] → [APPEARANCE/ACCESSORY]
    //            → [REFERENCE MATCH] → [POSE] → [STYLE] → [FRAMING]
    //
    // "NO HUMANS" appears at token position 1 — earlier than any other token
    // that could trigger a companion-animal compositional pattern.
    const prompt = `SOLO ANIMAL ONLY, NO HUMANS, single subject centered.
Pixar 3D animated character portrait of one ${speciesDesc}. This character's name is ${name}.
${clothingBlock}
MATCH FROM REFERENCE PHOTO: exact breed, fur/coat color, markings, eye color, ear shape, tail type.
POSE: animal sitting or standing, facing toward camera, alert and expressive.
EXPRESSION: bright eyes, natural animal expression — no humanized smile or emotion.
BACKGROUND: simple soft gradient, warm studio lighting, no environment, no props.
STYLE: Pixar/Disney 3D animation, individual fur strands, realistic eye reflections,
subsurface skin on nose and ear tips, soft rim lighting. Ultra detailed, 8k render quality.`.trim();

    // ── NEGATIVE PROMPT ──────────────────────────────────────────────────────
    // Critical order: humans first (primary failure mode) → anthro → multi-subject → quality
    const negativePrompt = [
        // ① Human presence — front-loaded, highest positional weight
        HUMAN_PRESENCE_NEGATIVES,
        // ② Anthropomorphism — second priority
        ANTHRO_NEGATIVES,
        // ③ Extra subjects
        MULTI_SUBJECT_NEGATIVES,
        "multiple animals", "extra animals", "second animal",
        // ④ Clothing override guard (if no clothing specified)
        ...(clothingStyle ? [] : [
            "wearing clothes", "wearing shirt", "wearing dress", "wearing hat",
            "wearing collar with tag" // allow natural collars but block dressed-up versions
        ]),
        // ⑤ Quality
        QUALITY_NEGATIVES,
    ].join(", ");

    return { prompt, negativePrompt, imageInput: [photoUrl] };
}

// ─────────────────────────────────────────────────────────────────────────────
// OBJECT AVATAR
//
// KEY IMPROVEMENTS:
// 1. Entity lock at token position 0.
// 2. Description integrated with high specificity.
// 3. Negative front-loaded with human + animal exclusions.
// 4. "Character-ification" option: objects in children's storybooks often
//    have a face/personality (think Pixar's Luxo Jr, Cars). The prompt
//    supports this via a "hasPersonality" hint in the description if the
//    user provides character context.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds prompt config for an OBJECT avatar.
 * Improved: entity lock at front, specificity-first, negative front-loaded.
 */
function buildObjectPromptConfig(
    photoUrl: string,
    name: string,
    description?: string,
): { prompt: string; negativePrompt: string; imageInput: string[] } {

    const subjectDesc = description?.trim() || "object";

    // Detect if the user's description implies a character-like object
    // (e.g. "friendly red toy car with big eyes") — if so, use Pixar framing.
    // Otherwise use clean product/illustration framing.
    const isCharacterObject = description?.match(/\b(face|eyes|mouth|friendly|happy|sad|smile|character|personality)\b/i);

    const styleBlock = isCharacterObject
        ? `STYLE: Pixar 3D animated character object. Give it large expressive eyes, a friendly personality.
Soft studio lighting, simple gradient background. Ultra detailed, 8k.`
        : `STYLE: Clean 3D illustration, product-style render. Isolated on soft white background.
Studio three-point lighting. Sharp focus on details. Ultra detailed, 8k.`;

    const prompt = `SINGLE OBJECT ONLY, NO HUMANS, NO ANIMALS, solo subject.
Pixar-style 3D render of a ${subjectDesc}. The object's name is "${name}".
MATCH FROM REFERENCE PHOTO: exact shape, color, texture, material, and proportions.
${styleBlock}`.trim();

    const negativePrompt = [
        HUMAN_PRESENCE_NEGATIVES,
        "animal", "pet", "creature",
        MULTI_SUBJECT_NEGATIVES,
        "multiple objects", "cluttered scene", "environment", "room background",
        QUALITY_NEGATIVES,
    ].join(", ");

    return { prompt, negativePrompt, imageInput: [photoUrl] };
}

// ─────────────────────────────────────────────────────────────────────────────
// generateMultiAngleAvatars — main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Selects the correct prompt builder based on entityType, then generates
 * a single high-quality avatar image via Seedream.
 *
 * WHAT CHANGED:
 * - Each builder now applies the prompt engineering principles documented above.
 * - Detailed logging so prompt regressions are easy to diagnose.
 * - Error message includes entity type for faster triage.
 */
export async function generateMultiAngleAvatars(
    photoUrl: string,
    name: string,
    gender: string,
    entityType: string,
    artStyle: string,
    age?: string,
    clothingStyle?: string,
    description?: string,
    storyRole?: string
): Promise<string[]> {
    const { generateWithSeedream } = await import("@/lib/replicate");

    // ── Select prompt config ─────────────────────────────────────────────────
    let config: { prompt: string; negativePrompt: string; imageInput: string[] };

    if (entityType === "human") {
        config = buildHumanPromptConfig(
            photoUrl, name, gender, age, clothingStyle, description, storyRole
        );
    } else if (entityType === "animal") {
        config = buildAnimalPromptConfig(
            photoUrl, name, gender, description, clothingStyle
        );
    } else {
        // "object" or any future entity type
        config = buildObjectPromptConfig(photoUrl, name, description);
    }

    const seed = Math.floor(Math.random() * 1_000_000);
    const aspectRatio = "1:1";

    // ── Debug logging ────────────────────────────────────────────────────────
    console.log(`\n[generateAvatar] ══════════════════════════════════════`);
    console.log(`[generateAvatar] Name:       ${name}`);
    console.log(`[generateAvatar] Entity:     ${entityType}`);
    console.log(`[generateAvatar] Gender:     ${gender}`);
    console.log(`[generateAvatar] Age:        ${age ?? "n/a"}`);
    console.log(`[generateAvatar] Clothing:   ${clothingStyle ?? "none specified"}`);
    console.log(`[generateAvatar] Description:${description ?? "none"}`);
    console.log(`[generateAvatar] StoryRole:  ${storyRole ?? "none"}`);
    console.log(`[generateAvatar] RefImage:   ${config.imageInput[0] ?? "none"}`);
    console.log(`[generateAvatar] ── POSITIVE PROMPT ─────────────────────`);
    console.log(config.prompt);
    console.log(`[generateAvatar] ── NEGATIVE PROMPT ─────────────────────`);
    console.log(config.negativePrompt);
    console.log(`[generateAvatar] ══════════════════════════════════════\n`);

    try {
        const url = await generateWithSeedream(
            config.prompt,
            seed,
            aspectRatio,
            config.negativePrompt,
            config.imageInput
        );

        if (!url) throw new Error(`Seedream returned no image URL for ${entityType} "${name}"`);

        console.log(`[generateAvatar] ✓ Avatar generated successfully for ${entityType} "${name}"`);
        return [url];

    } catch (error) {
        console.error(`[generateAvatar] ✗ Failed [${entityType}] "${name}":`, error);
        throw error;
    }
}

/**
 * Legacy wrapper — returns the first generated URL.
 */
export async function generateAvatarFromPhoto(
    photoUrl: string,
    name: string,
    gender: string,
    entityType: string,
    artStyle: string,
    age?: string,
    clothingStyle?: string,
    description?: string,
    storyRole?: string
): Promise<string> {
    const urls = await generateMultiAngleAvatars(
        photoUrl, name, gender, entityType, artStyle, age, clothingStyle, description, storyRole
    );
    return urls[0];
}