/**
 * Yields execution back to the browser's main thread to prevent long tasks (>50ms)
 * and optimize Interaction to Next Paint (INP) scores during heavy client processing loops.
 */
export async function yieldToMain(): Promise<void> {
  if (
    typeof window !== 'undefined' &&
    'scheduler' in window &&
    'yield' in (window as any).scheduler
  ) {
    return await (window as any).scheduler.yield()
  }
  return new Promise((resolve) => setTimeout(resolve, 0))
}
