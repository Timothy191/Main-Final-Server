# @repo/logger — Specification

Shared structured logging utility providing human-readable output in development and structured JSON output in production.

## 1. Overview & Architecture

`@repo/logger` ensures consistent log formatting across Next.js 16 server runtimes. Logs include ISO timestamps, severity levels, service names, and payload details.

- **Exported Subpaths:**
  - `.` (Server logger instance)
  - `./next` (`withLogging` route wrapper stub)

---

## 2. Exported Specification

### 2.1 Server Logger Interface

```typescript
export interface ServerLogger {
  info(msg: unknown, ...args: unknown[]): void
  warn(msg: unknown, ...args: unknown[]): void
  error(msg: unknown, ...args: unknown[]): void
  debug(msg: unknown, ...args: unknown[]): void
}
```

### 2.2 Output Modes

- **Development (`NODE_ENV !== 'production'`):** Human-readable console lines: `[INFO] Message ...args`
- **Production (`NODE_ENV === 'production'`):** Structured JSON stringified log entry:
  ```json
  {
    "timestamp": "2026-08-04T22:42:00.000Z",
    "level": "INFO",
    "service": "portal",
    "message": "User login success",
    "details": ["user_123"]
  }
  ```

---

## 3. Dependencies

- Zero external runtime dependencies.
