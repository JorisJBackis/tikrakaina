-- Create table for tracking anonymous analyses
-- This tracks free trial usage to prevent abuse

CREATE TABLE IF NOT EXISTS anonymous_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_fingerprint TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes for fast lookups
  INDEX idx_device_fingerprint (device_fingerprint),
  INDEX idx_ip_address (ip_address),
  INDEX idx_created_at (created_at)
);

-- Enable RLS (Row Level Security)
ALTER TABLE anonymous_analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (for tracking)
CREATE POLICY "Anyone can track anonymous analysis"
  ON anonymous_analyses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Anyone can read (for checking if exceeded)
CREATE POLICY "Anyone can check free trial status"
  ON anonymous_analyses
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Cleanup old entries (older than 90 days) - Optional
-- Run this periodically to keep table small
CREATE OR REPLACE FUNCTION cleanup_old_anonymous_analyses()
RETURNS void AS $$
BEGIN
  DELETE FROM anonymous_analyses
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment
COMMENT ON TABLE anonymous_analyses IS 'Tracks anonymous (no-account) analyses to enforce 1 free analysis limit';
