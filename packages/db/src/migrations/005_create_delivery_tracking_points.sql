-- Create generic tracking points table
-- This table stores location updates from delivery providers

CREATE TABLE delivery_tracking_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_job_id UUID NOT NULL REFERENCES delivery_jobs(id),
  provider TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  accuracy_meters INTEGER,
  speed_mph DECIMAL(5, 2),
  heading_degrees INTEGER,
  provider_payload JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_delivery_tracking_points_delivery_job_id ON delivery_tracking_points(delivery_job_id);
CREATE INDEX idx_delivery_tracking_points_provider ON delivery_tracking_points(provider);
CREATE INDEX idx_delivery_tracking_points_timestamp ON delivery_tracking_points(timestamp);
CREATE INDEX idx_delivery_tracking_points_location ON delivery_tracking_points(latitude, longitude);
