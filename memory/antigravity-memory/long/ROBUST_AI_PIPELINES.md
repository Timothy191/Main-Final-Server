# Robust AI Pipelines & Node Graphs

When building production-ready AI pipelines and node-based LLM architectures (like Graph RAG), agents must adhere to professional system engineering standards. A prototype is not production-ready until these gaps are closed.

## 1. Non-Blocking I/O

**Never use synchronous file reading** (`fs.readFileSync`) or synchronous network calls within an AI orchestration flow.

- A Node.js backend handles concurrent requests on a single event loop. Synchronous calls block the entire thread, causing latency spikes for all users.
- **Standard**: Always use `fs.promises` (e.g. `await fs.promises.readFile()`) and execute concurrent node retrieval logic with `Promise.all()`.

## 2. Robust JSON Parsing (Markdown Stripping)

LLMs frequently wrap JSON responses in markdown code blocks (e.g., \`\`\`json ... \`\`\`), even when explicitly told to output pure JSON.

- Standard `JSON.parse()` will crash the entire pipeline if it encounters these wrappers.
- **Standard**: Always implement a stripping utility (e.g. `parseSafeJson`) that uses regex to remove leading/trailing markdown backticks before parsing, and provide a fallback default object to prevent unhandled promise rejections.

## 3. Full Waterfall Sentry Tracing

A single AI request spanning multiple nodes (Decision → Retrieve → Draft → Verify) must be fully observable in APM tools like Sentry.

- Simply appending tags to a parent span obscures which specific node failed or introduced latency.
- **Standard**: Wrap each logical node in a nested child span using `Sentry.startSpan`.
  - `name`: Set to `node: <function_name>`
  - `op`: Set to `gen_ai.graph_rag.node`
  - Append attributes specifically related to that node (e.g., `decision.needs_wiki`, `retrieval.context_length`).

## 4. Standardized Path Resolution

Relative pathing (e.g., `../../memory`) breaks depending on where the Turborepo dev server is booted or whether the code is executed in a serverless edge function.

- **Standard**: Always resolve paths dynamically using `process.cwd()` as the base anchor, combined with `path.resolve()` and defensive `try/catch` access checks to prevent crashes if a directory is missing in a built environment.
