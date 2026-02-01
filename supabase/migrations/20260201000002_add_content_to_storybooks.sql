-- Add content and cover_image_url columns to storybooks table

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'storybooks' AND column_name = 'content') THEN 
        ALTER TABLE storybooks ADD COLUMN content JSONB; 
    END IF; 

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'storybooks' AND column_name = 'cover_image_url') THEN 
        ALTER TABLE storybooks ADD COLUMN cover_image_url TEXT; 
    END IF;
END $$;
