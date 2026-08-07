import { parentPort, workerData } from 'worker_threads'
import Database from 'better-sqlite3'
import { resolve } from 'path'

if (!parentPort) {
  throw new Error('This file must be run as a worker thread')
}

const { dbPath = 'arch-cache.db', maxL2Entries = 50000 } = workerData || {}
const absolutePath = resolve(process.cwd(), dbPath)
const db = new Database(absolutePath)

db.pragma('journal_mode = WAL')
db.pragma('synchronous = OFF')
db.pragma('temp_store = MEMORY')

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS cache_store (
    key TEXT PRIMARY KEY,
    value TEXT,
    type TEXT NOT NULL,
    expires_at INTEGER,
    last_accessed INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_expires_at ON cache_store(expires_at);
  CREATE INDEX IF NOT EXISTS idx_last_accessed ON cache_store(last_accessed);
  
  CREATE TABLE IF NOT EXISTS set_store (
    key TEXT,
    member TEXT,
    PRIMARY KEY (key, member)
  );
  CREATE INDEX IF NOT EXISTS idx_set_key ON set_store(key);
  
  CREATE TABLE IF NOT EXISTS hash_store (
    key TEXT,
    field TEXT,
    value TEXT,
    PRIMARY KEY (key, field)
  );
  CREATE INDEX IF NOT EXISTS idx_hash_key ON hash_store(key);

  CREATE TABLE IF NOT EXISTS list_store (
    key TEXT,
    idx INTEGER,
    value TEXT,
    PRIMARY KEY (key, idx)
  );
  CREATE INDEX IF NOT EXISTS idx_list_key ON list_store(key);
`)

// Try to add last_accessed in case the database existed previously
try {
  db.exec('ALTER TABLE cache_store ADD COLUMN last_accessed INTEGER;')
} catch (e) {
  // Column already exists
}

function isExpired(expiresAt: number | null): boolean {
  return expiresAt !== null && Date.now() > expiresAt
}

function cleanKey(key: string): void {
  const row = db.prepare('SELECT expires_at FROM cache_store WHERE key = ?').get(key) as any
  if (row && isExpired(row.expires_at)) {
    db.prepare('DELETE FROM cache_store WHERE key = ?').run(key)
    db.prepare('DELETE FROM set_store WHERE key = ?').run(key)
    db.prepare('DELETE FROM hash_store WHERE key = ?').run(key)
    db.prepare('DELETE FROM list_store WHERE key = ?').run(key)
  }
}

function updateLastAccessed(key: string): void {
  db.prepare('UPDATE cache_store SET last_accessed = ? WHERE key = ?').run(Date.now(), key)
}

function pruneIfNecessary(): void {
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM cache_store').get() as any
  if (countRow && countRow.cnt > maxL2Entries) {
    const excess = countRow.cnt - maxL2Entries
    const oldKeysRows = db
      .prepare('SELECT key FROM cache_store ORDER BY last_accessed ASC LIMIT ?')
      .all(excess) as any[]
    if (oldKeysRows.length > 0) {
      const deleteCache = db.prepare('DELETE FROM cache_store WHERE key = ?')
      const deleteSet = db.prepare('DELETE FROM set_store WHERE key = ?')
      const deleteHash = db.prepare('DELETE FROM hash_store WHERE key = ?')
      const deleteList = db.prepare('DELETE FROM list_store WHERE key = ?')
      for (const row of oldKeysRows) {
        deleteCache.run(row.key)
        deleteSet.run(row.key)
        deleteHash.run(row.key)
        deleteList.run(row.key)
      }
    }
  }
}

// TTL cleanup background task
const cleanupInterval = setInterval(() => {
  const now = Date.now()
  const expiredRows = db
    .prepare('SELECT key FROM cache_store WHERE expires_at IS NOT NULL AND expires_at < ?')
    .all(now) as any[]
  if (expiredRows.length > 0) {
    const deleteCache = db.prepare('DELETE FROM cache_store WHERE key = ?')
    const deleteSet = db.prepare('DELETE FROM set_store WHERE key = ?')
    const deleteHash = db.prepare('DELETE FROM hash_store WHERE key = ?')
    const deleteList = db.prepare('DELETE FROM list_store WHERE key = ?')
    const transaction = db.transaction((keys: string[]) => {
      for (const key of keys) {
        deleteCache.run(key)
        deleteSet.run(key)
        deleteHash.run(key)
        deleteList.run(key)
      }
    })
    transaction(expiredRows.map((r) => r.key))
  }
}, 60000)

cleanupInterval.unref()

// Handle messages
parentPort.on('message', (message) => {
  const { id, command, args } = message
  try {
    let result: any = null
    switch (command) {
      case 'get': {
        const [key] = args
        cleanKey(key)
        const row = db
          .prepare("SELECT value, expires_at FROM cache_store WHERE key = ? AND type = 'string'")
          .get(key) as any
        if (row) {
          updateLastAccessed(key)
          result = row.value
        } else {
          result = null
        }
        break
      }
      case 'set': {
        const [key, value, mode, ttl] = args
        let expiresAt: number | null = null
        if (mode === 'EX' && typeof ttl === 'number') {
          expiresAt = Date.now() + ttl * 1000
        } else if (mode === 'PX' && typeof ttl === 'number') {
          expiresAt = Date.now() + ttl
        }
        db.prepare(
          `
          INSERT INTO cache_store (key, value, type, expires_at, last_accessed)
          VALUES (?, ?, 'string', ?, ?)
          ON CONFLICT(key) DO UPDATE SET value=excluded.value, expires_at=excluded.expires_at, type='string', last_accessed=excluded.last_accessed
        `
        ).run(key, String(value), expiresAt, Date.now())
        pruneIfNecessary()
        result = 'OK'
        break
      }
      case 'setex': {
        const [key, seconds, value] = args
        const expiresAt = Date.now() + seconds * 1000
        db.prepare(
          `
          INSERT INTO cache_store (key, value, type, expires_at, last_accessed)
          VALUES (?, ?, 'string', ?, ?)
          ON CONFLICT(key) DO UPDATE SET value=excluded.value, expires_at=excluded.expires_at, type='string', last_accessed=excluded.last_accessed
        `
        ).run(key, String(value), expiresAt, Date.now())
        pruneIfNecessary()
        result = 'OK'
        break
      }
      case 'del': {
        let deletedCount = 0
        const deleteCache = db.prepare('DELETE FROM cache_store WHERE key = ?')
        const deleteSet = db.prepare('DELETE FROM set_store WHERE key = ?')
        const deleteHash = db.prepare('DELETE FROM hash_store WHERE key = ?')
        const deleteList = db.prepare('DELETE FROM list_store WHERE key = ?')

        const transaction = db.transaction((targetKeys: string[]) => {
          for (const key of targetKeys) {
            const res = deleteCache.run(key)
            deleteSet.run(key)
            deleteHash.run(key)
            deleteList.run(key)
            if (res.changes > 0) {
              deletedCount++
            }
          }
        })
        transaction(args)
        result = deletedCount
        break
      }
      case 'incr': {
        const [key] = args
        cleanKey(key)
        let nextVal = 1
        const transaction = db.transaction(() => {
          const row = db
            .prepare("SELECT value, expires_at FROM cache_store WHERE key = ? AND type = 'string'")
            .get(key) as any
          if (row) {
            nextVal = (parseInt(row.value, 10) || 0) + 1
          }
          db.prepare(
            `
            INSERT INTO cache_store (key, value, type, expires_at, last_accessed)
            VALUES (?, ?, 'string', ?, ?)
            ON CONFLICT(key) DO UPDATE SET value=excluded.value, last_accessed=excluded.last_accessed
          `
          ).run(key, String(nextVal), row ? row.expires_at : null, Date.now())
        })
        transaction()
        pruneIfNecessary()
        result = nextVal
        break
      }
      case 'expire': {
        const [key, seconds] = args
        cleanKey(key)
        const expiresAt = Date.now() + seconds * 1000
        const res = db
          .prepare('UPDATE cache_store SET expires_at = ?, last_accessed = ? WHERE key = ?')
          .run(expiresAt, Date.now(), key)
        result = res.changes > 0 ? 1 : 0
        break
      }
      case 'sadd': {
        const [key, ...members] = args
        cleanKey(key)
        let added = 0
        const transaction = db.transaction((items: string[]) => {
          db.prepare(
            `
            INSERT OR IGNORE INTO cache_store (key, value, type, expires_at, last_accessed)
            VALUES (?, '', 'set', NULL, ?)
          `
          ).run(key, Date.now())

          updateLastAccessed(key)

          const insertSet = db.prepare(
            'INSERT OR IGNORE INTO set_store (key, member) VALUES (?, ?)'
          )
          for (const m of items) {
            const res = insertSet.run(key, m)
            if (res.changes > 0) {
              added++
            }
          }
        })
        transaction(members)
        pruneIfNecessary()
        result = added
        break
      }
      case 'hincrby': {
        const [key, field, increment] = args
        cleanKey(key)
        let nextVal = increment
        const transaction = db.transaction(() => {
          db.prepare(
            `
            INSERT OR IGNORE INTO cache_store (key, value, type, expires_at, last_accessed)
            VALUES (?, '', 'hash', NULL, ?)
          `
          ).run(key, Date.now())

          updateLastAccessed(key)

          const row = db
            .prepare('SELECT value FROM hash_store WHERE key = ? AND field = ?')
            .get(key, field) as any
          if (row) {
            nextVal = (parseInt(row.value, 10) || 0) + increment
          }
          db.prepare(
            `
            INSERT INTO hash_store (key, field, value)
            VALUES (?, ?, ?)
            ON CONFLICT(key, field) DO UPDATE SET value=excluded.value
          `
          ).run(key, field, String(nextVal))
        })
        transaction()
        pruneIfNecessary()
        result = nextVal
        break
      }
      case 'hgetall': {
        const [key] = args
        cleanKey(key)
        const rows = db
          .prepare('SELECT field, value FROM hash_store WHERE key = ?')
          .all(key) as any[]
        updateLastAccessed(key)
        const res: Record<string, string> = {}
        for (const r of rows) {
          res[r.field] = r.value
        }
        result = res
        break
      }
      case 'lpush': {
        const [key, ...values] = args
        cleanKey(key)
        let length = 0
        const transaction = db.transaction((items: string[]) => {
          db.prepare(
            `
            INSERT OR IGNORE INTO cache_store (key, value, type, expires_at, last_accessed)
            VALUES (?, '', 'list', NULL, ?)
          `
          ).run(key, Date.now())

          updateLastAccessed(key)

          const minRow = db
            .prepare('SELECT MIN(idx) as minIdx FROM list_store WHERE key = ?')
            .get(key) as any
          let minIdx = minRow && minRow.minIdx !== null ? minRow.minIdx : 0
          const insertList = db.prepare('INSERT INTO list_store (key, idx, value) VALUES (?, ?, ?)')
          for (const val of items) {
            minIdx--
            insertList.run(key, minIdx, val)
          }
          const countRow = db
            .prepare('SELECT COUNT(*) as cnt FROM list_store WHERE key = ?')
            .get(key) as any
          length = countRow.cnt
        })
        transaction(values)
        pruneIfNecessary()
        result = length
        break
      }
      case 'lrange': {
        const [key, start, stop] = args
        cleanKey(key)
        const rows = db
          .prepare('SELECT value FROM list_store WHERE key = ? ORDER BY idx ASC')
          .all(key) as any[]
        updateLastAccessed(key)
        const list = rows.map((r) => r.value)
        const end = stop < 0 ? list.length + stop + 1 : stop + 1
        result = list.slice(start, end)
        break
      }
      case 'ltrim': {
        const [key, start, stop] = args
        cleanKey(key)
        const transaction = db.transaction(() => {
          updateLastAccessed(key)
          const rows = db
            .prepare('SELECT idx, value FROM list_store WHERE key = ? ORDER BY idx ASC')
            .all(key) as any[]
          const end = stop < 0 ? rows.length + stop + 1 : stop + 1
          const keep = rows.slice(start, end)
          const keepIndices = new Set(keep.map((k) => k.idx))
          const deleteItem = db.prepare('DELETE FROM list_store WHERE key = ? AND idx = ?')
          for (const row of rows) {
            if (!keepIndices.has(row.idx)) {
              deleteItem.run(key, row.idx)
            }
          }
        })
        transaction()
        result = 'OK'
        break
      }
      case 'scanStream': {
        const [options] = args
        const rows = db.prepare('SELECT key, expires_at FROM cache_store').all() as any[]
        const matchPattern = options?.match ? options.match.replace(/\*/g, '.*') : '.*'
        const regex = new RegExp(`^${matchPattern}$`)
        const keys: string[] = []
        for (const r of rows) {
          if (!isExpired(r.expires_at) && regex.test(r.key)) {
            keys.push(r.key)
          }
        }
        result = keys
        break
      }
      case 'sscanStream': {
        const [tagKey] = args
        cleanKey(tagKey)
        const rows = db.prepare('SELECT member FROM set_store WHERE key = ?').all(tagKey) as any[]
        updateLastAccessed(tagKey)
        result = rows.map((r) => r.member)
        break
      }
      case 'clear': {
        db.exec(
          'DELETE FROM cache_store; DELETE FROM set_store; DELETE FROM hash_store; DELETE FROM list_store;'
        )
        result = 'OK'
        break
      }
      case 'quit': {
        clearInterval(cleanupInterval)
        db.close()
        result = 'OK'
        break
      }
      default:
        throw new Error(`Unknown command: ${command}`)
    }
    if (parentPort) {
      parentPort.postMessage({ id, type: 'response', result, error: null })
    }
  } catch (error: any) {
    if (parentPort) {
      parentPort.postMessage({
        id,
        type: 'response',
        result: null,
        error: error.message || String(error),
      })
    }
  }
})
