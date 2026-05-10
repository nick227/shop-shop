-- Enable DoorDash for a test store (Bakery Bliss North Central)
-- This script adds DoorDash delivery options to an existing store

-- First, let's find a store to update
SELECT id, name, slug FROM stores WHERE name LIKE '%Bakery Bliss%' LIMIT 1;

-- Add DoorDash delivery option for the store
INSERT INTO store_delivery_options (
  id,
  store_id,
  delivery_mode,
  enabled,
  fee_disclosure,
  external_info_url,
  sort_order,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM stores WHERE name LIKE '%Bakery Bliss%' LIMIT 1),
  'DOORDASH_DRIVE',
  true,
  '$5.99 delivery fee',
  'https://www.doordash.com',
  2,
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE
  enabled = true,
  fee_disclosure = '$5.99 delivery fee',
  external_info_url = 'https://www.doordash.com',
  sort_order = 2,
  updated_at = NOW();

-- Add DoorDash provider config for the store
INSERT INTO store_delivery_provider_configs (
  id,
  store_id,
  provider,
  enabled,
  settings_json,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM stores WHERE name LIKE '%Bakery Bliss%' LIMIT 1),
  'DOORDASH_DRIVE',
  true,
  JSON_OBJECT(
    'maxDeliveryRadiusMiles', 10,
    'minDeliveryOrderCents', 1000,
    'deliveryInstructions', 'Leave at door',
    'pickupContactName', 'Bakery Bliss Manager',
    'pickupContactPhone', '555-0123'
  ),
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE
  enabled = true,
  settings_json = JSON_OBJECT(
    'maxDeliveryRadiusMiles', 10,
    'minDeliveryOrderCents', 1000,
    'deliveryInstructions', 'Leave at door',
    'pickupContactName', 'Bakery Bliss Manager',
    'pickupContactPhone', '555-0123'
  ),
  updated_at = NOW();

-- Verify the setup
SELECT 
  s.name as store_name,
  sdo.delivery_mode,
  sdo.enabled,
  sdo.fee_disclosure,
  sdo.external_info_url,
  sdpc.provider,
  sdpc.enabled as provider_enabled,
  sdpc.settings_json
FROM stores s
LEFT JOIN store_delivery_options sdo ON s.id = sdo.store_id
LEFT JOIN store_delivery_provider_configs sdpc ON s.id = sdpc.store_id
WHERE s.name LIKE '%Bakery Bliss%'
ORDER BY sdo.sort_order;
