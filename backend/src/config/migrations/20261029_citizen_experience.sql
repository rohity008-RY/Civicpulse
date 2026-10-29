CREATE TABLE IF NOT EXISTS issue_followers (
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (issue_id, user_id)
);
CREATE INDEX IF NOT EXISTS issue_followers_user_idx ON issue_followers(user_id, created_at DESC);
ALTER TABLE issue_followers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON issue_followers FROM anon, authenticated;
GRANT ALL ON issue_followers TO service_role;

CREATE TABLE IF NOT EXISTS citizen_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_digest BOOLEAN NOT NULL DEFAULT FALSE,
  last_digest_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE citizen_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON citizen_preferences FROM anon, authenticated;
GRANT ALL ON citizen_preferences TO service_role;

ALTER TABLE issues ADD COLUMN IF NOT EXISTS resolution_confirmed_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION confirm_citizen_resolution(p_issue_id UUID, p_user_id UUID)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE confirmed TIMESTAMPTZ;
BEGIN
  UPDATE issues SET resolution_confirmed_at = NOW(), updated_at = NOW()
    WHERE id = p_issue_id AND user_id = p_user_id AND status = 'RESOLVED'
      AND resolution_confirmed_at IS NULL
    RETURNING resolution_confirmed_at INTO confirmed;
  IF confirmed IS NULL THEN
    RAISE EXCEPTION 'Only the report owner can confirm an unconfirmed resolved issue';
  END IF;
  INSERT INTO issue_history(issue_id, action, actor_id, actor_role, note)
    VALUES(p_issue_id, 'CITIZEN_CONFIRMED', p_user_id, 'CITIZEN', 'Citizen confirmed the issue is fixed');
  RETURN confirmed;
END;
$$;
REVOKE ALL ON FUNCTION confirm_citizen_resolution(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION confirm_citizen_resolution(UUID, UUID) TO service_role;
