-- Create generic store delivery provider configuration table
-- This table allows each store to configure provider-specific settings

CREATE TABLE store_delivery_provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  provider TEXT NOT NULL, -- 'IN_HOUSE', 'DOORDASH_DRIVE', 'UBER_DIRECT'
  enabled BOOLEAN NOT NULL DEFAULT false,
  settings_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(store_id, provider)
);

-- Add indexes for performance
CREATE INDEX idx_store_delivery_provider_configs_store_id ON store_delivery_provider_configs(store_id);
CREATE INDEX idx_store_delivery_provider_configs_provider ON store_delivery_provider_configs(provider);
CREATE INDEX idx_store_delivery_provider_configs_enabled ON store_delivery_provider_configs(enabled);

-- Insert default provider configs for existing stores
INSERT INTO store_delivery_provider_configs (store_id, provider, enabled, settings_json)
SELECT 
  id,
  'IN_HOUSE' as provider,
  true as enabled,
  '{
    "maxDeliveryRadiusMiles": 5,
    "minDeliveryOrderCents": 500,
    "deliveryInstructions": "Ring doorbell",
    "pickupContactName": "Store Manager",
    "pickupContactPhone": "555-0123"
  }'::jsonb as settings_json
FROM stores 
WHERE id NOT IN (
  SELECT store_id FROM store_delivery_provider_configs
);

INSERT INTO store_delivery_provider_configs (store_id, provider, enabled, settings_json)
SELECT 
  id,
  'DOORDASH_DRIVE' as provider,
  false as enabled,
  '{
    "maxDeliveryRadiusMiles": 10,
    "minDeliveryOrderCents": 1000,
    "deliveryInstructions": "Leave at door",
    "pickupContactName": "John Doe",
    "pickupContactPhone": "555-0123"
  }'::jsonb as settings_json
FROM stores 
WHERE id NOT IN (
  SELECT store_id FROM store_delivery_provider_configs
  WHERE provider = 'IN_HOUSE'
);
