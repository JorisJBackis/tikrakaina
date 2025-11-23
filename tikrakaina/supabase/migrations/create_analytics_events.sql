-- Create analytics_events table for custom event tracking
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_data JSONB DEFAULT '{}',
  user_agent TEXT,
  page_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert events (for anonymous tracking)
CREATE POLICY "Anyone can insert events" ON analytics_events
  FOR INSERT WITH CHECK (true);

-- Policy: Only authenticated users can view their own events
CREATE POLICY "Users can view own events" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service role can view all events (for admin dashboard)
CREATE POLICY "Service role can view all" ON analytics_events
  FOR SELECT USING (auth.role() = 'service_role');

-- Add comment
COMMENT ON TABLE analytics_events IS 'Custom analytics events tracking user behavior';
