# Next.js App Router Code Annotation & Inline Commenting Guide

This document defines the standardized inline code annotation patterns for Next.js 16+ App Router components, server actions, route handlers, caching layers, and visual glass UI layouts in Arch-System.

---

## 1. Component Boundary Notes (`'use client'` vs Server Components)

App Router components default to **React Server Components (RSC)**. Always leave notes explaining why `'use client'` is introduced, or reminding developers to keep components server-side for direct database access, lower bundle sizes, and SEO benefits.

```tsx
// NOTE: Kept as Server Component for direct DB access and zero-JS client bundle overhead.
// Do NOT add 'use client' here—pass interactive child handlers down to leaf components.
export async function FleetOverviewCard({ machineId }: { machineId: string }) {
  const data = await getMachineMetrics(machineId)
  return (
    <div className="grid grid-cols-3 gap-4">
      <MetricsDisplay data={data} />

      {/* TODO: Extract interactive buttons into a separate 'use client' leaf component */}
      <ExportButton machineId={machineId} />
    </div>
  )
}
```

```tsx
'use client'

// FIXME: Using 'use client' because we need useState for local filter state.
// Consider lifting state up to URL searchParams to keep this SSR-friendly.
import { useState } from 'react'
```

---

## 2. Data Fetching, Caching & Revalidation Notes

Document caching behavior, Next.js cache tags (`cacheTag`), cache lifetimes (`cacheLife`), and revalidation targets (`revalidateTag`, `revalidatePath`) so teammates understand how data stays synchronized.

```tsx
// NOTE: Tagged for targeted cache invalidation via revalidateTag('telemetry-data')
// inside server actions after shift sheet updates.
export async function getTelemetryLogs() {
  const res = await fetch('http://api.internal/telemetry', {
    next: {
      tags: ['telemetry-data'],
      revalidate: 3600, // TODO: Lower this to 60s once production load testing completes
    },
  })
  return res.json()
}
```

---

## 3. Server Actions & Mutations Notes

Annotate Server Actions with authentication guards, Zod schema validation checks, and route cache revalidation strategy.

```tsx
'use server'

import { revalidatePath } from 'next/cache'

export async function updateMachineHours(formData: FormData) {
  // TODO: Validate payload using UpsertMachineOpSchema from @repo/contract
  // FIXME: Enforce department auth check (assertControlRoomRole) before DB write

  const hours = formData.get('hours')
  await db.update({ hours })

  // NOTE: Clears the route cache so the table immediately renders fresh data
  revalidatePath('/control-room/machine-operations')
}
```

---

## 4. Hydration & DOM Mismatch Warnings

Flag places where server-rendered HTML might differ from initial client render (such as locale date formatting or client-side dynamic state) and document suppressions.

```tsx
// HACK: Date formatting causes SSR/client hydration mismatch when rendered directly.
// Suppressing warning for now, but plan to move formatting to useEffect or UTC ISO string.
export function TimestampDisplay({ date }: { date: Date }) {
  return <span suppressHydrationWarning>{new Date(date).toLocaleTimeString()}</span>
}
```

---

## 5. Environment Variables & API Routing Notes

Inside API Route Handlers (`route.ts`) and configuration files, explicitly mark dynamic execution directives, secret vs public key boundaries, and middleware rate-limiting targets.

```tsx
// app/api/export/route.ts

// NOTE: Force dynamic execution to prevent Next.js from caching API route response
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // XXX: Ensure process.env.API_SECRET is defined on host server environment!
  // Do NOT expose this variable via NEXT_PUBLIC_ in client bundles.
  const apiKey = process.env.API_SECRET

  // TODO: Add rate limiting middleware check via runApiGuards()
  return Response.json({ success: true })
}
```

---

## 6. UI, Layout & Glassmorphism Tweaks Notes

In layouts, Tailwind classes, or glass overlays, document z-index stacking rules, backdrop blur layers, and container bounds.

```tsx
// app/(departments)/layout.tsx
export default function DepartmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* NOTE: Sticky header requires z-30 to sit above absolute glassmorphic overlays */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/70 border-b border-slate-200">
        <Navbar />
      </header>

      {/* TODO: Adjust responsive grid breakpoints for tablet view (md: grid-cols-2) */}
      <main className="max-w-7xl mx-auto p-6">{children}</main>
    </div>
  )
}
```
