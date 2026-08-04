---
name: department-mutation-scaffolder
description: Scaffold Zod schemas in @repo/contract, Server Actions with revalidateTag in apps/portal, and interactive Client Dialogs with Sonner toasts.
---

# Department Mutation Scaffolder Skill

Use this skill when implementing new CRUD logic, server actions, or UI forms for department modules in the portal monorepo.

## 1. Zod Contract Schema (`packages/contract/src/schemas/`)

Define input/output schemas using Zod in `@repo/contract` and export them from `packages/contract/index.ts`:

```ts
import { z } from 'zod'

export const createResourceSchema = z.object({
  departmentId: z.string().uuid(),
  title: z.string().min(2),
  status: z.enum(['draft', 'active', 'archived']),
})

export type CreateResourceInput = z.infer<typeof createResourceSchema>
```

## 2. Server Action (`apps/portal/src/app/(departments)/<dept>/actions.ts`)

- Always enforce department RBAC via `assertDeptRole`.
- Parse inputs using `@repo/contract` schemas.
- Revalidate cache tags using `revalidateTag(TAG, 'max')` (Next.js 16 syntax).

```ts
'use server'

import { assertDeptRole } from '@/lib/dept-access'
import { DEPARTMENT_CACHE_TAGS } from '@/lib/department-cache'
import { DatabaseError } from '@/lib/errors/error-classes'

export async function createResource(input: unknown) {
  const { revalidateTag } = await import('next/cache')
  const { createResourceSchema } = await import('@repo/contract')
  const validated = createResourceSchema.parse(input)

  const { supabase } = await assertDeptRole(['admin', 'supervisor'], 'safety')

  const { data, error } = await supabase
    .from('resources')
    .insert(validated)
    .select('id')
    .single()

  if (error) {
    throw new DatabaseError('Failed to create resource', {
      operation: 'insert',
      context: { error: error.message },
    })
  }

  revalidateTag(DEPARTMENT_CACHE_TAGS.SAFETY, 'max')
  return { success: true, id: data.id }
}
```

## 3. Interactive Client Modal Component

- Use `'use client'` at the top.
- Wrap server action calls in `useTransition()` for non-blocking UI.
- Trigger `toast.success()` / `toast.error()` via `sonner`.
- Call `router.refresh()` to update server components.

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createResource } from '../actions'

export function CreateResourceDialog({ deptId }: { deptId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        const res = await createResource({ departmentId: deptId, title: 'Sample' })
        if (res.success) {
          toast.success('Resource created!')
          setIsOpen(false)
          router.refresh()
        }
      } catch (err: unknown) {
        toast.error((err as Error).message || 'Creation failed')
      }
    })
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Create</button>
      {isOpen && (/* Modal JSX */ null)}
    </>
  )
}
```
