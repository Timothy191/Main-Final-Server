-- Migration 036: Documents — word-processing storage, storage bucket, and version history

-- ============================================
-- 1. documents table
-- ============================================
CREATE TABLE documents (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid        NOT NULL REFERENCES departments(id),
  title         text        NOT NULL DEFAULT 'Untitled Document',
  content       jsonb       NOT NULL DEFAULT '{}',
  file_path     text,
  file_name     text,
  file_size     bigint,
  mime_type     text,
  created_by    uuid        REFERENCES employees(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

-- ============================================
-- 2. document_versions table
-- ============================================
CREATE TABLE document_versions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     uuid        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content         jsonb       NOT NULL DEFAULT '{}',
  title           text        NOT NULL,
  version_number  integer     NOT NULL,
  created_by      uuid        REFERENCES employees(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  summary         text,
  UNIQUE (document_id, version_number)
);

-- ============================================
-- 3. updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- 4. Indexes
-- ============================================
CREATE INDEX idx_documents_department_id   ON documents(department_id);
CREATE INDEX idx_documents_created_by      ON documents(created_by);
CREATE INDEX idx_documents_created_at      ON documents(created_at DESC);
CREATE INDEX idx_documents_deleted_at      ON documents(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_document_versions_doc_id  ON document_versions(document_id);

-- ============================================
-- 5. Row Level Security
-- ============================================
ALTER TABLE documents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- documents: select — department access + soft-delete filter
CREATE POLICY "documents_select_department"
  ON documents FOR SELECT
  TO authenticated
  USING (public.has_department_access(department_id) AND deleted_at IS NULL);

-- documents: insert — must belong to an accessible department
CREATE POLICY "documents_insert_department"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (public.has_department_access(department_id));

-- documents: update — own documents or admin
CREATE POLICY "documents_update_own"
  ON documents FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      created_by = (SELECT id FROM employees WHERE auth_id = auth.uid() LIMIT 1)
      OR public.is_admin()
    )
  )
  WITH CHECK (public.has_department_access(department_id));

-- documents: soft-delete via UPDATE — admin-only override policy (OR'd with update_own)
CREATE POLICY "documents_delete_admin"
  ON documents FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (true);

-- document_versions: inherit access through parent document
CREATE POLICY "document_versions_select"
  ON document_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_versions.document_id
        AND public.has_department_access(d.department_id)
        AND d.deleted_at IS NULL
    )
  );

CREATE POLICY "document_versions_insert"
  ON document_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_versions.document_id
        AND public.has_department_access(d.department_id)
    )
  );

-- ============================================
-- 6. Storage bucket
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  20971520,  -- 20 MB
  ARRAY[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 7. Storage RLS policies
-- Path convention: {department_uuid}/{employee_id}/{filename}
-- ============================================

-- Select: authenticated users with department access
CREATE POLICY "documents_storage_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.has_department_access((storage.foldername(name))[1]::uuid)
  );

-- Insert: authenticated users with department access
CREATE POLICY "documents_storage_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND public.has_department_access((storage.foldername(name))[1]::uuid)
  );

-- Update: own files or admin
CREATE POLICY "documents_storage_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND (
      public.is_admin()
      OR (
        public.has_department_access((storage.foldername(name))[1]::uuid)
        AND (storage.foldername(name))[2] = (SELECT id::text FROM employees WHERE auth_id = auth.uid() LIMIT 1)
      )
    )
  );

-- Delete: admin only
CREATE POLICY "documents_storage_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents'
    AND public.is_admin()
  );
