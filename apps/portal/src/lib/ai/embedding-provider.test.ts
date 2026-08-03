import {
  getEmbedding,
  getBatchEmbeddings,
  generateLocalFallbackEmbedding,
} from './embedding-provider'

describe('embedding-provider', () => {
  it('generates local fallback embeddings with 1536 dimensions', () => {
    const vec = generateLocalFallbackEmbedding('test query')
    expect(vec.length).toBe(1536)
    expect(typeof vec[0]).toBe('number')
  })

  it('returns local fallback vector when no router URL or Ollama key is set', async () => {
    const result = await getEmbedding('hello world')
    expect(result.provider).toBe('local')
    expect(result.embedding.length).toBe(1536)
  })

  it('returns batch local fallback vectors when no router URL is set', async () => {
    const results = await getBatchEmbeddings(['hello', 'world'])
    expect(results.length).toBe(2)
    expect(results[0]?.provider).toBe('local')
    expect(results[1]?.provider).toBe('local')
    expect(results[0]?.embedding.length).toBe(1536)
  })
})
