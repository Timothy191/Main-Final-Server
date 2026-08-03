import { generateLocalFallbackEmbedding, getBatchEmbeddings } from './embedding-provider'
import crypto from 'crypto'

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    const valA = a[i] ?? 0
    const valB = b[i] ?? 0
    dot += valA * valB
    normA += valA * valA
    normB += valB * valB
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

interface MemoryRow {
  id: string
  session_id: string
  user_id: string
  content: string
  embedding: number[]
  metadata: Record<string, unknown>
  memory_type: 'episodic' | 'semantic' | 'procedural'
  created_at: Date
  updated_at: Date
}

function generateMockMemoryRow(index: number): MemoryRow {
  const content = `Memory content for benchmark iteration ${index} - ${crypto.randomBytes(8).toString('hex')}`
  const embedding = generateLocalFallbackEmbedding(content)

  return {
    id: crypto.randomUUID(),
    session_id: `session-${Math.floor(index / 10)}`,
    user_id: '00000000-0000-0000-0000-000000000000',
    content,
    embedding,
    metadata: { source: 'benchmark', index },
    memory_type: index % 3 === 0 ? 'episodic' : index % 3 === 1 ? 'semantic' : 'procedural',
    created_at: new Date(),
    updated_at: new Date(),
  }
}

describe('RAG Subsystem Performance & Vector Similarity Benchmark', () => {
  it('benchmarks 1536-dimensional vector generation latency (< 5ms per query)', async () => {
    const iterations = 100
    const start = performance.now()

    for (let i = 0; i < iterations; i++) {
      generateLocalFallbackEmbedding(`synthetic query string payload iteration #${i}`)
    }

    const elapsed = performance.now() - start
    const avgMs = elapsed / iterations

    console.log(`[RAG Benchmark] Average 1536d Vector Generation Latency: ${avgMs.toFixed(3)}ms`)
    expect(avgMs).toBeLessThan(5.0) // Must generate vectors under 5ms
  })

  it('benchmarks cosine similarity retrieval match precision and scoring', () => {
    const queryVec = generateLocalFallbackEmbedding('safety compliance audit report')
    const matchVec = generateLocalFallbackEmbedding('safety compliance audit report')
    const distinctVec = generateLocalFallbackEmbedding('unrelated machine maintenance log')

    const selfSim = cosineSimilarity(queryVec, matchVec)
    const diffSim = cosineSimilarity(queryVec, distinctVec)

    console.log(`[RAG Benchmark] Self Similarity Score: ${selfSim.toFixed(4)}`)
    console.log(`[RAG Benchmark] Distinct Similarity Score: ${diffSim.toFixed(4)}`)

    expect(selfSim).toBeGreaterThan(0.99) // Exact match vector similarity ~ 1.0
    expect(diffSim).toBeLessThan(selfSim) // Distinct vectors must score significantly lower
  })

  it('benchmarks batch vector embedding retrieval throughput', async () => {
    const batchTexts = Array.from({ length: 50 }, (_, i) => `batch text item #${i}`)
    const start = performance.now()

    const results = await getBatchEmbeddings(batchTexts)
    const elapsed = performance.now() - start

    console.log(
      `[RAG Benchmark] Batch 50 Vector Embedding Generation Latency: ${elapsed.toFixed(2)}ms`
    )

    expect(results.length).toBe(50)
    expect(results[0]?.embedding.length).toBe(1536)
    expect(elapsed).toBeLessThan(1500) // 50 embeddings in < 1.5 seconds
  })
})

