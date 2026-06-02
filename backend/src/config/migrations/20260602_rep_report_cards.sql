-- CivicsPulse representative report-card request workflow

CREATE TABLE IF NOT EXISTS report_card_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requester_role  TEXT NOT NULL,
  rep_type        TEXT NOT NULL CHECK (rep_type IN ('CORPORATOR','MLA','MP','ADMIN')),
  rep_id          UUID,
  scope           JSONB DEFAULT '{}'::jsonb,
  month           INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year            INTEGER NOT NULL CHECK (year BETWEEN 2020 AND 2100),
  format          TEXT NOT NULL DEFAULT 'PDF_CSV',
  status          TEXT NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED','APPROVED','REJECTED')),
  reviewed_by     UUID REFERENCES users(id),
  reviewed_at     TIMESTAMPTZ,
  review_note     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_card_requests_requester
  ON report_card_requests(requester_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_report_card_requests_status
  ON report_card_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_report_card_requests_rep
  ON report_card_requests(rep_type, rep_id, month, year);
