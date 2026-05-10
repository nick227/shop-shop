-- Create generic provider event tracking table
-- This table stores webhook events from delivery providers with idempotency

CREATE TABLE delivery_provider_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_job_id UUID NOT NULL REFERENCES delivery_jobs(id),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, event_id, delivery_job_id)
);

-- Add indexes for performance
CREATE INDEX idx_delivery_provider_events_delivery_job_id ON delivery_provider_events(delivery_job_id);
CREATE INDEX idx_delivery_provider_events_provider ON delivery_provider_events(provider);
CREATE INDEX idx_delivery_provider_events_processed ON delivery_provider_events(processed);
CREATE INDEX idx_delivery_provider_events_timestamp ON delivery_provider_events(timestamp);
CREATE INDEX idx_delivery_provider_events_event_type ON delivery_provider_events(event_type);
