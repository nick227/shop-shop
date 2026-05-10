-- Create store delivery options table
-- This table allows each store to configure their delivery options independently
-- Each delivery mode gets its own row (no BOTH enum needed)

CREATE TABLE store_delivery_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  delivery_mode TEXT NOT NULL, -- 'IN_HOUSE', 'DOORDASH_DRIVE'
  enabled BOOLEAN NOT NULL DEFAULT false,
  fee_disclosure TEXT, -- User-facing fee information
  external_info_url TEXT, -- Link to DoorDash info, terms, etc.
  sort_order INTEGER NOT NULL DEFAULT 0, -- For consistent UI ordering
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(store_id, delivery_mode)
);

-- Add indexes for performance
CREATE INDEX idx_store_delivery_options_store_id ON store_delivery_options(store_id);
CREATE INDEX idx_store_delivery_options_enabled ON store_delivery_options(enabled);

-- Insert default delivery options for existing stores
INSERT INTO store_delivery_options (store_id, delivery_mode, enabled, sort_order)
SELECT 
  id,
  'IN_HOUSE' as delivery_mode,
  true as enabled,
  0 as sort_order
FROM stores 
WHERE id NOT IN (
  SELECT store_id FROM store_delivery_options
);

INSERT INTO store_delivery_options (store_id, delivery_mode, enabled, sort_order)
SELECT 
  id,
  'DOORDASH_DRIVE' as delivery_mode,
  false as enabled,
  1 as sort_order
FROM stores 
WHERE id NOT IN (
  SELECT store_id FROM store_delivery_options
  WHERE delivery_mode = 'IN_HOUSE'
);
