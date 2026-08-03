import { env } from '@/lib/env'
import crypto from 'crypto'

export interface EmbeddingResult {
  embedding: number[]
  provider: 'router' | 'ollama' | 'openai' | 'local'
}

/**
 * Generate a 1536-dimensional deterministic normalized vector for offline fallback.
 * Uses SHA-256 seed to produce stable, normalized float array matching nomic/openai shape.
 */
export function generateLocalFallbackEmbedding(text: string, dimensions = 1536): number[] {
  const hash = crypto.createHash('sha256').update(text).digest()
  const vector: number[] = new Array(dimensions)

  let normSq = 0
  for (let i = 0; i < dimensions; i++) {
    const seedByte = hash[i % hash.length] ?? 0
    // Map byte 0-255 to continuous range [-1, 1] with position variance
    const val = Math.sin((i + 1) * (seedByte + 1))
    vector[i] = val
    normSq += val * val
  }

  const norm = Math.sqrt(normSq) || 1
  for (let i = 0; i < dimensions; i++) {
    vector[i] = (vector[i] ?? 0) / norm
  }

  return vector
}

function resolveEndpointConfig(): { url: string; apiKey?: string; isOllama: boolean } | null {
  const isOllamaProvider = env.AI_EMBEDDING_PROVIDER === 'ollama' || Boolean(env.OLLAMA_API_KEY)
  const apiKey =
    env.AI_ROUTER_KEY || env.OPENROUTER_API_KEY || env.OLLAMA_API_KEY || env.OPENAI_API_KEY

  if (env.AI_ROUTER_URL) {
    return { url: env.AI_ROUTER_URL, apiKey, isOllama: isOllamaProvider }
  }

  if (isOllamaProvider && env.OLLAMA_URL) {
    const baseUrl = env.OLLAMA_URL.replace(/\/+$/, '')
    const url = baseUrl.endsWith('/v1') ? baseUrl : `${baseUrl}/v1`
    return { url, apiKey: env.OLLAMA_API_KEY || apiKey, isOllama: true }
  }

  if (env.AI_EMBEDDING_PROVIDER === 'router' || env.AI_EMBEDDING_PROVIDER === 'openai') {
    const url = env.OPENAI_API_KEY ? 'https://api.openai.com/v1' : undefined
    if (url) return { url, apiKey, isOllama: false }
  }

  return null
}

/**
 * Generates an embedding for a single string using standard OpenAI-compatible API endpoint
 * (Ollama Cloud, OpenRouter, OpenCode, Kilo, Antigravity) with automatic fallback to local generation.
 */
export async function getEmbedding(text: string): Promise<EmbeddingResult> {
  const config = resolveEndpointConfig()

  if (config) {
    try {
      const endpoint = config.url.endsWith('/')
        ? `${config.url}embeddings`
        : `${config.url}/embeddings`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || env.OLLAMA_DEFAULT_MODEL || 'nomic-embed-text',
          input: text,
        }),
      })

      if (response.ok) {
        const resJson = await response.json()
        const embedding = resJson.data?.[0]?.embedding
        if (Array.isArray(embedding) && embedding.length > 0) {
          return { embedding, provider: config.isOllama ? 'ollama' : 'router' }
        }
      }
    } catch {
      // Fallback on network or API failure
    }
  }

  return {
    embedding: generateLocalFallbackEmbedding(text),
    provider: 'local',
  }
}

/**
 * Generates embeddings for a batch of strings using standard OpenAI-compatible API endpoint
 * (Ollama Cloud, OpenRouter, OpenCode, Kilo, Antigravity) with automatic fallback to local generation.
 */
export async function getBatchEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  if (texts.length === 0) return []

  const config = resolveEndpointConfig()

  if (config) {
    try {
      const endpoint = config.url.endsWith('/')
        ? `${config.url}embeddings`
        : `${config.url}/embeddings`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || env.OLLAMA_DEFAULT_MODEL || 'nomic-embed-text',
          input: texts,
        }),
      })

      if (response.ok) {
        const resJson = await response.json()
        const data = resJson.data
        if (Array.isArray(data) && data.length === texts.length) {
          return data.map((item: { embedding: number[] }) => ({
            embedding: item.embedding,
            provider: config.isOllama ? 'ollama' : 'router',
          }))
        }
      }
    } catch {
      // Fallback on network or API failure
    }
  }

  return texts.map((t) => ({
    embedding: generateLocalFallbackEmbedding(t),
    provider: 'local',
  }))
}
