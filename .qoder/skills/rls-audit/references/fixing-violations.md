# Fixing RLS Violations

For each violating migration, add RLS to every table:

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

Child partitions created inside `format()` inherit RLS from parent — excluded from check.

After enabling RLS, verify policies match the table's access patterns.

## Success output

```
RLS audit: N/N table-creating migrations have RLS.
```

## Failure output

```
RLS VIOLATION: packages/database/migrations/XXX_name.sql creates a table without ENABLE ROW LEVEL SECURITY
```
