// @repo/contract — shared Zod schemas and types
import { z } from 'zod'

export type { ZodSchema } from 'zod'

export const riskAssessmentSchema = z.object({})
export const complianceResultSchema = z.object({})
export const createWebhookSchema = z.object({
  url: z.string().url(),
  description: z.string().optional(),
  event_types: z.array(z.string().min(1)).nonempty(),
  department_id: z.string().optional(),
})

export type CreateWebhookData = z.infer<typeof createWebhookSchema>
export const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  description: z.string().optional(),
  event_types: z.array(z.string()).optional(),
  active: z.boolean().optional(),
})

export type UpdateWebhookData = z.infer<typeof updateWebhookSchema>
export const telemetryPushSchema = z.object({
  name: z.string().min(1),
  value: z.number(),
})

export type TelemetryPushData = z.infer<typeof telemetryPushSchema>
export const syncPlaybackSchema = z.object({
  idempotencyKey: z.string().min(1),
  actionType: z.enum(['create', 'update', 'delete']),
  payload: z.record(z.unknown()),
  departmentId: z.string().min(1),
})

export type SyncPlaybackData = z.infer<typeof syncPlaybackSchema>

export const safetyExportQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  dept: z.string().optional(),
  limit: z.coerce.number().int().positive().optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export type SafetyExportQuery = z.infer<typeof safetyExportQuerySchema>

export const exportQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  dept: z.string().optional(),
  limit: z.coerce.number().optional().default(100),
  offset: z.coerce.number().optional().default(0),
})

export type ExportQuery = z.infer<typeof exportQuerySchema>

export const scannerBadgeSchema = z.object({
  code: z.string().optional(),
  barcode: z.string().optional(),
  barcodeData: z.string().optional(),
  data: z.string().optional(),
  qr_code: z.string().optional(),
})
