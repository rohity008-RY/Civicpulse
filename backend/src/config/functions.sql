-- ═══════════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor AFTER schema.sql
-- Helper function: find ward by GPS point
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION find_ward_by_point(lat FLOAT, lng FLOAT)
RETURNS TABLE(id UUID, name TEXT, zone_id UUID, ward_number TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT w.id, w.name, w.zone_id, w.ward_number
  FROM wards w
  WHERE ST_Within(
    ST_SetSRID(ST_Point(lng, lat), 4326),
    w.geo_boundary
  )
  AND w.geo_boundary IS NOT NULL
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- Seed: Insert Mumbai zones and wards (simplified sample)
-- Replace geo_boundary with real GeoJSON from BMC shapefiles
-- ═══════════════════════════════════════════════════════════════

-- Insert sample zones
INSERT INTO zones (id, city, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Mumbai', 'Western Suburbs'),
  ('22222222-2222-2222-2222-222222222222', 'Mumbai', 'Eastern Suburbs'),
  ('33333333-3333-3333-3333-333333333333', 'Mumbai', 'South Mumbai'),
  ('44444444-4444-4444-4444-444444444444', 'Mumbai', 'Central Mumbai')
ON CONFLICT DO NOTHING;

-- Insert sample wards
INSERT INTO wards (id, zone_id, name, ward_number) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Andheri West', 'K-West'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Andheri East', 'K-East'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Borivali', 'R-North'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Ghatkopar', 'N'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', 'Colaba', 'A'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 'Bandra West', 'H-West')
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- NOTE: For production, load real Mumbai ward boundaries:
-- 1. Download shapefiles from: https://portal.mcgm.gov.in
-- 2. Convert to GeoJSON: ogr2ogr -f GeoJSON wards.geojson wards.shp
-- 3. Import with: UPDATE wards SET geo_boundary = ST_GeomFromGeoJSON('...')
-- ═══════════════════════════════════════════════════════════════

-- Create admin user (run after first registration, update UUID)
-- UPDATE users SET role = 'ADMIN' WHERE email = 'your-admin@email.com';
