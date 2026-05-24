-- ═══════════════════════════════════════════════════════════════
-- CivicPulse — Complete Database Schema
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Enable PostGIS for geographic queries
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUMS ────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('CITIZEN','CORPORATOR','MLA','MP','MODERATOR','ADMIN');
CREATE TYPE issue_status AS ENUM ('OPEN','ASSIGNED','IN_PROGRESS','ESCALATED_TO_MLA','ESCALATED_TO_MP','RESOLVED','CLOSED');
CREATE TYPE issue_category AS ENUM ('POTHOLE','GARBAGE','WATER','STREETLIGHT','SAFETY','TREE','OTHER');
CREATE TYPE sla_unit AS ENUM ('HOURS','DAYS','MONTHS');
CREATE TYPE media_type AS ENUM ('IMAGE','VIDEO','AUDIO');
CREATE TYPE comment_type AS ENUM ('CITIZEN','REP_OFFICIAL','ADMIN_NOTE');
CREATE TYPE notification_type AS ENUM (
  'ISSUE_SUBMITTED','ISSUE_ESCALATED_MLA','ISSUE_ESCALATED_MP',
  'ISSUE_RESOLVED','COMMENT_ADDED','UPVOTE_MILESTONE',
  'SLA_WARNING','TRENDING_ZONE','TRENDING_CITY','OFFICIAL_RESPONSE'
);

-- ─── ZONES ────────────────────────────────────────────────────
CREATE TABLE zones (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city         TEXT NOT NULL DEFAULT 'Mumbai',
  name         TEXT NOT NULL,
  geo_boundary GEOMETRY(POLYGON, 4326),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── WARDS ────────────────────────────────────────────────────
CREATE TABLE wards (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id      UUID NOT NULL REFERENCES zones(id),
  name         TEXT NOT NULL,
  ward_number  TEXT,
  geo_boundary GEOMETRY(POLYGON, 4326),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── USERS ────────────────────────────────────────────────────
CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email            TEXT UNIQUE,
  phone            TEXT UNIQUE,
  name             TEXT NOT NULL,
  password_hash    TEXT,
  social_provider  TEXT,
  social_uid       TEXT UNIQUE,
  avatar_url       TEXT,
  role             user_role NOT NULL DEFAULT 'CITIZEN',
  home_ward_id     UUID REFERENCES wards(id),
  is_active        BOOLEAN DEFAULT TRUE,
  is_phone_verified BOOLEAN DEFAULT FALSE,
  fcm_token        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  last_active_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── REPRESENTATIVES ─────────────────────────────────────────
CREATE TABLE corporators (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id),
  ward_id       UUID NOT NULL REFERENCES wards(id),
  name          TEXT NOT NULL,
  party         TEXT,
  phone         TEXT,
  email         TEXT,
  photo_url     TEXT,
  term_start    DATE NOT NULL,
  term_end      DATE,
  is_active     BOOLEAN DEFAULT TRUE,
  injected_by   UUID REFERENCES users(id),
  injected_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mlas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id),
  zone_id       UUID NOT NULL REFERENCES zones(id),
  name          TEXT NOT NULL,
  party         TEXT,
  constituency  TEXT NOT NULL,
  phone         TEXT,
  email         TEXT,
  photo_url     TEXT,
  term_start    DATE NOT NULL,
  term_end      DATE,
  is_active     BOOLEAN DEFAULT TRUE,
  injected_by   UUID REFERENCES users(id),
  injected_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mps (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id),
  name          TEXT NOT NULL,
  party         TEXT,
  constituency  TEXT NOT NULL,
  phone         TEXT,
  email         TEXT,
  photo_url     TEXT,
  term_start    DATE NOT NULL,
  term_end      DATE,
  is_active     BOOLEAN DEFAULT TRUE,
  injected_by   UUID REFERENCES users(id),
  injected_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Zone→MLA and Zone→MP mappings
ALTER TABLE zones ADD COLUMN mla_id UUID REFERENCES mlas(id);
ALTER TABLE zones ADD COLUMN mp_id  UUID REFERENCES mps(id);

-- ─── SLA CONFIG ───────────────────────────────────────────────
CREATE TABLE sla_config (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ward_id         UUID REFERENCES wards(id),
  category        issue_category NOT NULL,
  sla_value       INTEGER NOT NULL,
  sla_unit        sla_unit NOT NULL,
  sla_minutes     INTEGER GENERATED ALWAYS AS (
    CASE sla_unit
      WHEN 'HOURS'  THEN sla_value * 60
      WHEN 'DAYS'   THEN sla_value * 60 * 24
      WHEN 'MONTHS' THEN sla_value * 60 * 24 * 30
    END
  ) STORED,
  escalation_rep  TEXT NOT NULL DEFAULT 'MLA',
  is_active       BOOLEAN DEFAULT TRUE,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default SLA rules
INSERT INTO sla_config (category, sla_value, sla_unit, escalation_rep) VALUES
  ('SAFETY',      24, 'HOURS', 'MLA'),
  ('WATER',       48, 'HOURS', 'MLA'),
  ('GARBAGE',      3, 'DAYS',  'MLA'),
  ('STREETLIGHT',  3, 'DAYS',  'MLA'),
  ('POTHOLE',      7, 'DAYS',  'MLA'),
  ('TREE',         7, 'DAYS',  'MLA'),
  ('OTHER',        7, 'DAYS',  'MLA');

-- ─── ISSUES ───────────────────────────────────────────────────
CREATE TABLE issues (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES users(id),
  title                 TEXT NOT NULL,
  description           TEXT,
  category              issue_category NOT NULL,
  status                issue_status NOT NULL DEFAULT 'OPEN',
  location              GEOMETRY(POINT, 4326),
  location_label        TEXT,
  ward_id               UUID REFERENCES wards(id),
  zone_id               UUID REFERENCES zones(id),
  corporator_id         UUID REFERENCES corporators(id),
  mla_id                UUID REFERENCES mlas(id),
  mp_id                 UUID REFERENCES mps(id),
  sla_deadline          TIMESTAMPTZ,
  escalated_at          TIMESTAMPTZ,
  escalated_to_role     TEXT,
  escalated_to_id       UUID,
  escalated_to_mp_at    TIMESTAMPTZ,
  resolved_at           TIMESTAMPTZ,
  resolved_by_role      TEXT,
  is_anonymous          BOOLEAN DEFAULT FALSE,
  source                TEXT DEFAULT 'TYPED',
  upvote_count          INTEGER DEFAULT 0,
  comment_count         INTEGER DEFAULT 0,
  share_count           INTEGER DEFAULT 0,
  trending_score        FLOAT DEFAULT 0,
  trending_rank         INTEGER,
  is_community_spotlight BOOLEAN DEFAULT FALSE,
  went_viral_at         TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_issues_ward     ON issues(ward_id);
CREATE INDEX idx_issues_status   ON issues(status);
CREATE INDEX idx_issues_trending ON issues(trending_score DESC) WHERE status != 'CLOSED';
CREATE INDEX idx_issues_location ON issues USING GIST(location);
CREATE INDEX idx_issues_created  ON issues(created_at DESC);

-- ─── ISSUE MEDIA ──────────────────────────────────────────────
CREATE TABLE issue_media (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id    UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  media_type  media_type NOT NULL,
  s3_url      TEXT NOT NULL,
  cdn_url     TEXT,
  file_size   INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ISSUE HISTORY (audit log) ───────────────────────────────
CREATE TABLE issue_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id    UUID NOT NULL REFERENCES issues(id),
  action      TEXT NOT NULL,
  actor_id    UUID REFERENCES users(id),
  actor_role  TEXT,
  note        TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── UPVOTES ──────────────────────────────────────────────────
CREATE TABLE upvotes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id    UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(issue_id, user_id)
);

-- ─── COMMENTS ─────────────────────────────────────────────────
CREATE TABLE comments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id      UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id),
  parent_id     UUID REFERENCES comments(id),
  body          TEXT NOT NULL CHECK (char_length(body) <= 500),
  comment_type  comment_type DEFAULT 'CITIZEN',
  is_hidden     BOOLEAN DEFAULT FALSE,
  is_deleted    BOOLEAN DEFAULT FALSE,
  flag_count    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  edited_at     TIMESTAMPTZ
);

-- ─── SHARES ───────────────────────────────────────────────────
CREATE TABLE shares (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id    UUID NOT NULL REFERENCES issues(id),
  user_id     UUID REFERENCES users(id),
  platform    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id),
  type        notification_type NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  data        JSONB,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AUDIT LOG ────────────────────────────────────────────────
CREATE TABLE audit_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id     UUID NOT NULL REFERENCES users(id),
  actor_role   TEXT NOT NULL,
  action       TEXT NOT NULL,
  target_type  TEXT,
  target_id    TEXT,
  metadata     JSONB,
  ip_address   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MONTHLY REPORTS (materialised) ─────────────────────────
CREATE TABLE monthly_reports (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rep_id            UUID NOT NULL,
  rep_type          TEXT NOT NULL,
  month             INTEGER NOT NULL,
  year              INTEGER NOT NULL,
  total_issues      INTEGER DEFAULT 0,
  resolved_issues   INTEGER DEFAULT 0,
  avg_resolution_days FLOAT DEFAULT 0,
  sla_breaches      INTEGER DEFAULT 0,
  escalated_to_mla  INTEGER DEFAULT 0,
  escalated_to_mp   INTEGER DEFAULT 0,
  trending_issues   INTEGER DEFAULT 0,
  pressure_index    FLOAT DEFAULT 0,
  total_upvotes     INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rep_id, rep_type, month, year)
);

