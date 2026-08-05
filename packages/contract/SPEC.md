# @repo/contract — Specification

Shared Zod validation schemas, infer types, domain payload specifications, and HTTP request validation wrappers.

## 1. Overview & Architecture

`@repo/contract` provides runtime validation and static TypeScript types across all application boundaries (Next.js 16 Server Actions, Route Handlers, and Inngest background workers).

- **Exported Subpaths:**
  - `.` (Main entry: Zod schemas and infer types)
  - `./validation` (`withValidation` Web API Request middleware)

---

## 2. Exported Specification

### 2.1 Core Schemas & Infer Types

| Schema Name               | Infer Type          | Description                                                                    |
| :------------------------ | :------------------ | :----------------------------------------------------------------------------- |
| `createWebhookSchema`     | `CreateWebhookData` | Validates webhook creation input (`url`, `event_types`, `department_id`)       |
| `updateWebhookSchema`     | `UpdateWebhookData` | Validates webhook patch updates                                                |
| `telemetryPushSchema`     | `TelemetryPushData` | Machine telemetry push payload                                                 |
| `syncPlaybackSchema`      | `SyncPlaybackData`  | Idempotent sync event replay payload                                           |
| `safetyExportQuerySchema` | `SafetyExportQuery` | Query parameters for safety report exports                                     |
| `exportQuerySchema`       | `ExportQuery`       | General data export query parameters (`from`, `to`, `dept`, `limit`, `offset`) |
| `scannerBadgeSchema`      | -                   | Barcode and QR code scanner input parser                                       |

### 2.2 Department Mutation Schemas

- **Safety:** `reportSafetyIncidentSchema`, `updateIncidentStatusSchema`, `assignCorrectiveActionSchema`
- **Training:** `createCourseSchema`, `scheduleSessionSchema`, `enrollEmployeeSchema`, `issueCertificationSchema`
- **Engineering:** `createWorkOrderSchema`, `assignWorkOrderSchema`, `logRepairCompletionSchema`
- **Production:** `startShiftSchema`, `logProductionEntrySchema`, `recordDelaySchema`
- **Logistics & Fleet:** `updateVehicleStatusSchema`, `logFuelTransactionSchema`, `createDispatchSchema`
- **Drilling:** `logDrillHoleSchema`, `updateRigStatusSchema`
- **Environment:** `logManualReadingSchema`, `triggerExceedanceSchema`
- **Geology:** `submitSurveyMeasurementSchema`, `toggleMineBlockStatusSchema`
- **Satellite Monitoring:** `acknowledgeAlertSchema`

### 2.3 Validation Middleware (`./validation`)

```typescript
export function withValidation<T extends z.ZodTypeAny>(
  schema: T,
  handler: (req: Request, data: z.infer<T>) => Promise<Response>
): (req: Request, _context?: unknown) => Promise<Response>
```

Framework-agnostic Web API handler wrapper. Validates `req.json()` against `schema`. Returns HTTP 400 with issue details on failure.

---

## 3. Dependencies

- `dependencies`: `zod` (`^3.24.0`)
- `devDependencies`: `jest`, `@swc/jest`, `@types/jest`
