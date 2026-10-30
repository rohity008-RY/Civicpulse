ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON password_reset_tokens FROM anon, authenticated;
GRANT ALL ON password_reset_tokens TO service_role;

CREATE OR REPLACE FUNCTION complete_password_reset(p_token_hash TEXT, p_password_hash TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reset_row password_reset_tokens%ROWTYPE;
  account users%ROWTYPE;
BEGIN
  SELECT * INTO account FROM users WHERE id = (
    SELECT user_id FROM password_reset_tokens WHERE token_hash = p_token_hash
  ) FOR UPDATE;
  IF NOT FOUND OR NOT account.is_active THEN
    RAISE EXCEPTION 'Reset link is invalid or expired';
  END IF;
  SELECT * INTO reset_row FROM password_reset_tokens
    WHERE token_hash = p_token_hash FOR UPDATE;
  IF NOT FOUND OR reset_row.used_at IS NOT NULL OR reset_row.expires_at <= NOW() THEN
    RAISE EXCEPTION 'Reset link is invalid or expired';
  END IF;
  IF p_password_hash IS NULL OR p_password_hash NOT LIKE '$2%' THEN
    RAISE EXCEPTION 'Invalid password hash';
  END IF;
  UPDATE users SET password_hash = p_password_hash,
    session_version = session_version + 1, last_active_at = NOW()
    WHERE id = account.id;
  UPDATE password_reset_tokens SET used_at = NOW()
    WHERE user_id = account.id AND used_at IS NULL;
  RETURN account.id;
END;
$$;
REVOKE ALL ON FUNCTION complete_password_reset(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION complete_password_reset(TEXT, TEXT) TO service_role;
