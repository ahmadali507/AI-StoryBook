-- Add regeneration credits and illustration metadata to storybooks
-- Credits: 10 per book for image regeneration (1 credit = 1 scene re-generation)
-- Metadata: stores the original prompt/seed/negative-prompt per scene so we can
--           regenerate without re-calling the LLM

ALTER TABLE storybooks
  ADD COLUMN IF NOT EXISTS regeneration_credits INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS illustration_metadata JSONB DEFAULT '[]'::jsonb;

-- illustration_metadata structure:
-- [
--   {
--     "sceneNumber": 1,
--     "illustrationPrompt": "Pixar style 3D cinematic scene...",
--     "sceneSeed": 100001,
--     "negativePrompt": "text, logos, watermark...",
--     "referenceImages": ["https://..."]
--   },
--   ...
-- ]

COMMENT ON COLUMN storybooks.regeneration_credits IS 'Number of remaining image regeneration credits (default 10 per book)';
COMMENT ON COLUMN storybooks.illustration_metadata IS 'JSONB array storing per-scene prompt metadata for deterministic regeneration';
