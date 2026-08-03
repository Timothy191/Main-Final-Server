/**
 * Shared hook for admin tab data loading.
 *
 * Extracts the common useMemo + useCallback pattern from DepartmentsTab
 * and UsersTab into a reusable hook that provides:
 *  - Memoized Supabase client
 *  - Standardized loading state management
 *  - Error handling with logError
 *
 * Usage:
 *   const { data, loading, reload } = useAdminData<Department[]>(
 *     (supabase) => supabase.from("departments").select("*").order("display_name")
 *   );
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@repo/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logError } from "@/lib/errors/error-logger";

/**
 * Memoized Supabase client — stable reference across renders.
 * Use this instead of calling createBrowserSupabaseClient() in components directly.
 */
export function useSupabaseClient(): SupabaseClient {
  // Cross-package version mismatch requires double cast
  return useMemo(() => createBrowserSupabaseClient() as unknown as SupabaseClient, []);
}

export interface AdminDataState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

type QueryFn<T> = (supabase: SupabaseClient) => Promise<{ data: T[] | null; error: unknown }>;

/**
 * Generic hook for loading admin data with Supabase.
 *
 * Provides a standardized pattern for:
 *  - Loading state
 *  - Error handling via logError
 *  - Reload/refresh capability
 *
 * @param queryFn - Function that takes a supabase client and returns { data, error }
 * @param deps - Additional dependencies for the query callback (defaults to [])
 * @returns AdminDataState with data, loading, error, and reload
 */
export function useAdminData<T>(queryFn: QueryFn<T>, deps: unknown[] = []): AdminDataState<T> {
  const supabase = useSupabaseClient();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await queryFn(supabase);
      if (!mountedRef.current) return;

      if (result.error) {
        const errorMessage =
          result.error instanceof Error ? result.error.message : String(result.error);
        logError(result.error instanceof Error ? result.error : new Error(errorMessage), {
          context: "useAdminData",
        });
        setError(errorMessage);
        setData([]);
      } else {
        setData(result.data ?? []);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const errorMessage = err instanceof Error ? err.message : String(err);
      logError(err instanceof Error ? err : new Error(errorMessage), {
        context: "useAdminData",
      });
      setError(errorMessage);
      setData([]);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, ...deps]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  const reload = useCallback(() => {
    load();
  }, [load]);

  return { data, loading, error, reload };
}
