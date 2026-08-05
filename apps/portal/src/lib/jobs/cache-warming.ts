import { inngest } from '@repo/utils/inngest'
import { getTools } from '@/lib/tools'

/**
 * Cache Warming Job
 *
 * Runs every 15 minutes to pre-populate frequently used cache keys,
 * ensuring fast loading times for common routes (e.g. tools configuration).
 */
export const cacheWarmingFn: ReturnType<typeof inngest.createFunction> = inngest.createFunction(
  {
    id: 'cache-warming',
    triggers: [{ cron: '*/15 * * * *' }, { event: 'cache/warm' }],
  },
  async () => {
    try {
      console.log('[cache-warming] Starting cache pre-warming...')

      // Warm up tools metadata cache
      await getTools()

      console.log('[cache-warming] Cache pre-warming completed successfully.')
      return { success: true, message: 'Warmed core cache items' }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('[cache-warming] Cache warming failed:', err.message)
      return { success: false, error: err.message }
    }
  }
)
