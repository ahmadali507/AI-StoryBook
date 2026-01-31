-- Print-on-demand orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  storybook_id UUID REFERENCES storybooks(id) ON DELETE SET NULL,
  
  -- Order status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Order created, awaiting payment
    'paid',         -- Payment confirmed
    'processing',   -- Being printed
    'shipped',      -- In transit
    'delivered',    -- Delivered
    'cancelled',    -- Order cancelled
    'refunded'      -- Refunded
  )),
  
  -- Product details
  product_type TEXT DEFAULT 'hardcover' CHECK (product_type IN ('softcover', 'hardcover', 'premium')),
  quantity INTEGER DEFAULT 1,
  
  -- Pricing (stored in cents to avoid floating point issues)
  unit_price_cents INTEGER NOT NULL,
  shipping_cents INTEGER DEFAULT 0,
  tax_cents INTEGER DEFAULT 0,
  total_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Payment info
  payment_provider TEXT, -- 'stripe', 'paypal', etc.
  payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'unpaid',
  
  -- Shipping address (JSON for flexibility)
  shipping_address JSONB,
  
  -- Tracking
  tracking_number TEXT,
  tracking_url TEXT,
  
  -- POD provider info
  pod_provider TEXT, -- 'lulu', 'printful', 'blurb', etc.
  pod_order_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending orders"
ON orders FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_storybook_id ON orders(storybook_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
