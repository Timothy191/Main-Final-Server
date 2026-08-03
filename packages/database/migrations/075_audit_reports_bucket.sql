-- Migration 075: Create audit-reports storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audit-reports',
  'audit-reports',
  false,
  10485760, -- 10 MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage objects in 'audit-reports'
-- Allow select for authenticated users who are part of safety/admin
CREATE POLICY "Allow authenticated users to read audit reports"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'audit-reports'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM employees e
        JOIN departments d ON e.department_id = d.id
        WHERE e.auth_id = auth.uid()
          AND (d.name = 'safety' OR d.name = 'access-control')
      )
    )
  );

-- Allow service role (or authenticated inserts from system process) to upload reports
CREATE POLICY "Allow system to insert audit reports"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'audit-reports'
  );
