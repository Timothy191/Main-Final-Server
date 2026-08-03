# Core Patterns

## 1. API layer

Centralize fetch logic; normalize errors with `APIError` from `@repo/errors`.

```ts
import { APIError } from "@repo/errors";

export async function apiClient<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T | null> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let payload: Record<string, unknown> | null = null;
    try {
      payload = (await res.json()) as Record<string, unknown>;
    } catch {
      const text = await res.text().catch(() => "");
      payload = text ? { rawBody: text } : null;
    }
    throw new APIError((payload?.message as string) ?? `Request failed with status ${res.status}`, {
      statusCode: res.status,
      context: { url, status: res.status, payload },
    });
  }

  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}
```

## 2. Race-safe state (useEffect + cancellation)

```ts
useEffect(() => {
  let cancelled = false;
  const controller = new AbortController();

  const load = async () => {
    try {
      setLoading(true);
      const result = await apiClient<User>(`/api/users/${userId}`, {
        signal: controller.signal,
      });
      if (!cancelled && result) setData(result);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      if (!cancelled)
        setError(err instanceof APIError ? err.message : "An unexpected error occurred.");
    } finally {
      if (!cancelled) setLoading(false);
    }
  };

  load();
  return () => {
    cancelled = true;
    controller.abort();
  };
}, [userId]);
```

## 3. Request cancellation

Always `return () => controller.abort()` in `useEffect` cleanup.

## 4. Retry with exponential backoff

Retry only 5xx and network errors — never 4xx.

```ts
export async function fetchWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelay = 300
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    const isHttpError = err instanceof APIError && typeof err.statusCode === "number";
    const isRetryable = !isAbort && (!isHttpError || err.statusCode >= 500);
    if (retries <= 0 || !isRetryable) throw err;
    const delay = baseDelay * 2 + Math.random() * baseDelay;
    await new Promise((r) => setTimeout(r, delay));
    return fetchWithBackoff(fn, retries - 1, delay);
  }
}
```

## 5. Debounced API calls

```ts
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

## 6. Request deduplication

```ts
const inFlight = new Map<string, Promise<unknown>>();

export async function dedupedFetch<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (inFlight.has(key)) return inFlight.get(key) as Promise<T>;
  const promise = fn().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}
```
