-- ==========================================================
-- Validation: Dozer Roll Date Server-Authoritative Check
-- Rejects dozer_rolls inserts where the roll_date does not match
-- the server's timezone-aligned operational date.
-- ==========================================================

CREATE OR REPLACE FUNCTION validate_dozer_roll_date()
RETURNS TRIGGER AS $$
DECLARE
  v_server_date DATE;
BEGIN
  -- Resolve today's date in Africa/Johannesburg timezone
  v_server_date := (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Johannesburg')::DATE;

  IF NEW.roll_date != v_server_date THEN
    RAISE EXCEPTION 'Invalid roll date (%): does not match server operational date (%)', NEW.roll_date, v_server_date;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the validation trigger
DROP TRIGGER IF EXISTS trg_validate_dozer_roll_date ON dozer_rolls;
CREATE TRIGGER trg_validate_dozer_roll_date
  BEFORE INSERT OR UPDATE ON dozer_rolls
  FOR EACH ROW
  EXECUTE FUNCTION validate_dozer_roll_date();

COMMENT ON FUNCTION validate_dozer_roll_date() IS 'Enforces server-authoritative operational date alignment for dozer roll records';
