# Database Optimization Patterns

## Index Strategy

```sql
-- Partial index for common filter (only published posts)
CREATE INDEX idx_posts_published ON posts(published_at DESC) WHERE status = 'published';

-- Composite index for filter + sort
CREATE INDEX idx_fuel_logs_machine_date ON fuel_logs(machine_id, log_date DESC);

-- GIN index for full-text search
CREATE INDEX idx_employees_name_search ON employees USING gin(to_tsvector('english', full_name));
```

## Preventing N+1 in Next.js

```typescript
// ❌ Bad: Client-side N+1
const { data: logs } = await supabase.from("daily_logs").select("*");
for (const log of logs) {
  const { data: machines } = await supabase
    .from("machines")
    .select("*")
    .eq("department_id", log.department_id);
}

// ✅ Good: Single query with embed
const { data: logs } = await supabase
  .from("daily_logs")
  .select("*, machines(*), fuel_logs(*), production_logs(*)")
  .gte("log_date", startDate);
```
