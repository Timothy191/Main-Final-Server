/**
 * SQLiteCacheEngine — High-Performance SQLite WAL Caching Client
 *
 * Implements a Redis-compatible client contract using better-sqlite3 in WAL mode.
 * Supports set/get/delete, list, set, hash operations, expiration, incremental increases,
 * and scanning to act as a zero-overhead persistent L2 caching engine.
 */
import { Worker } from 'worker_threads'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

export class SQLiteCacheEngine {
  private worker: Worker
  private pendingRequests = new Map<
    number,
    { resolve: (val: any) => void; reject: (err: any) => void }
  >()
  private nextId = 1
  public status: string = 'ready'
  private options: {
    durability?: 'lazy' | 'write-through'
    maxL2Entries?: number
  }

  constructor(
    dbPath: string = 'arch-cache.db',
    options?: {
      durability?: 'lazy' | 'write-through'
      maxL2Entries?: number
    }
  ) {
    this.options = {
      durability: 'write-through',
      maxL2Entries: 50000,
      ...options,
    }

    const getFilePath = () => {
      const err = new Error()
      const stack = err.stack || ''
      const lines = stack.split('\n')
      for (const line of lines) {
        if (line.includes('sqlite-client')) {
          const match = line.match(/(?:at\s+.*?\s+\()?(file:\/\/.*?|\/.*?)(?::\d+:\d+|\))/)
          if (match && match[1]) {
            return match[1].replace(/^file:\/\/\/?/, '/')
          }
        }
      }
      return ''
    }

    const currentFile = getFilePath()
    const __dirname = currentFile ? dirname(currentFile) : ''
    const isTs = currentFile.endsWith('.ts')
    const workerFileName = isTs ? 'sqlite-worker.ts' : 'sqlite-worker.js'
    const workerPath = resolve(__dirname, workerFileName)

    const execArgv = [...process.execArgv]
    if (isTs && !execArgv.includes('--experimental-strip-types')) {
      execArgv.push('--experimental-strip-types')
    }

    this.worker = new Worker(workerPath, {
      workerData: { dbPath, maxL2Entries: this.options.maxL2Entries },
      execArgv,
    })

    this.worker.on('message', (message) => {
      const { id, type, result, error } = message
      if (type === 'response') {
        const pending = this.pendingRequests.get(id)
        if (pending) {
          this.pendingRequests.delete(id)
          if (error) {
            pending.reject(new Error(error))
          } else {
            pending.resolve(result)
          }
        }
      }
    })

    this.worker.on('error', (err) => {
      console.error('[SQLiteCacheEngine] Worker error:', err)
    })
  }

  private async execute(command: string, args: any[], isWrite: boolean): Promise<any> {
    const id = this.nextId++

    if (this.options.durability === 'lazy' && isWrite) {
      // Lazy write-behind: send to worker but don't await worker completion
      this.worker.postMessage({ id, command, args })
      if (command === 'set' || command === 'setex' || command === 'ltrim') return 'OK'
      if (command === 'del' || command === 'expire' || command === 'sadd' || command === 'lpush')
        return 1
      if (command === 'incr' || command === 'hincrby') return 1
      if (command === 'clear') return 'OK'
      return null
    }

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject })
      this.worker.postMessage({ id, command, args })
    })
  }

  public async get(key: string): Promise<string | null> {
    return this.execute('get', [key], false)
  }

  public async set(key: string, value: string, mode?: string, ttl?: number): Promise<'OK'> {
    return this.execute('set', [key, value, mode, ttl], true)
  }

  public async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    return this.execute('setex', [key, seconds, value], true)
  }

  public async del(...keys: string[]): Promise<number> {
    return this.execute('del', keys, true)
  }

  public async unlink(...keys: string[]): Promise<number> {
    return this.del(...keys)
  }

  public async incr(key: string): Promise<number> {
    return this.execute('incr', [key], true)
  }

  public async expire(key: string, seconds: number): Promise<number> {
    return this.execute('expire', [key, seconds], true)
  }

  public async sadd(key: string, ...members: string[]): Promise<number> {
    return this.execute('sadd', [key, ...members], true)
  }

  public async hincrby(key: string, field: string, increment: number): Promise<number> {
    return this.execute('hincrby', [key, field, increment], true)
  }

  public async hgetall(key: string): Promise<Record<string, string>> {
    return this.execute('hgetall', [key], false)
  }

  public async lpush(key: string, ...values: string[]): Promise<number> {
    return this.execute('lpush', [key, ...values], true)
  }

  public async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.execute('lrange', [key, start, stop], false)
  }

  public async ltrim(key: string, start: number, stop: number): Promise<'OK'> {
    return this.execute('ltrim', [key, start, stop], true)
  }

  public multi() {
    const operations: Array<{ command: string; args: any[] }> = []
    const self = this
    const pipeline = {
      sadd(key: string, member: string) {
        operations.push({ command: 'sadd', args: [key, member] })
        return pipeline
      },
      exec: async () => {
        const results = []
        for (const op of operations) {
          try {
            results.push([null, await self.execute(op.command, op.args, true)])
          } catch (err: any) {
            results.push([err, null])
          }
        }
        return results
      },
    }
    return pipeline
  }

  public async *scanStream(options?: { match?: string; count?: number }): AsyncIterable<string> {
    const keys = await this.execute('scanStream', [options], false)
    for (const key of keys) {
      yield key
    }
  }

  public async *sscanStream(tagKey: string, options?: { count?: number }): AsyncIterable<string> {
    const keys = await this.execute('sscanStream', [tagKey, options], false)
    for (const key of keys) {
      yield key
    }
  }

  public clear(): void {
    this.execute('clear', [], true).catch(() => {})
  }

  public async quit(): Promise<'OK'> {
    const res = await this.execute('quit', [], false)
    await this.worker.terminate()
    return res
  }
}
