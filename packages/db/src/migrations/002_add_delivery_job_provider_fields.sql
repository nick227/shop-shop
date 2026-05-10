-- Add generic provider fields to delivery_jobs table
-- This supports multiple delivery providers with consistent schema

ALTER TABLE delivery_jobs 
ADD COLUMN provider TEXT NOT NULL DEFAULT 'IN_HOUSE',
ADD COLUMN provider_external_id TEXT,
ADD COLUMN provider_status TEXT,
ADD COLUMN provider_tracking_url TEXT,
ADD COLUMN provider_quote_json JSONB,
ADD COLUMN provider_create_json JSONB,
ADD COLUMN provider_courier_json JSONB,
ADD COLUMN provider_fee_cents INTEGER,
ADD COLUMN provider_quote_expires_at TIMESTAMP,
ADD COLUMN estimated_pickup_at TIMESTAMP,
ADD COLUMN estimated_dropoff_at TIMESTAMP,
ADD COLUMN last_known_lat DECIMAL(10, 8),
ADD COLUMN last_known_lng DECIMAL(11, 8),
ADD COLUMN last_provider_payload_json JSONB;

-- Add indexes for performance
CREATE INDEX idx_delivery_jobs_provider ON delivery_jobs(provider);
CREATE INDEX idx_delivery_jobs_provider_external_id ON delivery_jobs(provider_external_id);
CREATE INDEX idx_delivery_jobs_provider_status ON delivery_jobs(provider_status);
