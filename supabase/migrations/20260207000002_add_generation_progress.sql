-- Migration to add generation progress tracking
-- This allows real-time progress updates in the UI

-- Add generation_progress JSONB column to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS generation_progress JSONB DEFAULT '{}'::jsonb;

-- The progress structure will be:
-- {
--   "stage": "outline" | "narrative" | "cover" | "illustrations" | "layout" | "complete",
--   "stageProgress": 0-100,
--   "currentScene": 1-12 (for narrative/illustration stages),
--   "totalScenes": 12,
--   "message": "Current status message",
--   "startedAt": "ISO timestamp",
--   "updatedAt": "ISO timestamp"
-- }

-- Create index for faster queries on status
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Comment for documentation
COMMENT ON COLUMN orders.generation_progress IS 'JSONB tracking detailed generation progress for real-time UI updates';
