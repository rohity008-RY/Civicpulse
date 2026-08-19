-- CivicsPulse product trust and lifecycle enhancements

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ISSUE_ASSIGNED';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ISSUE_IN_PROGRESS';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ISSUE_REOPENED';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ISSUE_REPORTED';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'REPORT_CARD_APPROVED';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'REPORT_CARD_REJECTED';

ALTER TABLE issues
  ADD COLUMN IF NOT EXISTS public_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS reopened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reopened_by UUID,
  ADD COLUMN IF NOT EXISTS reopen_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'VISIBLE'
    CHECK (moderation_status IN ('VISIBLE','UNDER_REVIEW','HIDDEN','REJECTED')),
  ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
  ADD COLUMN IF NOT EXISTS moderated_by UUID,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_proof_url TEXT;

UPDATE issues
SET public_id = concat(
  'CP-',
  COALESCE(NULLIF(upper(regexp_replace(state_code, '[^A-Za-z0-9]+', '', 'g')), ''), 'IN'),
  '-',
  COALESCE(NULLIF(upper(left(regexp_replace(city, '[^A-Za-z0-9]+', '', 'g'), 4)), ''), 'CITY'),
  '-',
  upper(left(replace(id::text, '-', ''), 8))
)
WHERE public_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_issues_public_id ON issues(public_id);
CREATE INDEX IF NOT EXISTS idx_issues_moderation_status ON issues(moderation_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_reopened_at ON issues(reopened_at DESC) WHERE reopened_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS issue_reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id    UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason      TEXT NOT NULL DEFAULT 'OTHER',
  details     TEXT,
  status      TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','REVIEWED','DISMISSED')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  UNIQUE(issue_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_issue_reports_issue ON issue_reports(issue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_reports_status ON issue_reports(status, created_at DESC);
