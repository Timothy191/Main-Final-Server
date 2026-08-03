-- Index Coverage Test
-- Checks that every foreign key column in the public schema has a dedicated index
-- (index where the FK column is the first column).
-- Outputs any missing indexes or a success message.

DO $$
DECLARE
    rec RECORD;
    missing_count INT := 0;
BEGIN
    FOR rec IN
        SELECT
            referencing_tbl.relname AS referencing_table,
            referencing_attr.attname AS fk_column,
            referenced_tbl.relname AS referenced_table,
            c.conname AS constraint_name
        FROM pg_constraint c
        JOIN pg_class referencing_tbl ON referencing_tbl.oid = c.conrelid
        JOIN pg_class referenced_tbl ON referenced_tbl.oid = c.confrelid
        JOIN pg_namespace n ON n.oid = referencing_tbl.relnamespace
        JOIN pg_attribute referencing_attr ON referencing_attr.attrelid = c.conrelid 
             AND referencing_attr.attnum = c.conkey[1]
        WHERE c.contype = 'f'
          AND n.nspname = 'public'
        ORDER BY referencing_tbl.relname, referencing_attr.attname
    LOOP
        -- Check if an index exists with this FK column as its first column
        IF NOT EXISTS (
            SELECT 1
            FROM pg_index i
            JOIN pg_class c ON c.oid = i.indrelid
            JOIN pg_attribute a ON a.attnum = ANY(i.indkey)
            WHERE c.relname = rec.referencing_table
              AND a.attname = rec.fk_column
              AND a.attnum = i.indkey[0]  -- first column of the index
        ) THEN
            RAISE NOTICE 'MISSING INDEX: %(%) references %(%). Consider: CREATE INDEX idx_%_% ON % (%)',
                rec.referencing_table, rec.fk_column, rec.referenced_table, rec.fk_column,
                rec.referencing_table, rec.fk_column, rec.referencing_table, rec.fk_column;
            missing_count := missing_count + 1;
        END IF;
    END LOOP;

    IF missing_count = 0 THEN
        RAISE NOTICE '✓ All foreign key columns in public schema have a covering index.';
    ELSE
        RAISE WARNING 'Found % foreign key column(s) without an index. Review the notices above.', missing_count;
    END IF;
END $$;
