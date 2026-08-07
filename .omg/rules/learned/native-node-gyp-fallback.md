---
name: native-node-gyp-fallback
description: Avoids native compiler dependency failures by falling back to compiled binaries executed via node child processes.
globs: '**/Cargo.toml'
---

# Native Node-Gyp Fallback

Neon / Native C++ bindings using `node-gyp` can fail during compilation in modern Node.js environments (e.g. Node 26+) due to missing dependencies like `nan` headers.

## Resolution

1. Avoid forcing node-gyp bindings when environments are heterogeneous.
2. Build a standalone Rust binary using `cargo build --release`.
3. Wrap execution in Node.js via `child_process.execSync` to run the compiled executable, delivering native performance with zero node-gyp dependencies.
