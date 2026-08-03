# Agent Tracer Log

- [2026-06-05T14:51:46Z] Restored package to ensure system stability.

## [2026-07-06] Refactor and Simplify Errors package

- **Agent**: Antigravity
- **Purpose**: Fix Recommendation 3: Add unit tests, reduce complexity and remove constructor duplicated logic in `index.ts`.
- **Changes Made**:
  - `packages/errors/src/index.ts`: Extracted standard options parsing logic into the base class constructor. Removed duplicate options parsing and metadata parsing boilerplate in the subclasses.
  - `packages/errors/package.json` & `packages/errors/jest.config.js`: Integrated Jest unit test runner and `ts-jest` for package-level testing.
  - `packages/errors/src/index.test.ts`: Added unit tests verifying instantiation behavior and typeguards.
- **Context**: 15 unit tests pass successfully. Subclass constructors are now extremely lean and simple.

## [2026-08-03] Expand error API surface + preserve the meta/contract (5bebdb0 + follow-up fixes)

- **Agent**: Claude Code (glm-5.2)
- **Purpose**: (a) Backfill the tracer entry for commit `5bebdb0` (`feat(errors): expand error API surface, preserve existing contract`) which had no dated entry here. (b) Fix the contract regressions a branch review surfaced in that expansion.
- **Changes Made**:
  - **5bebdb0 (the expansion, backfilled here)**: `AppError` gained a 3-overload constructor `(message, code|options, statusCode?)` / `(options)` so subclasses can pass `AppErrorOptions`. Added subclasses `AuthError`, `ConflictError`, `WebFetchError`, `ServiceUnavailableError`, `DatabaseError`, `AIProviderError`, `ExternalServiceError`, `APIError`; codes `CONFLICT`, `SERVICE_UNAVAILABLE`, `DATABASE_ERROR`, `AI_PROVIDER_ERROR`, `EXTERNAL_SERVICE_ERROR`; guards `isValidationError`, `isAuthError`, `isNotFoundError`. `ForbiddenError`/`UnauthorizedError`/etc. gained an `options?` 2nd arg so callers can attach metadata. `ErrorCode` widened with `(string & {})` for open-ended codes.
  - **This turn's fixes (contract preservation)**:
    - **Meta-drop regression** (`ValidationError`, `ForbiddenError`): the expansion only promoted `meta`/`context`/`field`/`value` into `meta`, silently dropping other ad-hoc keys callers passed (e.g. `ValidationError('…', { issues })` → `meta = {}`; `ForbiddenError('…', { resource, action })` → `meta = undefined`). Fixed at the source: added `resolveMeta()` — explicit `meta`/`context` first, then every non-core option key merged in. `CORE_OPTION_KEYS = {code,message,status,statusCode,cause,meta,context}`. `field`/`value` are NOT core → they flow into `meta` naturally. `ValidationError` simplified to `{ ...options, code:'VALIDATION_ERROR' }`.
    - **`AppError.code` re-typed to `ErrorCode`** (was widened to `string`): restored the typed public surface so consumers narrowing `.code` keep `ErrorCode`. The `(string & {})` escape hatch still accepts unknown codes at construction.
    - `defaultStatus(code: ErrorCode)` + `Record<ErrorCode, number>` map restored.
  - **Tests**: added `ValidationError` issues/field-value-merge cases + `ForbiddenError` resource/action meta case. 15 → 18 tests, all pass.
- **Verification**: `pnpm --filter @repo/errors test` → 18 passed. `pnpm --filter @repo/errors type-check` clean.
- **Next Agent Notes**: (a) The contract is: any non-core key on `AppErrorOptions` becomes `meta`. Add new subclass options as named keys freely — they surface on `err.meta` automatically. Only `code/message/status/statusCode/cause/meta/context` are consumed by the constructor. (b) Keep `AppError.code` typed `ErrorCode` (open union) — do not widen back to `string`. (c) `NotFoundError`/`InternalError` keep their legacy `(resource/message, meta?)` signature (2nd arg IS meta, not options) — documented inline; do not "normalize" them to `AppErrorOptions` without migrating callers.
