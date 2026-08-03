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

/* ------------------------------------------------------------------ */
/*  Department Mutation Schemas                                        */
/* ------------------------------------------------------------------ */

// 1. Safety
export const reportSafetyIncidentSchema = z.object({
  departmentId: z.string().min(1),
  title: z.string().min(3),
  description: z.string().min(5),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  location: z.string().optional(),
  incidentDate: z.string().optional(),
  shiftType: z.enum(['day', 'night']).optional(),
  injuredParties: z.number().int().min(0).optional().default(0),
})
export type ReportSafetyIncidentInput = z.infer<typeof reportSafetyIncidentSchema>

export const updateIncidentStatusSchema = z.object({
  incidentId: z.string().min(1),
  status: z.enum(['open', 'under-investigation', 'resolved', 'closed']),
  comment: z.string().optional(),
})
export type UpdateIncidentStatusInput = z.infer<typeof updateIncidentStatusSchema>

export const assignCorrectiveActionSchema = z.object({
  incidentId: z.string().min(1),
  description: z.string().min(3),
  assignee: z.string().min(1),
  dueDate: z.string().optional(),
})
export type AssignCorrectiveActionInput = z.infer<typeof assignCorrectiveActionSchema>

// 2. Training
export const createCourseSchema = z.object({
  departmentId: z.string().min(1),
  title: z.string().min(3),
  code: z.string().min(2),
  description: z.string().optional(),
  validityMonths: z.number().int().positive().optional().default(24),
})
export type CreateCourseInput = z.infer<typeof createCourseSchema>

export const scheduleSessionSchema = z.object({
  courseId: z.string().min(1),
  sessionDate: z.string().min(1),
  instructor: z.string().min(1),
  maxCapacity: z.number().int().positive().optional().default(20),
  location: z.string().optional(),
})
export type ScheduleSessionInput = z.infer<typeof scheduleSessionSchema>

export const enrollEmployeeSchema = z.object({
  scheduleId: z.string().min(1),
  employeeId: z.string().min(1),
})
export type EnrollEmployeeInput = z.infer<typeof enrollEmployeeSchema>

export const issueCertificationSchema = z.object({
  employeeId: z.string().min(1),
  courseId: z.string().min(1),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
})
export type IssueCertificationInput = z.infer<typeof issueCertificationSchema>

// 3. Engineering
export const createWorkOrderSchema = z.object({
  departmentId: z.string().min(1),
  equipmentId: z.string().min(1),
  issueDescription: z.string().min(5),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
})
export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>

export const assignWorkOrderSchema = z.object({
  workOrderId: z.string().min(1),
  assigneeId: z.string().min(1),
})
export type AssignWorkOrderInput = z.infer<typeof assignWorkOrderSchema>

export const logRepairCompletionSchema = z.object({
  workOrderId: z.string().min(1),
  resolutionNotes: z.string().min(3),
  hoursSpent: z.number().positive().optional(),
})
export type LogRepairCompletionInput = z.infer<typeof logRepairCompletionSchema>

// 4. Production
export const startShiftSchema = z.object({
  departmentId: z.string().min(1),
  shiftType: z.enum(['day', 'night']),
  supervisorId: z.string().min(1),
})
export type StartShiftInput = z.infer<typeof startShiftSchema>

export const logProductionEntrySchema = z.object({
  shiftId: z.string().min(1),
  tonnage: z.number().positive(),
  materialType: z.string().min(1),
})
export type LogProductionEntryInput = z.infer<typeof logProductionEntrySchema>

export const recordDelaySchema = z.object({
  shiftId: z.string().min(1),
  reasonCode: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  notes: z.string().optional(),
})
export type RecordDelayInput = z.infer<typeof recordDelaySchema>

// 5. Logistics & Fleet
export const updateVehicleStatusSchema = z.object({
  vehicleId: z.string().min(1),
  status: z.enum(['active', 'in-maintenance', 'decommissioned']),
  note: z.string().optional(),
})
export type UpdateVehicleStatusInput = z.infer<typeof updateVehicleStatusSchema>

export const logFuelTransactionSchema = z.object({
  vehicleId: z.string().min(1),
  fuelType: z.string().min(1),
  liters: z.number().positive(),
  cost: z.number().nonnegative().optional(),
  odometer: z.number().nonnegative(),
})
export type LogFuelTransactionInput = z.infer<typeof logFuelTransactionSchema>

export const createDispatchSchema = z.object({
  vehicleId: z.string().min(1),
  driverId: z.string().min(1),
  destination: z.string().min(1),
})
export type CreateDispatchInput = z.infer<typeof createDispatchSchema>

// 6. Drilling
export const logDrillHoleSchema = z.object({
  blockId: z.string().min(1),
  rigId: z.string().min(1),
  depth: z.number().positive(),
  angle: z.number().optional().default(90),
  coordinates: z.string().optional(),
})
export type LogDrillHoleInput = z.infer<typeof logDrillHoleSchema>

export const updateRigStatusSchema = z.object({
  rigId: z.string().min(1),
  status: z.enum(['active', 'standby', 'maintenance']),
})
export type UpdateRigStatusInput = z.infer<typeof updateRigStatusSchema>

// 7. Environment
export const logManualReadingSchema = z.object({
  departmentId: z.string().min(1),
  readingType: z.enum(['dust', 'water', 'noise', 'emissions', 'weather']),
  value: z.number(),
  unit: z.string().min(1),
  location: z.string().optional(),
})
export type LogManualReadingInput = z.infer<typeof logManualReadingSchema>

export const triggerExceedanceSchema = z.object({
  readingId: z.string().min(1),
  notes: z.string().min(3),
})
export type TriggerExceedanceInput = z.infer<typeof triggerExceedanceSchema>

// 8. Geology
export const submitSurveyMeasurementSchema = z.object({
  departmentId: z.string().min(1),
  surveyType: z.enum(['topographic', 'grade', 'peg-out', 'volume', 'monitoring']),
  blockId: z.string().optional(),
  measurementValue: z.number().optional(),
  unit: z.string().optional(),
  location: z.string().optional(),
})
export type SubmitSurveyMeasurementInput = z.infer<typeof submitSurveyMeasurementSchema>

export const toggleMineBlockStatusSchema = z.object({
  blockId: z.string().min(1),
  active: z.boolean(),
})
export type ToggleMineBlockStatusInput = z.infer<typeof toggleMineBlockStatusSchema>

// 9. Satellite Monitoring
export const acknowledgeAlertSchema = z.object({
  alertId: z.string().min(1),
  comment: z.string().optional(),
})
export type AcknowledgeAlertInput = z.infer<typeof acknowledgeAlertSchema>
