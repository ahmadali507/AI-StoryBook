-- Characters table for storing character profiles
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  appearance JSONB NOT NULL DEFAULT '{}'::jsonb,
  personality TEXT[] DEFAULT '{}',
  visual_prompt TEXT NOT NULL,
  art_style TEXT NOT NULL,
  seed_number INTEGER NOT NULL,
  reference_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own characters"
ON characters FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own characters"
ON characters FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own characters"
ON characters FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own characters"
ON characters FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster user queries
CREATE INDEX idx_characters_user_id ON characters(user_id);