-- ─── TRIGGERS: auto-update issue counts ──────────────────────
CREATE OR REPLACE FUNCTION update_issue_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE issues SET upvote_count = upvote_count + 1, updated_at = NOW() WHERE id = NEW.issue_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE issues SET upvote_count = GREATEST(upvote_count - 1, 0), updated_at = NOW() WHERE id = OLD.issue_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_upvote_count
AFTER INSERT OR DELETE ON upvotes
FOR EACH ROW EXECUTE FUNCTION update_issue_upvote_count();

CREATE OR REPLACE FUNCTION update_issue_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE issues SET comment_count = comment_count + 1, updated_at = NOW() WHERE id = NEW.issue_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
    UPDATE issues SET comment_count = GREATEST(comment_count - 1, 0), updated_at = NOW() WHERE id = NEW.issue_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_comment_count
AFTER INSERT OR UPDATE ON comments
FOR EACH ROW EXECUTE FUNCTION update_issue_comment_count();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues         ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE upvotes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;

-- Public read for issues
CREATE POLICY "Issues are publicly readable" ON issues FOR SELECT USING (TRUE);
CREATE POLICY "Comments are publicly readable" ON comments FOR SELECT USING (is_hidden = FALSE AND is_deleted = FALSE);
CREATE POLICY "Upvotes are publicly readable" ON upvotes FOR SELECT USING (TRUE);

-- Users can manage their own data
CREATE POLICY "Users read own profile" ON users FOR SELECT USING (TRUE);
CREATE POLICY "Users update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);
