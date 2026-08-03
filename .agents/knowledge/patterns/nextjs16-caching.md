---
title: Next.js 16 Caching & Auth Pattern
tags: [patterns, caching, nextjs16, auth]
updated: 2026-07-22
source_agent: antigravity
status: active
---

# Next.js 16 Caching & Auth Pattern

## Problem
When migrating custom data caching wrappers (e.g. `withCache` or `cachedRSC` using Redis) to the Next.js 16 native `"use cache"` directive, you will encounter caching bailouts or runtime errors if the cached function accesses `cookies()` or `headers()` directly or indirectly. 

In this monorepo, helper functions like `assertAccessControlRole()` or `createServerSupabaseClient()` inherently read `cookies()` to verify user sessions. Placing these inside a function marked with `"use cache"` breaks the cache isolation, and passing the cookies directly to the cache function results in a cache key that is overly specific (caching by session rather than globally/departmentally).

## Solution
Decouple the authentication layer from the data-fetching layer:
1. **Outer Function (Dynamic)**: Verify authorization here. Call `assertAccessControlRole()` which safely reads cookies and validates permissions.
2. **Inner Function (Cached)**: Mark this with `"use cache"` and define the `cacheTag`. To avoid needing cookies, fetch the data using `createAdminClient()` instead of the authenticated client. Since the outer function already verified access, bypassing RLS inside the cached boundary is secure and allows the query results to be shared across all authorized users.

## Evidence & Citation
Implemented in `apps/portal/src/app/(departments)/access-control/actions.ts` during the transition to Next.js 16 built-in streaming and caching optimizations.