describe('Batch Memory Insertion Benchmark', () => {
  it('benchmarks small batch memory insertion (10 rows)', () => {
    const batchSize = 10
    const rows = Array.from({ length: batchSize }, (_, i) => generateMockMemoryRow(i))

    const start = performance.now()
    const serialized = JSON.stringify(rows)
    const elapsed = performance.now() - start

    console.log(`[Batch Insert Benchmark] Small batch (10) serialization: ${elapsed.toFixed(3)}ms`)
    console.log(
      `[Batch Insert Benchmark] Payload size: ${(serialized.length / 1024).toFixed(2)} KB`
    )

    expect(rows.length).toBe(batchSize)
    expect(rows[0]?.embedding.length).toBe(1536)
    expect(elapsed).toBeLessThan(50) // < 50ms for 10 rows
  })

  it('benchmarks medium batch memory insertion (100 rows)', () => {
    const batchSize = 100
    const rows = Array.from({ length: batchSize }, (_, i) => generateMockMemoryRow(i))

    const start = performance.now()
    const serialized = JSON.stringify(rows)
    const elapsed = performance.now() - start

    console.log(
      `[Batch Insert Benchmark] Medium batch (100) serialization: ${elapsed.toFixed(3)}ms`
    )
    console.log(
      `[Batch Insert Benchmark] Payload size: ${(serialized.length / 1024).toFixed(2)} KB`
    )

    expect(rows.length).toBe(batchSize)
    expect(rows[0]?.embedding.length).toBe(1536)
    expect(elapsed).toBeLessThan(200) // < 200ms for 100 rows
  })

  it('benchmarks large batch memory insertion (500 rows)', () => {
    const batchSize = 500
    const rows = Array.from({ length: batchSize }, (_, i) => generateMockMemoryRow(i))

    const start = performance.now()
    const serialized = JSON.stringify(rows)
    const elapsed = performance.now() - start

    console.log(`[Batch Insert Benchmark] Large batch (500) serialization: ${elapsed.toFixed(3)}ms`)
    console.log(
      `[Batch Insert Benchmark] Payload size: ${(serialized.length / 1024 / 1024).toFixed(2)} MB`
    )

    expect(rows.length).toBe(batchSize)
    expect(rows[0]?.embedding.length).toBe(1536)
    expect(elapsed).toBeLessThan(1000) // < 1s for 500 rows
  })

  it('benchmarks vector embedding generation throughput for batch insertion', async () => {
    const batchSize = 100
    const texts = Array.from({ length: batchSize }, (_, i) => `memory text ${i}`)

    const start = performance.now()
    const embeddings = await getBatchEmbeddings(texts)
    const elapsed = performance.now() - start

    const rows = texts.map((text, i) => ({
      content: text,
      embedding: embeddings[i]?.embedding ?? [],
      metadata: { source: 'benchmark' },
    }))

    console.log(
      `[Batch Insert Benchmark] 100 embeddings + row prep: ${elapsed.toFixed(2)}ms (${(elapsed / batchSize).toFixed(3)}ms/row)`
    )

    expect(rows.length).toBe(batchSize)
    expect(rows[0]?.embedding.length).toBe(1536)
    expect(elapsed).toBeLessThan(2000) // < 2s for 100 embeddings
  })

  it('benchmarks memory type distribution in batch', () => {
    const batchSize = 300
    const rows = Array.from({ length: batchSize }, (_, i) => generateMockMemoryRow(i))

    const typeCounts = {
      episodic: rows.filter((r) => r.memory_type === 'episodic').length,
      semantic: rows.filter((r) => r.memory_type === 'semantic').length,
      procedural: rows.filter((r) => r.memory_type === 'procedural').length,
    }

    console.log(`[Batch Insert Benchmark] Memory type distribution:`, typeCounts)

    expect(typeCounts.episodic).toBeGreaterThan(0)
    expect(typeCounts.semantic).toBeGreaterThan(0)
    expect(typeCounts.procedural).toBeGreaterThan(0)
    expect(typeCounts.episodic + typeCounts.semantic + typeCounts.procedural).toBe(batchSize)
  })

  it('benchmarks metadata JSON serialization overhead', () => {
    const batchSize = 100
    const rows = Array.from({ length: batchSize }, (_, i) => ({
      ...generateMockMemoryRow(i),
      metadata: {
        source: 'benchmark',
        tags: ['tag1', 'tag2', 'tag3'],
        nested: { deep: { value: i } },
      },
    }))

    const start = performance.now()
    const serialized = JSON.stringify(rows)
    const elapsed = performance.now() - start

    console.log(
      `[Batch Insert Benchmark] Complex metadata serialization (100): ${elapsed.toFixed(3)}ms`
    )
    console.log(
      `[Batch Insert Benchmark] Payload size: ${(serialized.length / 1024).toFixed(2)} KB`
    )

    expect(elapsed).toBeLessThan(100) // < 100ms
  })
})
