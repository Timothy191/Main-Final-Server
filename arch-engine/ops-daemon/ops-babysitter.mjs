import { execSync } from 'child_process';
import { resolve, join } from 'path';
import { symlinkSync, existsSync, readdirSync, writeFileSync, unlinkSync } from 'fs';

const ROOT = resolve(process.cwd());
const RUST_ENGINE = join(ROOT, 'arch-engine', 'rust-wiki-builder', 'target', 'release', 'rust-wiki-builder');
// Tracks whether a best-effort build was attempted this session so we don't
// retry `cargo build --release` on every 10s interval if it is missing.
const BUILD_FLAG = join(ROOT, '.babysitter_built');

let rustEngineWarned = false;

function ensureRustEngineBuilt() {
  // The release binary is normally built by scripts/dev.sh and
  // scripts/start-prod.sh before spawning this daemon. If it is missing here
  // we were started manually (or first boot skipped the build), so attempt a
  // best-effort local build once, then fall back to graceful no-op.
  if (!existsSync(RUST_ENGINE) && !existsSync(BUILD_FLAG)) {
    try {
      execSync('cargo build --release --manifest-path arch-engine/Cargo.toml', {
        cwd: ROOT,
        stdio: 'ignore',
      });
    } catch {
      // cargo not available or build failed — skip engine; keep daemon alive
      // for socket-symlink management.
    }
    try { writeFileSync(BUILD_FLAG, String(Date.now())); } catch {}
  }
}

function runRustEngine() {
  if (!existsSync(RUST_ENGINE)) {
    if (!rustEngineWarned) {
      console.warn('🤖 ops-babysitter: rust-wiki-builder binary not found — wiki generation skipped. Run `cargo build --release` in arch-engine/ to enable.');
      rustEngineWarned = true;
    }
    return;
  }
  try {
    execSync(RUST_ENGINE, { stdio: 'ignore' });
  } catch (err) {
    console.error('Ops Babysitter Rust Engine execution error:', err.message);
  }
}

function ensureSocketSymlinks() {
  try {
    const files = readdirSync('/tmp');
    files.forEach(file => {
      if (file.startsWith('datacloud-mcp-') && file.endsWith('-antigravityide.sock')) {
        const baseName = file.substring(0, file.length - '-antigravityide.sock'.length);
        const targetLink = `/tmp/${baseName}-vscode.sock`;
        const sourceSocket = `/tmp/${file}`;
        
        try {
          if (existsSync(targetLink)) {
            unlinkSync(targetLink);
          }
          symlinkSync(sourceSocket, targetLink);
        } catch (e) {
          // Ignore individual linking errors
        }
      }
    });
  } catch (err) {
    // Ignore folder read/write errors
  }
}

// Daemon loop
console.log('🤖 Ops Babysitter background daemon (Rust Engine backed) is active.');
ensureRustEngineBuilt(); // best-effort first-boot build of the release binary
setInterval(() => {
  runRustEngine();
  ensureSocketSymlinks();
}, 10000); // Update wiki stats & check socket symlinks every 10 seconds

// Run initial write instantly
runRustEngine();
ensureSocketSymlinks();
