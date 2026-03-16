-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/xrutieeezzdpbveaqyam/sql/new

CREATE TABLE IF NOT EXISTS deals (
  id              SERIAL PRIMARY KEY,
  deal_key        TEXT UNIQUE NOT NULL,
  city_name       TEXT,
  full_address    TEXT,
  display_address TEXT,
  gush            TEXT,
  deal_date       DATE,
  deal_datetime   TIMESTAMPTZ,
  deal_nature     TEXT,
  asset_type      TEXT,
  rooms           NUMERIC(4,1),
  floor           INTEGER,
  building_floors INTEGER,
  area_sqm        NUMERIC(10,2),
  deal_amount     BIGINT,
  price_per_sqm   NUMERIC(12,2),
  building_year   INTEGER,
  year_built      INTEGER,
  is_new_project  BOOLEAN,
  project_name    TEXT,
  trend_format    TEXT,
  trend_negative  BOOLEAN,
  polygon_id      TEXT,
  raw_json        JSONB,
  scraped_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_city_name   ON deals (city_name);
CREATE INDEX IF NOT EXISTS idx_deals_deal_date   ON deals (deal_date);
CREATE INDEX IF NOT EXISTS idx_deals_rooms       ON deals (rooms);
CREATE INDEX IF NOT EXISTS idx_deals_deal_amount ON deals (deal_amount);
CREATE INDEX IF NOT EXISTS idx_deals_gush        ON deals (gush);
CREATE INDEX IF NOT EXISTS idx_deals_polygon_id  ON deals (polygon_id);
