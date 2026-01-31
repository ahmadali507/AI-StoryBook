-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storybook_id UUID REFERENCES storybooks(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  scene_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Illustrations table
CREATE TABLE IF NOT EXISTS illustrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  prompt_used TEXT NOT NULL,
  seed_used INTEGER NOT NULL,
  position INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE illustrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for chapters
CREATE POLICY "Users can view own chapters"
ON chapters FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM storybooks 
    WHERE id = storybook_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own chapters"
ON chapters FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM storybooks 
    WHERE id = storybook_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own chapters"
ON chapters FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM storybooks 
    WHERE id = storybook_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own chapters"
ON chapters FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM storybooks 
    WHERE id = storybook_id AND user_id = auth.uid()
  )
);

-- RLS policies for illustrations
CREATE POLICY "Users can view own illustrations"
ON illustrations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chapters c
    JOIN storybooks s ON c.storybook_id = s.id
    WHERE c.id = chapter_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own illustrations"
ON illustrations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chapters c
    JOIN storybooks s ON c.storybook_id = s.id
    WHERE c.id = chapter_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own illustrations"
ON illustrations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM chapters c
    JOIN storybooks s ON c.storybook_id = s.id
    WHERE c.id = chapter_id AND s.user_id = auth.uid()
  )
);

-- Indexes
CREATE INDEX idx_chapters_storybook ON chapters(storybook_id);
CREATE INDEX idx_illustrations_chapter ON illustrations(chapter_id);
