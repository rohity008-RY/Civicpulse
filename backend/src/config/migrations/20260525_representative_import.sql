-- CivicPulse representative import + state/city/ward hierarchy
-- Safe to run multiple times in Supabase SQL editor or psql.

ALTER TABLE zones ADD COLUMN IF NOT EXISTS state_code TEXT DEFAULT 'MH';
ALTER TABLE zones ADD COLUMN IF NOT EXISTS state_name TEXT DEFAULT 'Maharashtra';
ALTER TABLE zones ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE zones
SET state_code = COALESCE(state_code, 'MH'),
    state_name = COALESCE(state_name, 'Maharashtra'),
    city = COALESCE(city, 'Mumbai')
WHERE state_code IS NULL OR state_name IS NULL OR city IS NULL;

ALTER TABLE wards ADD COLUMN IF NOT EXISTS state_code TEXT;
ALTER TABLE wards ADD COLUMN IF NOT EXISTS state_name TEXT;
ALTER TABLE wards ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE wards ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE wards ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE wards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE wards w
SET state_code = COALESCE(w.state_code, z.state_code, 'MH'),
    state_name = COALESCE(w.state_name, z.state_name, 'Maharashtra'),
    city = COALESCE(w.city, z.city, 'Mumbai')
FROM zones z
WHERE w.zone_id = z.id
  AND (w.state_code IS NULL OR w.state_name IS NULL OR w.city IS NULL);

ALTER TABLE corporators ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE corporators ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE corporators ADD COLUMN IF NOT EXISTS data_source TEXT;
ALTER TABLE corporators ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE mlas ADD COLUMN IF NOT EXISTS state_code TEXT;
ALTER TABLE mlas ADD COLUMN IF NOT EXISTS state_name TEXT;
ALTER TABLE mlas ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE mlas ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE mlas ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE mlas ADD COLUMN IF NOT EXISTS data_source TEXT;
ALTER TABLE mlas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE mlas m
SET state_code = COALESCE(m.state_code, z.state_code, 'MH'),
    state_name = COALESCE(m.state_name, z.state_name, 'Maharashtra'),
    city = COALESCE(m.city, z.city, 'Mumbai')
FROM zones z
WHERE m.zone_id = z.id
  AND (m.state_code IS NULL OR m.state_name IS NULL OR m.city IS NULL);

ALTER TABLE issues ADD COLUMN IF NOT EXISTS state_code TEXT;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS state_name TEXT;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS ward_number TEXT;

UPDATE issues i
SET state_code = COALESCE(i.state_code, w.state_code),
    state_name = COALESCE(i.state_name, w.state_name),
    city = COALESCE(i.city, w.city),
    ward_number = COALESCE(i.ward_number, w.ward_number)
FROM wards w
WHERE i.ward_id = w.id
  AND (i.state_code IS NULL OR i.state_name IS NULL OR i.city IS NULL OR i.ward_number IS NULL);

CREATE TABLE IF NOT EXISTS rep_import_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES users(id),
  actor_role TEXT,
  source_url TEXT,
  format TEXT NOT NULL,
  rows_received INTEGER DEFAULT 0,
  rows_imported INTEGER DEFAULT 0,
  rows_failed INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zones_hierarchy ON zones(state_code, city, name);
CREATE INDEX IF NOT EXISTS idx_wards_hierarchy ON wards(state_code, city, ward_number, name);
CREATE INDEX IF NOT EXISTS idx_corporators_active_ward ON corporators(ward_id, is_active);
CREATE INDEX IF NOT EXISTS idx_mlas_active_zone ON mlas(zone_id, is_active);
CREATE INDEX IF NOT EXISTS idx_issues_hierarchy ON issues(state_code, city, ward_number);
