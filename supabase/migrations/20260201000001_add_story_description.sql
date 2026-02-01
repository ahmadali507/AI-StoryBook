-- Add description column to storybooks table
ALTER TABLE storybooks 
ADD COLUMN IF NOT EXISTS description TEXT;
