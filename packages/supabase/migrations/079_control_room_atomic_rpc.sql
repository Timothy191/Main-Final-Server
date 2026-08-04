-- ============================================
-- Migration 079: Control Room Atomic RPCs
-- Ensures atomicity for complex hauling session management
-- and machine reassignments.
-- ============================================

-- 1. Support multiple sessions per shift via session_index
ALTER TABLE hourly_loads ADD COLUMN IF NOT EXISTS session_index INTEGER NOT NULL DEFAULT 0;
ALTER TABLE excavator_dumper_assignments ADD COLUMN IF NOT EXISTS session_index INTEGER NOT NULL DEFAULT 0;

-- Update unique constraints to include session_index
-- Note: In Supabase/Postgres, partitioned table constraints must include the partition key (load_date)
ALTER TABLE hourly_loads DROP CONSTRAINT IF EXISTS hourly_loads_machine_id_load_date_shift_type_key;
ALTER TABLE hourly_loads ADD CONSTRAINT uq_hourly_loads_session UNIQUE (machine_id, load_date, shift_type, session_index);

-- excavator_dumper_assignments is not partitioned (yet)
ALTER TABLE excavator_dumper_assignments DROP CONSTRAINT IF EXISTS excavator_dumper_assignments_excavator_activity_id_dumper_ma_key;
ALTER TABLE excavator_dumper_assignments ADD CONSTRAINT uq_excavator_dumper_assignments_session 
  UNIQUE (excavator_activity_id, dumper_machine_id, material_type, session_index);

