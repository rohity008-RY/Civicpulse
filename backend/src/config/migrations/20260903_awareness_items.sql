CREATE TABLE IF NOT EXISTS awareness_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'AWARENESS',
  city TEXT DEFAULT 'Mumbai',
  ward_label TEXT,
  action_label TEXT,
  action_url TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_awareness_items_active_priority
  ON awareness_items (is_active, priority DESC, starts_at DESC);

INSERT INTO awareness_items (slug, title, summary, category, city, ward_label, action_label, priority)
VALUES
  ('monsoon-waterlogging-readiness', 'Monsoon watch: report waterlogging early', 'Add a clear photo, road name, and nearest landmark so drainage teams can identify repeat flooding points quickly.', 'ALERT', 'Mumbai', 'All wards', 'Raise water issue', 50),
  ('pothole-photo-guide', 'Better pothole reports get faster routing', 'Stand safely, capture the road edge and landmark, and choose the pothole category so the issue reaches the right queue.', 'GUIDE', 'Mumbai', 'Roads', 'Learn report tips', 40),
  ('garbage-repeat-hotspots', 'Repeat garbage dumping needs pattern details', 'Mention timing, nearby shop/building, and whether cleanup has already happened so ward officers can spot repeat dumping.', 'AWARENESS', 'Mumbai', 'Sanitation', 'Report garbage', 35),
  ('streetlight-night-safety', 'Night safety: map dark streetlight stretches', 'If multiple lights are off, include pole numbers or both ends of the lane to help repair crews inspect in one visit.', 'SAFETY', 'Mumbai', 'Public safety', 'Report streetlight', 30)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  ward_label = EXCLUDED.ward_label,
  action_label = EXCLUDED.action_label,
  priority = EXCLUDED.priority,
  updated_at = NOW();
