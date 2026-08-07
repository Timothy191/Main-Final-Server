// tools/load-test.mjs
import { SQLiteCacheEngine } from '../packages/redis/dist/sqlite-client.js';
import Redis from 'ioredis';
import { unlinkSync, existsSync } from 'fs';

const ITERATIONS = 20000;
const CONCURRENCY = 50; // Simultaneous pipeline requests

const TEST_PAYLOAD = JSON.stringify({
  session_id: 'sess_f92b18aa72c845e1a12001',
  timestamp: Date.now(),
  user: {
    id: 'usr_812',
    name: 'Shift Supervisor',
    roles: ['operator', 'approver'],
    clearance: 'production-level-2'
  },
  meta: {
    node: 'control-room-node-4',
    uptime_seconds: 14029,
    active_alerts: ['temp_warn_tank_3']
  }
});

async function testValkey() {
  const client = new Redis({
    host: '127.0.0.1',
    port: 6379,
    maxRetriesPerRequest: 1,
    connectTimeout: 1000,
    lazyConnect: true
  });

  try {
    await client.connect();
    await client.ping();
  } catch (err) {
    console.log('⚠️  Valkey not running on localhost:6379, skipping Valkey load test.');
    await client.quit().catch(() => {});
    return null;
  }

  console.log(`🚀 Stress testing Valkey (TCP Port 6379) with ${ITERATIONS} items...`);
  const start = performance.now();

  // Run in chunks to simulate concurrent connections
  for (let i = 0; i < ITERATIONS; i += CONCURRENCY) {
    const promises = [];
    for (let c = 0; c < CONCURRENCY && (i + c) < ITERATIONS; c++) {
      const key = `valkey:load:${i + c}`;
      promises.push(
        client.set(key, TEST_PAYLOAD, 'EX', 120)
          .then(() => client.get(key))
      );
    }
    await Promise.all(promises);
  }

  const end = performance.now();
  await client.quit();
  return end - start;
}

async function testSQLite() {
  const dbPath = 'load-test.db';
  if (existsSync(dbPath)) {
    try { unlinkSync(dbPath); } catch {}
  }

  const client = new SQLiteCacheEngine(dbPath);
  console.log(`🚀 Stress testing SQLite WAL (Persistent In-Process) with ${ITERATIONS} items...`);
  const start = performance.now();

  for (let i = 0; i < ITERATIONS; i += CONCURRENCY) {
    const promises = [];
    for (let c = 0; c < CONCURRENCY && (i + c) < ITERATIONS; c++) {
      const key = `sqlite:load:${i + c}`;
      promises.push(
        client.set(key, TEST_PAYLOAD, 'EX', 120)
          .then(() => client.get(key))
      );
    }
    await Promise.all(promises);
  }

  const end = performance.now();
  await client.quit();

  if (existsSync(dbPath)) {
    try {
      unlinkSync(dbPath);
      if (existsSync(`${dbPath}-wal`)) unlinkSync(`${dbPath}-wal`);
      if (existsSync(`${dbPath}-shm`)) unlinkSync(`${dbPath}-shm`);
    } catch {}
  }
  return end - start;
}

async function run() {
  console.log('🏁 Starting Cache High-Load Verification & Performance Test...\n');
  
  const sqliteTime = await testSQLite();
  const valkeyTime = await testValkey();

  console.log('\n📈 Results:');
  console.log(`   SQLite WAL Time : ${sqliteTime.toFixed(2)} ms (${((ITERATIONS / sqliteTime) * 1000).toFixed(0)} ops/sec)`);
  if (valkeyTime) {
    console.log(`   Valkey daemon   : ${valkeyTime.toFixed(2)} ms (${((ITERATIONS / valkeyTime) * 1000).toFixed(0)} ops/sec)`);
    const diff = ((valkeyTime - sqliteTime) / valkeyTime) * 10000 / 100;
    if (diff > 0) {
      console.log(`   SQLite WAL is ${diff.toFixed(1)}% faster than Valkey under concurrent stress.`);
    } else {
      console.log(`   Valkey is ${Math.abs(diff).toFixed(1)}% faster than SQLite WAL under concurrent stress.`);
    }
  }
}

run().catch(console.error);
