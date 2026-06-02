-- CivicsPulse multi-language preference + issue translation cache
-- Safe to run multiple times in Supabase SQL editor or psql.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en';

ALTER TABLE issues
  ADD COLUMN IF NOT EXISTS original_language TEXT NOT NULL DEFAULT 'en';

UPDATE users
SET preferred_language = 'en'
WHERE preferred_language IS NULL OR preferred_language = '';

UPDATE issues
SET original_language = 'en'
WHERE original_language IS NULL OR original_language = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'users_preferred_language_check'
      AND table_name = 'users'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_preferred_language_check
      CHECK (preferred_language IN ('en','hi','mr','gu','bn','ta','te','kn','ml','pa'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'issues_original_language_check'
      AND table_name = 'issues'
  ) THEN
    ALTER TABLE issues
      ADD CONSTRAINT issues_original_language_check
      CHECK (original_language IN ('en','hi','mr','gu','bn','ta','te','kn','ml','pa'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS issue_translations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id        UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  language_code   TEXT NOT NULL CHECK (language_code IN ('en','hi','mr','gu','bn','ta','te','kn','ml','pa')),
  source_language TEXT NOT NULL DEFAULT 'en' CHECK (source_language IN ('en','hi','mr','gu','bn','ta','te','kn','ml','pa')),
  title           TEXT NOT NULL,
  description     TEXT,
  location_label  TEXT,
  provider        TEXT DEFAULT 'openai',
  translated_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(issue_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_issue_translations_issue_language
  ON issue_translations(issue_id, language_code);

INSERT INTO issue_translations (
  issue_id,
  language_code,
  source_language,
  title,
  description,
  location_label,
  provider
)
SELECT
  id,
  original_language,
  original_language,
  title,
  description,
  location_label,
  'original'
FROM issues
ON CONFLICT (issue_id, language_code) DO NOTHING;