-- ============================================
-- 2. RPC: end_hauling_session
-- ============================================
CREATE OR REPLACE FUNCTION control_room_end_hauling_session(
  p_load_row_id UUID,
  p_stop_hour INTEGER,
  p_new_material TEXT,
  p_new_excavator_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_load RECORD;
  v_new_load_id UUID;
  v_activity_id UUID;
  v_session_index INTEGER;
BEGIN
  -- 1. Fetch current hourly load row
  SELECT * INTO v_current_load FROM hourly_loads WHERE id = p_load_row_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Hourly load record not found');
  END IF;

  -- 2. Lock remaining hours on current row (set to -1)
  UPDATE hourly_loads
  SET 
    hour_01 = CASE WHEN p_stop_hour < 1 THEN -1 ELSE hour_01 END,
    hour_02 = CASE WHEN p_stop_hour < 2 THEN -1 ELSE hour_02 END,
    hour_03 = CASE WHEN p_stop_hour < 3 THEN -1 ELSE hour_03 END,
    hour_04 = CASE WHEN p_stop_hour < 4 THEN -1 ELSE hour_04 END,
    hour_05 = CASE WHEN p_stop_hour < 5 THEN -1 ELSE hour_05 END,
    hour_06 = CASE WHEN p_stop_hour < 6 THEN -1 ELSE hour_06 END,
    hour_07 = CASE WHEN p_stop_hour < 7 THEN -1 ELSE hour_07 END,
    hour_08 = CASE WHEN p_stop_hour < 8 THEN -1 ELSE hour_08 END,
    hour_09 = CASE WHEN p_stop_hour < 9 THEN -1 ELSE hour_09 END,
    hour_10 = CASE WHEN p_stop_hour < 10 THEN -1 ELSE hour_10 END,
    hour_11 = CASE WHEN p_stop_hour < 11 THEN -1 ELSE hour_11 END,
    hour_12 = CASE WHEN p_stop_hour < 12 THEN -1 ELSE hour_12 END,
    updated_at = NOW(),
    updated_by = p_user_id
  WHERE id = p_load_row_id;

  -- 3. Create a new load row for the NEW assignment
  v_session_index := v_current_load.session_index + 1;
  
  INSERT INTO hourly_loads (
    department_id, machine_id, load_date, shift_type, material_type,
    session_index, created_by,
    hour_01, hour_02, hour_03, hour_04, hour_05, hour_06,
    hour_07, hour_08, hour_09, hour_10, hour_11, hour_12
  )
  VALUES (
    v_current_load.department_id, v_current_load.machine_id, v_current_load.load_date, v_current_load.shift_type, p_new_material,
    v_session_index, p_user_id,
    CASE WHEN p_stop_hour >= 1 THEN -1 ELSE 0 END,
    CASE WHEN p_stop_hour >= 2 THEN -1 ELSE 0 END,
    CASE WHEN p_stop_hour >= 3 THEN -1 ELSE 0 END,
    CASE WHEN p_stop_hour >= 4 THEN -1 ELSE 0 END,
    CASE WHEN p_stop_hour >= 5 THEN -1 ELSE 0 END,
    CASE WHEN p_stop_hour >= 6 THEN -1 ELSE 0 END,
    CASE WHEN p_stop_hour >= 7 THEN -1 ELSE 0 END,
    CASE WHEN p_stop_hour >= 8 THEN -1 ELSE 0 END,
    CASE WHEN p_stop_hour >= 9 THEN -1 ELSE 0 END,
    CASE WHEN p_stop_hour >= 10 THEN -1 ELSE 0 END,
    CASE WHEN p_stop_hour >= 11 THEN -1 ELSE 0 END,
    CASE WHEN p_stop_hour >= 12 THEN -1 ELSE 0 END
  )
  RETURNING id INTO v_new_load_id;

  -- 4. Handle excavator assignment for the new session
  IF p_new_excavator_id IS NOT NULL THEN
    -- Find or create activity
    SELECT id INTO v_activity_id 
    FROM excavator_activity 
    WHERE machine_id = p_new_excavator_id 
      AND activity_date = v_current_load.load_date 
      AND shift_type = v_current_load.shift_type
    LIMIT 1;

    IF v_activity_id IS NULL THEN
      INSERT INTO excavator_activity (department_id, activity_date, shift_type, machine_id)
      VALUES (v_current_load.department_id, v_current_load.load_date, v_current_load.shift_type, p_new_excavator_id)
      RETURNING id INTO v_activity_id;
    END IF;

    -- Create assignment for new session
    INSERT INTO excavator_dumper_assignments (
      excavator_activity_id, dumper_machine_id, material_type, session_index, total_loads
    )
    VALUES (
      v_activity_id, v_current_load.machine_id, p_new_material, v_session_index, 0
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'new_load_id', v_new_load_id);
END;
$$;

-- ============================================
-- 3. RPC: update_hourly_load_material
-- ============================================
CREATE OR REPLACE FUNCTION control_room_update_material(
  p_load_row_id UUID,
  p_primary_material TEXT,
  p_sub_material TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_load RECORD;
BEGIN
  -- 1. Update hourly_loads
  UPDATE hourly_loads
  SET material_type = p_primary_material, updated_at = NOW(), updated_by = p_user_id
  WHERE id = p_load_row_id
  RETURNING * INTO v_load;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Hourly load record not found');
  END IF;

  -- 2. Update matching assignment
  UPDATE excavator_dumper_assignments
  SET material_type = p_sub_material, updated_at = NOW()
  WHERE dumper_machine_id = v_load.machine_id
    AND session_index = v_load.session_index
    AND excavator_activity_id IN (
      SELECT id FROM excavator_activity 
      WHERE activity_date = v_load.load_date AND shift_type = v_load.shift_type
    );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================
-- 4. RPC: reassign_dumper_excavator
-- ============================================
CREATE OR REPLACE FUNCTION control_room_reassign_excavator(
  p_load_row_id UUID,
  p_new_excavator_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_load RECORD;
  v_activity_id UUID;
  v_assignment_id UUID;
BEGIN
  -- 1. Get load info
  SELECT * INTO v_load FROM hourly_loads WHERE id = p_load_row_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Hourly load record not found');
  END IF;

  -- 2. Handle new excavator activity
  IF p_new_excavator_id IS NOT NULL THEN
    SELECT id INTO v_activity_id 
    FROM excavator_activity 
    WHERE machine_id = p_new_excavator_id 
      AND activity_date = v_load.load_date 
      AND shift_type = v_load.shift_type
    LIMIT 1;

    IF v_activity_id IS NULL THEN
      INSERT INTO excavator_activity (department_id, activity_date, shift_type, machine_id)
      VALUES (v_load.department_id, v_load.load_date, v_load.shift_type, p_new_excavator_id)
      RETURNING id INTO v_activity_id;
    END IF;
  END IF;

  -- 3. Find existing assignment for this session
  SELECT id INTO v_assignment_id 
  FROM excavator_dumper_assignments
  WHERE dumper_machine_id = v_load.machine_id
    AND session_index = v_load.session_index
    AND excavator_activity_id IN (
      SELECT id FROM excavator_activity 
      WHERE activity_date = v_load.load_date AND shift_type = v_load.shift_type
    );

  -- 4. Upsert/Delete assignment
  IF v_assignment_id IS NOT NULL THEN
    IF v_activity_id IS NOT NULL THEN
      UPDATE excavator_dumper_assignments 
      SET excavator_activity_id = v_activity_id, updated_at = NOW()
      WHERE id = v_assignment_id;
    ELSE
      DELETE FROM excavator_dumper_assignments WHERE id = v_assignment_id;
    END IF;
  ELSEIF v_activity_id IS NOT NULL THEN
    INSERT INTO excavator_dumper_assignments (
      excavator_activity_id, dumper_machine_id, material_type, session_index, total_loads
    )
    VALUES (
      v_activity_id, v_load.machine_id, v_load.material_type, v_load.session_index, 0
    );
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
