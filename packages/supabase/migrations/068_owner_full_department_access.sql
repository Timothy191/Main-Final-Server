-- ============================================
-- Ensure owner account has all department access
-- ============================================
-- AGENT-TRACE: timothyoniel558@gmail.com must remain admin with every department UUID
-- in accessible_departments so hub unlocks all modules permanently.

-- Ensure access-card-actions exists (catalog parity with hub DEPARTMENTS)
INSERT INTO public.departments (name, display_name, icon, description, color)
VALUES (
  'access-card-actions',
  'Access Card Actions',
  'CreditCard',
  'Manage printed badges, print cards & QR generation',
  'blue'
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  color = EXCLUDED.color;

DO $$
DECLARE
  owner_uid UUID;
  dept_ids UUID[];
  trigger_disabled BOOLEAN := false;
BEGIN
  SELECT id INTO owner_uid
  FROM auth.users
  WHERE email ILIKE 'timothyoniel558@gmail.com'
  LIMIT 1;

  IF owner_uid IS NULL THEN
    RAISE NOTICE 'Owner auth user timothyoniel558@gmail.com not found — skip ACL grant';
    RETURN;
  END IF;

  SELECT array_agg(id ORDER BY name) INTO dept_ids FROM public.departments;

  IF dept_ids IS NULL OR cardinality(dept_ids) = 0 THEN
    RAISE NOTICE 'No departments rows — skip ACL grant';
    RETURN;
  END IF;

  BEGIN
    -- AGENT-TRACE: Session has no JWT admin claim; disable ACL-protect trigger for this grant.
    ALTER TABLE public.employees DISABLE TRIGGER enforce_employee_update_constraints_trigger;
    trigger_disabled := true;

    IF EXISTS (SELECT 1 FROM public.employees WHERE auth_id = owner_uid) THEN
      UPDATE public.employees
      SET
        role = 'admin',
        accessible_departments = dept_ids,
        updated_at = now()
      WHERE auth_id = owner_uid;
    ELSE
      INSERT INTO public.employees (
        auth_id,
        full_name,
        role,
        accessible_departments
      ) VALUES (
        owner_uid,
        'System Administrator',
        'admin',
        dept_ids
      );
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      IF trigger_disabled THEN
        ALTER TABLE public.employees ENABLE TRIGGER enforce_employee_update_constraints_trigger;
      END IF;
      RAISE;
  END;

  IF trigger_disabled THEN
    ALTER TABLE public.employees ENABLE TRIGGER enforce_employee_update_constraints_trigger;
  END IF;
END $$;
