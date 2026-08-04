import { PlaywrightCrawler, type PlaywrightCrawlingContext } from 'crawlee'
import { GoogleGenAI } from '@google/genai'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load env vars from monorepo root if available
config({ path: resolve(process.cwd(), '../../.env') })
config({ path: resolve(process.cwd(), '../../.env.local') })

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// Assuming this script runs in a trusted context (cron or CLI), we need a service role client to bypass RLS,
// or we just use standard supabase client with a logged-in admin.
// For now, we'll import createClient from @supabase/supabase-js directly to avoid Next.js specific context if needed.
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Split text into chunks of roughly `maxTokens` (approximated by character count for simplicity here)
 */
function chunkText(text: string, maxCharLength: number = 2000): string[] {
  const chunks: string[] = []
  let currentChunk = ''
  const sentences = text.split(/(?<=[.!?])\s+/)

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxCharLength) {
      if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim())
      currentChunk = sentence + ' '
    } else {
      currentChunk += sentence + ' '
    }
  }
  if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim())
  return chunks
}

const crawler = new PlaywrightCrawler({
  // Use the requestHandler to process each of the crawled pages.
  async requestHandler({ request, page, log }: PlaywrightCrawlingContext) {
    log.info(`Processing ${request.url}...`)

    // Extract title and text content
    const title = await page.title()

    // Simple extraction of visible text - you might want to refine this for specific sites
    const textContent = await page.evaluate(() => {
      // Remove scripts, styles, etc. before extracting text
      document.querySelectorAll('script, style, noscript, iframe').forEach((el) => el.remove())
      return document.body.innerText
    })

    log.info(`Extracted ${textContent.length} characters from ${title}`)

    // Chunk the text
    const chunks = chunkText(textContent)
    log.info(`Split into ${chunks.length} chunks`)

    // Process chunks
    for (const [index, chunk] of chunks.entries()) {
      try {
        log.info(`Embedding chunk ${index + 1}/${chunks.length}...`)
        // Generate embedding using Gemini
        const response = await ai.models.embedContent({
          model: 'text-embedding-004',
          contents: chunk,
        })

        const embedding = response.embeddings?.[0]?.values

        if (!embedding) {
          log.error(`Failed to generate embedding for chunk ${index}`)
          continue
        }

        // Store in Supabase
        const { error } = await supabase.from('memory_embeddings').insert({
          session_id: 'scraper-job',
          content: chunk,
          embedding: embedding,
          memory_type: 'semantic',
          metadata: {
            source_url: request.url,
            title: title,
            chunk_index: index,
            total_chunks: chunks.length,
            scraped_at: new Date().toISOString(),
          },
        })

        if (error) {
          log.error(`Supabase insert error: ${error.message}`)
        } else {
          log.info(`Chunk ${index + 1} saved to database.`)
        }
      } catch (err) {
        log.error(`Error processing chunk ${index}: ${err}`)
      }
    }
  },
  // Let's limit the crawler to only follow links within the same domain
  // maxRequestsPerCrawl: 50,
})

async function main() {
  const targetUrl = process.argv[2]
  if (!targetUrl) {
    console.error('Usage: pnpm start <url>')
    process.exit(1)
  }

  // Ensure environment variables are present
  if (
    !process.env.GEMINI_API_KEY ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error(
      'Missing required environment variables (GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).'
    )
    process.exit(1)
  }

  console.log(`Starting crawl for ${targetUrl}`)
  await crawler.run([targetUrl])
  console.log('Crawl finished.')
}

main().catch(console.error)
