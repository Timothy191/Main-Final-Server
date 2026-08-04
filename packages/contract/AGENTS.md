# @repo/contract Package Guidelines

**Purpose:** Zod validation schemas and OpenAPI contracts — the shared type system for API validation.

## Package Overview

This package contains all Zod schemas used for validation across server actions, API routes, and client-side validation. It serves as the single source of truth for data contracts.

## Exported Schemas

```typescript
// User schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['admin', 'operator', 'viewer']),
  // ...
});

// Department schemas
export const DepartmentSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  // ...
});

// API request/response schemas
export const CreateDepartmentRequestSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z-]+$/),
  // ...
});
```

## Critical Rules

### 1. Schema Contract Discipline
- **ALL** API inputs must be validated against schemas from this package
- **NEVER** define ad-hoc Zod schemas in API routes or server actions
- Schema changes are **BREAKING CHANGES** for API contracts

### 2. Change Impact Assessment
When changing a schema:
- **BREAKING:** Removing required fields, changing field types, tightening validation
- **NON-BREAKING:** Adding optional fields, loosening validation, adding defaults
- **CONSUMER IMPACT:** All code using the schema must be updated for breaking changes

### 3. Cross-Package Dependencies
This package is consumed by:
- `apps/portal/src/app/api/` — API route validation
- `apps/portal/src/features/` — Server action validation
- `apps/portal/src/lib/` — Client-side validation
- Any package that needs validated data types

### 4. Versioning Strategy
- Treat this package as an **API contract** — changes should be intentional
- Consider versioning major schema changes (e.g., `v2/` directory)
- Document breaking changes in package CHANGELOG

## Testing

```bash
# Run schema validation tests
pnpm --filter @repo/contract test

# Test specific schema file
pnpm --filter @repo/contract test -- user.test.ts
```

## Common Patterns

### API route validation
```typescript
import { CreateDepartmentRequestSchema } from '@repo/contract';
import { AppError } from '@repo/errors';

export async function POST(request: Request) {
  const body = await request.json();
  const result = CreateDepartmentRequestSchema.safeParse(body);
  
  if (!result.success) {
    throw new AppError('Validation failed', 400, result.error);
  }
  
  // Use validated data
  const data = result.data;
  // ...
}
```

### Server action validation
```typescript
import { UserUpdateSchema } from '@repo/contract';

'use server';

export async function updateUser(input: unknown) {
  const data = UserUpdateSchema.parse(input);
  // Process validated data
}
```

### Client-side validation
```typescript
import { DepartmentSchema } from '@repo/contract';

const formData = getFormData();
const result = DepartmentSchema.safeParse(formData);

if (!result.success) {
  // Show validation errors
  return { errors: result.error.flatten() };
}
```

## Change Checklist

Before declaring done with schema changes:
- [ ] Updated schema definition
- [ ] Identified all consumers of the schema
- [ ] Updated consumers for breaking changes
- [ ] Added/updated tests for new validation rules
- [ ] Updated OpenAPI documentation if applicable
- [ ] Added entry to `docs/REPO-CHANGE-INDEX.md`
- [ ] Ran `pnpm --filter @repo/contract test`
- [ ] Ran type-check across affected packages: `pnpm exec turbo run type-check --filter ...^...`

## Schema Design Guidelines

### 1. Prefer strict validation
- Use specific types over `z.any()`
- Use `.min()`, `.max()`, `.regex()` for string constraints
- Use `.refine()` for custom business logic validation

### 2. Provide error context
```typescript
export const EmailSchema = z.string()
  .email('Invalid email format')
  .min(1, 'Email is required')
  .max(255, 'Email too long');
```

### 3. Reuse common patterns
```typescript
// Common patterns
export const UUIDSchema = z.string().uuid();
export const NonEmptyStringSchema = z.string().min(1);
export const TimestampSchema = z.string().datetime();

// Reuse in other schemas
export const UserSchema = z.object({
  id: UUIDSchema,
  email: NonEmptyStringSchema,
  createdAt: TimestampSchema,
});
```

## OpenAPI Integration

If using OpenAPI generation:
- Schemas should be OpenAPI-compatible
- Use `z.openapi()` or similar decorators
- Generate OpenAPI spec from Zod schemas
- Keep OpenAPI spec in sync with schema changes
