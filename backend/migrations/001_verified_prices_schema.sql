-- ============================================================================
-- VERIFIED PRICES DATA COLLECTION SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Table 1: listing_snapshots
-- Stores daily snapshots of listings for tracking changes
CREATE TABLE IF NOT EXISTS listing_snapshots (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL,                    -- Aruodas ID (e.g., 1403809)
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    url TEXT NOT NULL,

    -- Price info
    price INTEGER,                                  -- Monthly price in EUR
    price_per_m2 NUMERIC(10,2),

    -- Core property features
    area_m2 NUMERIC(10,2),
    rooms INTEGER,
    floor_current INTEGER,
    floor_total INTEGER,
    year_built INTEGER,
    district TEXT,
    street TEXT,

    -- Broker detection
    is_broker_listing BOOLEAN DEFAULT FALSE,
    broker_score INTEGER DEFAULT 0,                 -- Negative = broker, Positive = owner
    phone_normalized TEXT,                          -- For multi-listing detection

    -- Engagement metrics
    views_total INTEGER,
    views_today INTEGER,
    saves_count INTEGER,

    -- Dates from listing
    date_posted TIMESTAMPTZ,
    date_edited TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,

    -- Fingerprint for repost detection
    fingerprint_hash TEXT,

    -- Raw data for ML features
    raw_features JSONB,

    -- Metadata
    scraped_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate snapshots
    UNIQUE(listing_id, snapshot_date)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_snapshots_listing_id ON listing_snapshots(listing_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON listing_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_snapshots_fingerprint ON listing_snapshots(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_snapshots_phone ON listing_snapshots(phone_normalized);

-- Table 2: listing_lifecycle
-- Tracks each listing from first appearance to removal
CREATE TABLE IF NOT EXISTS listing_lifecycle (
    listing_id BIGINT PRIMARY KEY,
    url TEXT NOT NULL,

    -- Lifecycle timestamps
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,

    -- Status tracking
    status TEXT NOT NULL DEFAULT 'ACTIVE',          -- ACTIVE, MISSING, ENDED
    consecutive_missing_days INTEGER DEFAULT 0,
    outcome TEXT,                                   -- RENTED_CONFIRMED, RENTED_INFERRED, EXPIRED, REMOVED, REPOSTED

    -- Price tracking
    initial_price INTEGER,
    last_price INTEGER,
    price_changes INTEGER DEFAULT 0,
    price_history JSONB DEFAULT '[]'::jsonb,        -- [{date, price}, ...]

    -- Time on market
    days_on_market INTEGER,
    removal_speed TEXT,                             -- FAST (<7d), MEDIUM (7-30d), SLOW (>30d)

    -- Broker/Owner detection
    broker_score INTEGER DEFAULT 0,
    phone_normalized TEXT,
    is_multi_listing_phone BOOLEAN DEFAULT FALSE,

    -- Engagement
    max_views INTEGER DEFAULT 0,
    max_saves INTEGER DEFAULT 0,
    engagement_score NUMERIC(5,2) DEFAULT 0,

    -- Repost detection
    fingerprint_hash TEXT,
    repost_chain_id UUID,                           -- Links reposted listings together
    is_repost BOOLEAN DEFAULT FALSE,
    original_listing_id BIGINT,

    -- Core features (for ML)
    area_m2 NUMERIC(10,2),
    rooms INTEGER,
    district TEXT,
    floor_current INTEGER,
    floor_total INTEGER,
    year_built INTEGER,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lifecycle_status ON listing_lifecycle(status);
CREATE INDEX IF NOT EXISTS idx_lifecycle_outcome ON listing_lifecycle(outcome);
CREATE INDEX IF NOT EXISTS idx_lifecycle_fingerprint ON listing_lifecycle(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_lifecycle_phone ON listing_lifecycle(phone_normalized);
CREATE INDEX IF NOT EXISTS idx_lifecycle_repost_chain ON listing_lifecycle(repost_chain_id);

-- Table 3: verified_prices
-- Curated high-quality training data
CREATE TABLE IF NOT EXISTS verified_prices (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES listing_lifecycle(listing_id),

    -- Verified price info
    verified_price INTEGER NOT NULL,
    verified_price_per_m2 NUMERIC(10,2),

    -- Confidence scoring
    confidence_score NUMERIC(4,3) NOT NULL,         -- 0.000 - 1.000
    confidence_tier TEXT NOT NULL,                  -- GOLD, SILVER, BRONZE

    -- Verification signals
    verification_signals JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Example: {
    --   "quick_removal": true,
    --   "days_on_market": 5,
    --   "is_broker": true,
    --   "price_stable": true,
    --   "high_engagement": true,
    --   "rented_badge_seen": false
    -- }

    -- ML features (ready to use)
    features JSONB NOT NULL,
    -- Example: {
    --   "area_m2": 45.5,
    --   "rooms": 2,
    --   "floor_current": 3,
    --   "floor_total": 5,
    --   "year_built": 2010,
    --   "district": "Žirmūnai",
    --   "dist_to_center_km": 4.2,
    --   "has_lift": 1,
    --   "has_balcony": 1,
    --   ...
    -- }

    -- Lifecycle info
    days_on_market INTEGER,
    removal_speed TEXT,
    outcome TEXT,

    -- Eligibility
    eligible_for_training BOOLEAN DEFAULT TRUE,
    exclusion_reason TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(listing_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_verified_tier ON verified_prices(confidence_tier);
CREATE INDEX IF NOT EXISTS idx_verified_eligible ON verified_prices(eligible_for_training);
CREATE INDEX IF NOT EXISTS idx_verified_score ON verified_prices(confidence_score DESC);

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View: Today's scraping stats
CREATE OR REPLACE VIEW scraping_stats AS
SELECT
    snapshot_date,
    COUNT(*) as total_listings,
    COUNT(DISTINCT listing_id) as unique_listings,
    AVG(price) as avg_price,
    COUNT(CASE WHEN is_broker_listing THEN 1 END) as broker_listings,
    COUNT(CASE WHEN NOT is_broker_listing THEN 1 END) as owner_listings
FROM listing_snapshots
GROUP BY snapshot_date
ORDER BY snapshot_date DESC;

-- View: Lifecycle summary
CREATE OR REPLACE VIEW lifecycle_summary AS
SELECT
    status,
    outcome,
    COUNT(*) as count,
    AVG(days_on_market) as avg_days_on_market,
    AVG(initial_price) as avg_initial_price,
    AVG(last_price) as avg_final_price
FROM listing_lifecycle
GROUP BY status, outcome;

-- View: Verified prices by tier
CREATE OR REPLACE VIEW verified_summary AS
SELECT
    confidence_tier,
    COUNT(*) as count,
    AVG(verified_price) as avg_price,
    AVG(confidence_score) as avg_confidence,
    AVG(days_on_market) as avg_days_on_market
FROM verified_prices
WHERE eligible_for_training = TRUE
GROUP BY confidence_tier;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for listing_lifecycle
DROP TRIGGER IF EXISTS update_lifecycle_updated_at ON listing_lifecycle;
CREATE TRIGGER update_lifecycle_updated_at
    BEFORE UPDATE ON listing_lifecycle
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (optional, for production)
-- ============================================================================

-- Enable RLS
ALTER TABLE listing_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_lifecycle ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_prices ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access snapshots" ON listing_snapshots
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access lifecycle" ON listing_lifecycle
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access verified" ON verified_prices
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- DONE! Run this SQL in Supabase Dashboard → SQL Editor
-- ============================================================================
