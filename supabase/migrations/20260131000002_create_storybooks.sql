-- Storybooks table
CREATE TABLE IF NOT EXISTS storybooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  art_style TEXT NOT NULL,
  global_seed INTEGER NOT NULL,
  setting TEXT NOT NULL,
  theme TEXT,
  target_chapters INTEGER DEFAULT 7,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'complete', 'printed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link table for storybook characters (many-to-many)
CREATE TABLE IF NOT EXISTS storybook_characters (
  storybook_id UUID REFERENCES storybooks(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  position TEXT DEFAULT 'main',
  PRIMARY KEY (storybook_id, character_id)
);

-- Enable RLS
ALTER TABLE storybooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE storybook_characters ENABLE ROW LEVEL SECURITY;

-- RLS policies for storybooks
CREATE POLICY "Users can view own storybooks"
ON storybooks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own storybooks"
ON storybooks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own storybooks"
ON storybooks FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own storybooks"
ON storybooks FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for storybook_characters
CREATE POLICY "Users can view own storybook_characters"
ON storybook_characters FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM storybooks 
    WHERE id = storybook_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own storybook_characters"
ON storybook_characters FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM storybooks 
    WHERE id = storybook_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own storybook_characters"
ON storybook_characters FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM storybooks 
    WHERE id = storybook_id AND user_id = auth.uid()
  )
);

-- Indexes
CREATE INDEX idx_storybooks_user_id ON storybooks(user_id);
CREATE INDEX idx_storybook_characters_storybook ON storybook_characters(storybook_id);
