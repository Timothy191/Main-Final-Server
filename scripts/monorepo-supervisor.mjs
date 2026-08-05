#!/usr/bin/env node

/**
 * setup-recovery.mjs / monorepo-supervisor.mjs
 * Automated Dev/Prod Startup & Runtime Auto-Recovery System
 *
 * Implements Level 1 (Deterministic Auto-Repair) and Level 2 (AI Auto-Wake Trigger)
 * recovery loops to keep the monorepo application stable.
 */

import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

const PORT = process.env.PORT || '3000';
const LOG_DIR = path.join(REPO_ROOT, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app-runtime.log');
const STATE_FILE = path.join(REPO_ROOT, '.agent-recovery-state.json');
const MAX_RESTARTS = 3;

// Configure LLM agent execution
const AGENT_CMD_TEMPLATE = process.env.AGENT_CMD || 'agy --prompt "{prompt}" --yolo --non-interactive';

// Create directories
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Log streaming helper
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
function log(msg) {
  const timestamp = new Date().toISOString();
  const line = `[SUPERVISOR] [${timestamp}] ${msg}`;
  console.log(line);
  logStream.write(line + '\n');
}

// State Persistence
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    } catch (e) {
      log(`Failed to parse state file: ${e.message}`);
    }
  }
  return { restarts: 0, lastFailureReason: null, history: [] };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// Log Line Classification Regexes
const ERROR_RULES = [
  {
    name: 'Port Collision (EADDRINUSE)',
    pattern: /EADDRINUSE|address already in use|port.*already in use/i,
    action: 'port_kill',
  },
  {
    name: 'Missing Environment File/Keys',
    pattern: /missing.*env|env.*missing|Cannot read properties of undefined.*SUPABASE/i,
    action: 'env_repair',
  },
  {
    name: 'Missing Dependencies',
    pattern: /Cannot find module|Error: Cannot find module/i,
    action: 'install_deps',
  },
  {
    name: 'Stale Build / Compilation Cache',
    pattern: /compilation error|Turbopack cache|Webpack compile fail|Next build cache/i,
    action: 'clear_cache',
  },
];

// Level 1 Deterministic Recovery Implementation
function runPortKill() {
  log(`Executing Level 1 Auto-Repair: Port Collision detected on :${PORT}`);
  try {
    // Attempt port freeing using lsof/kill
    const stdout = execSync(`lsof -t -i :${PORT}`).toString().trim();
    if (stdout) {
      const pids = stdout.split('\n');
      for (const pid of pids) {
        log(`Killing process ${pid} occupying port :${PORT}`);
        process.kill(parseInt(pid, 10), 'SIGKILL');
      }
      log(`Port :${PORT} freed.`);
      return true;
    }
  } catch (e) {
    // Fallback: use fuser
    try {
      log(`lsof failed, trying fuser on :${PORT}...`);
      execSync(`fuser -k -n tcp ${PORT}`);
      log(`Port :${PORT} freed via fuser.`);
      return true;
    } catch (fuserErr) {
      log(`Failed to free port :${PORT}: ${fuserErr.message}`);
    }
  }
  return false;
}

function runEnvRepair() {
  log('Executing Level 1 Auto-Repair: Missing Environment Keys detected');
  const examplePath = path.join(REPO_ROOT, 'apps/portal/.env.example');
  const localPath = path.join(REPO_ROOT, 'apps/portal/.env.local');

  if (!fs.existsSync(localPath)) {
    if (fs.existsSync(examplePath)) {
      log(`Copying .env.example to .env.local...`);
      fs.copyFileSync(examplePath, localPath);
      return true;
    }
    log(`Warning: neither .env.example nor .env.local found.`);
    return false;
  }

  // If local env exists, audit for missing keys compared to example env
  if (fs.existsSync(examplePath)) {
    try {
      const exampleContent = fs.readFileSync(examplePath, 'utf8');
      const localContent = fs.readFileSync(localPath, 'utf8');

      const getKeys = (text) => {
        return text
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith('#'))
          .map((line) => line.split('=')[0].trim());
      };

      const exampleKeys = getKeys(exampleContent);
      const localKeys = new Set(getKeys(localContent));

      const missing = exampleKeys.filter((key) => !localKeys.has(key));

      if (missing.length > 0) {
        log(`Appending missing environment keys: ${missing.join(', ')}`);
        let appendStr = '\n# Auto-inserted by monorepo-supervisor\n';
        for (const key of missing) {
          appendStr += `${key}=placeholder-auto-stub\n`;
        }
        fs.appendFileSync(localPath, appendStr, 'utf8');
        return true;
      }
    } catch (e) {
      log(`Error auditing environment: ${e.message}`);
    }
  }
  return false;
}

function runInstallDeps() {
  log('Executing Level 1 Auto-Repair: Missing dependencies detected. Running pnpm install...');
  try {
    execSync('pnpm install --frozen-lockfile=false', { cwd: REPO_ROOT, stdio: 'inherit' });
    log('Dependencies reinstalled successfully.');
    return true;
  } catch (e) {
    log(`pnpm install failed: ${e.message}`);
    return false;
  }
}

function runClearCache() {
  log('Executing Level 1 Auto-Repair: Clearing compile caches...');
  const nextCache = path.join(REPO_ROOT, 'apps/portal/.next');
  const turboCache = path.join(REPO_ROOT, '.turbo/cache');

  if (fs.existsSync(nextCache)) {
    log(`Deleting .next/ build directory...`);
    fs.rmSync(nextCache, { recursive: true, force: true });
  }
  if (fs.existsSync(turboCache)) {
    log(`Deleting .turbo/cache/ directory...`);
    fs.rmSync(turboCache, { recursive: true, force: true });
  }
  log('Caches cleared.');
  return true;
}

