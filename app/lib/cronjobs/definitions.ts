import { z } from "zod"

export const CronjobScheduleStatusSchema = z.enum([
  "SCHEDULED",
  "PAUSED",
  "UNSCHEDULED",
])
export type CronjobScheduleStatus = z.infer<typeof CronjobScheduleStatusSchema>

export const CronjobExecutionStatusSchema = z.enum(["RUNNING", "NOT_RUNNING"])
export type CronjobExecutionStatus = z.infer<
  typeof CronjobExecutionStatusSchema
>

export const CronjobLatestResultSchema = z.enum(["SUCCESS", "FAILED"])
export type CronjobLatestResult = z.infer<typeof CronjobLatestResultSchema>

export const CronjobRequestSchema = z.object({
  expression: z.string().trim().min(1),
})
export type CronjobRequest = z.infer<typeof CronjobRequestSchema>

export const CronjobResponseSchema = z.object({
  id: z.number().int(),
  jobName: z.string(),
  jobGroup: z.string(),
  scheduleStatus: CronjobScheduleStatusSchema,
  executionStatus: CronjobExecutionStatusSchema,
  cronExpression: z.string(),
  description: z.string().nullable(),
  latestResult: CronjobLatestResultSchema.nullable(),
  lastExecutedTime: z.string().datetime({ offset: true }).nullable(),
  nextTriggeredTime: z.string().datetime({ offset: true }).nullable(),
})
export type CronjobResponse = z.infer<typeof CronjobResponseSchema>

export const CronjobPageResponseSchema = z
  .object({
    content: z.array(CronjobResponseSchema).optional(),
    pageable: z
      .object({
        pageNumber: z.number(),
        pageSize: z.number(),
        offset: z.number(),
        paged: z.boolean(),
        unpaged: z.boolean(),
      })
      .partial()
      .passthrough()
      .optional(),
    last: z.boolean().optional(),
    totalElements: z.number().optional(),
    totalPages: z.number().optional(),
    size: z.number().optional(),
    number: z.number().optional(),
    first: z.boolean().optional(),
    numberOfElements: z.number().optional(),
    empty: z.boolean().optional(),
  })
  .passthrough()

export type CronjobPageResponse = z.infer<typeof CronjobPageResponseSchema>

export type CronjobListResponse = CronjobResponse
