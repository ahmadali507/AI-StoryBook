-- MVP Simplification Migration
-- Adds photo-based character support and order-centric flow

-- 1. Add new columns to characters table for photo-based characters
ALTER TABLE characters 
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS ai_avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS entity_type TEXT DEFAULT 'human';

-- Add check constraint for gender
DO $$ BEGIN
  ALTER TABLE characters ADD CONSTRAINT characters_gender_check 
    CHECK (gender IN ('male', 'female', 'other'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add check constraint for entity_type
DO $$ BEGIN
  ALTER TABLE characters ADD CONSTRAINT characters_entity_type_check 
    CHECK (entity_type IN ('human', 'animal', 'object'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add new columns to storybooks table
ALTER TABLE storybooks 
  ADD COLUMN IF NOT EXISTS age_range TEXT DEFAULT '5-8',
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Add check constraint for age_range
DO $$ BEGIN
  ALTER TABLE storybooks ADD CONSTRAINT storybooks_age_range_check 
    CHECK (age_range IN ('0-2', '2-4', '5-8', '9-12'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. Create order_characters table for inline character creation during order
CREATE TABLE IF NOT EXISTS order_characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  ai_avatar_url TEXT,
  gender TEXT NOT NULL DEFAULT 'other' CHECK (gender IN ('male', 'female', 'other')),
  entity_type TEXT NOT NULL DEFAULT 'human' CHECK (entity_type IN ('human', 'animal', 'object')),
  role TEXT DEFAULT 'main' CHECK (role IN ('main', 'supporting')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on order_characters
ALTER TABLE order_characters ENABLE ROW LEVEL SECURITY;

-- RLS policies for order_characters
CREATE POLICY "Users can view own order_characters"
ON order_characters FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE id = order_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own order_characters"
ON order_characters FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE id = order_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own order_characters"
ON order_characters FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE id = order_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own order_characters"
ON order_characters FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE id = order_id AND user_id = auth.uid()
  )
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_characters_order_id ON order_characters(order_id);

-- 4. Update orders table to support MVP flow
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cover_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS book_generation_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS book_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- Update status check to include new MVP statuses
-- First drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add new constraint with MVP status values
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN (
  'draft',           -- Initial state, form incomplete
  'cover_preview',   -- Cover generated, awaiting payment
  'pending',         -- Old value, kept for backwards compatibility
  'paid',            -- Payment confirmed
  'generating',      -- Full book being generated
  'complete',        -- Book ready for download
  'processing',      -- Being printed (physical)
  'shipped',         -- In transit (physical)
  'delivered',       -- Delivered (physical)
  'cancelled',       -- Order cancelled
  'refunded'         -- Refunded
));

-- 5. Add template support for pre-made stories
CREATE TABLE IF NOT EXISTS story_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  age_range TEXT NOT NULL CHECK (age_range IN ('0-2', '2-4', '5-8', '9-12')),
  theme TEXT NOT NULL,
  story_outline JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert some default templates
INSERT INTO story_templates (name, description, age_range, theme, story_outline) VALUES
('Bedtime Adventure', 'A calming journey to dreamland', '2-4', 'bedtime', '[
  {"scene": 1, "prompt": "The moon rises over the cozy house"},
  {"scene": 2, "prompt": "Character gets ready for bed"},
  {"scene": 3, "prompt": "A magical dream begins"},
  {"scene": 4, "prompt": "Flying through starry skies"},
  {"scene": 5, "prompt": "Meeting friendly dream creatures"},
  {"scene": 6, "prompt": "Dancing with moonbeams"},
  {"scene": 7, "prompt": "Finding a cozy cloud bed"},
  {"scene": 8, "prompt": "Hugging a star goodnight"},
  {"scene": 9, "prompt": "Floating back home"},
  {"scene": 10, "prompt": "Snuggling into bed"},
  {"scene": 11, "prompt": "Closing eyes peacefully"},
  {"scene": 12, "prompt": "Sweet dreams until morning"}
]'::jsonb),
('Animal Friends', 'Making friends with forest animals', '5-8', 'animals', '[
  {"scene": 1, "prompt": "Character discovers a magical forest path"},
  {"scene": 2, "prompt": "Meeting a friendly rabbit"},
  {"scene": 3, "prompt": "A wise owl shares a secret"},
  {"scene": 4, "prompt": "Playing with butterflies in a meadow"},
  {"scene": 5, "prompt": "Helping a lost baby deer"},
  {"scene": 6, "prompt": "Swimming with friendly fish"},
  {"scene": 7, "prompt": "A picnic with forest friends"},
  {"scene": 8, "prompt": "Learning animal songs"},
  {"scene": 9, "prompt": "A thunderstorm brings everyone together"},
  {"scene": 10, "prompt": "Building a treehouse together"},
  {"scene": 11, "prompt": "Watching sunset with new friends"},
  {"scene": 12, "prompt": "Promising to return tomorrow"}
]'::jsonb)
ON CONFLICT DO NOTHING;