function runLevel1Healing(actionType) {
  switch (actionType) {
    case 'port_kill':
      return runPortKill();
    case 'env_repair':
      return runEnvRepair();
    case 'install_deps':
      return runInstallDeps();
    case 'clear_cache':
      return runClearCache();
    default:
      return false;
  }
}

// Level 2 AI Auto-Wake (Headless LLM execution)
function runLevel2AutoWake(logTailLines) {
  log('Executing Level 2 Auto-Wake: Invoking AI CLI agent for auto-repair...');
  
  const promptText = `
Next.js monorepo application crash detected during dev/start.
Review the following terminal logs containing the crash traceback:

${logTailLines.join('\n')}

Task requirements:
1. Locate the failing source file(s) or configurations.
2. Fix/patch the broken logic or type errors.
3. Validate that 'pnpm build' or type-checks pass cleanly without warnings.
4. Report back once fully completed and resolved.
`.trim();

  // Construct command line
  const cmdString = AGENT_CMD_TEMPLATE.replace('{prompt}', promptText.replace(/"/g, '\\"'));
  log(`Spawning agent command: ${cmdString}`);

  try {
    // Execute the agent synchronously
    execSync(cmdString, { cwd: REPO_ROOT, stdio: 'inherit' });
    log('AI agent execution finished.');
    return true;
  } catch (e) {
    log(`AI agent invocation failed: ${e.message}`);
    return false;
  }
}

// Main supervisor process execution wrapper
function runApplication(taskType) {
  const state = loadState();
  if (state.restarts >= MAX_RESTARTS) {
    fail(`Safety Circuit Breaker: Max restart attempts (${MAX_RESTARTS}) reached. Exiting to prevent loop.`);
    fs.unlinkSync(STATE_FILE); // Reset counter on exit
    process.exit(1);
  }

  log(`Starting application process in [${taskType}] mode...`);
  
  const cmd = 'pnpm';
  const args = taskType === 'dev' ? ['dev'] : ['build', '&&', 'pnpm', 'start'];
  
  // Note: standard next dev or build spawn
  const isDev = taskType === 'dev';
  const spawnCmd = 'pnpm';
  const spawnArgs = isDev 
    ? ['--filter', 'portal', 'dev'] 
    : ['--filter', 'portal', 'build']; // Build first for start
    
  log(`Spawning: ${spawnCmd} ${spawnArgs.join(' ')}`);

  const child = spawn(spawnCmd, spawnArgs, {
    cwd: REPO_ROOT,
    env: { ...process.env, PORT, FORCE_COLOR: '1' },
    shell: true,
  });

  const logBuffer = [];
  
  const handleLogData = (data) => {
    const chunk = data.toString();
    process.stdout.write(chunk);
    logStream.write(chunk);

    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        logBuffer.push(line);
        if (logBuffer.length > 200) {
          logBuffer.shift();
        }
      }
    }
  };

  child.stdout.on('data', handleLogData);
  child.stderr.on('data', handleLogData);

  child.on('exit', (code) => {
    log(`Application process exited with code ${code}`);

    if (code === 0) {
      // If build completed and we want to start production
      if (!isDev && taskType === 'start') {
        log('Build successful. Starting production portal server...');
        const startChild = spawn('pnpm', ['--filter', 'portal', 'start'], {
          cwd: REPO_ROOT,
          env: { ...process.env, PORT, FORCE_COLOR: '1' },
          shell: true,
        });
        startChild.stdout.on('data', handleLogData);
        startChild.stderr.on('data', handleLogData);
        startChild.on('exit', (startCode) => {
          if (startCode !== 0) {
            handleCrash(taskType, logBuffer, 'Production server crash');
          }
        });
        return;
      }
      
      // Clean exit
      log('Application completed successfully.');
      state.restarts = 0;
      saveState(state);
      return;
    }

    // Process crashed
    handleCrash(taskType, logBuffer, `Exit code ${code}`);
  });
}

function handleCrash(taskType, logBuffer, reason) {
  const state = loadState();
  state.restarts++;
  state.lastFailureReason = reason;
  state.history.push({ timestamp: new Date().toISOString(), reason });
  saveState(state);

  log(`Process crash detected (Attempt ${state.restarts}/${MAX_RESTARTS}). Running diagnostics...`);

  // Run error classification
  let healed = false;
  const lastLogs = logBuffer.slice(-150);

  for (const rule of ERROR_RULES) {
    for (const logLine of lastLogs) {
      if (rule.pattern.test(logLine)) {
        log(`Classification Match: "${rule.name}" identified in logs.`);
        healed = runLevel1Healing(rule.action);
        if (healed) {
          log(`Level 1 healing: "${rule.name}" auto-repaired.`);
          break;
        }
      }
    }
    if (healed) break;
  }

  // If Level 1 healing didn't succeed, wake up the AI agent (Level 2)
  if (!healed) {
    log('Level 1 healing did not resolve the error (or no rule matched). Waking up AI agent...');
    healed = runLevel2AutoWake(lastLogs);
  }

  if (healed) {
    log('Self-healing/AI recovery reported success. Restarting application...');
    runApplication(taskType);
  } else {
    fail(`Self-healing systems exhausted. Recovery failed. Process logs persisted to ${LOG_FILE}.`);
    process.exit(1);
  }
}

function fail(msg) {
  const timestamp = new Date().toISOString();
  const line = `[SUPERVISOR] [FATAL] [${timestamp}] ${msg}`;
  console.error(line);
  logStream.write(line + '\n');
}

// Boot supervisor
const mode = process.argv[2] || 'dev';
if (mode !== 'dev' && mode !== 'start') {
  console.error('Usage: node scripts/monorepo-supervisor.mjs [dev|start]');
  process.exit(1);
}

runApplication(mode);
