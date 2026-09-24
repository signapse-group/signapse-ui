import { z } from "zod"

const usageCountSchema = z.number().int().nonnegative()

const usageMetricSchema = z.object({
  used: usageCountSchema,
  limit: usageCountSchema,
})

export const usageLimitsResponseSchema = z.object({
  workspace: usageMetricSchema,
  watchlist: z.object({
    limit: usageCountSchema,
    workspaces: z.array(
      z.object({
        workspaceId: z.number().int(),
        used: usageCountSchema,
      })
    ),
  }),
  conversationTurns: z.object({
    used: usageCountSchema,
    limit: usageCountSchema,
    periodStartUtc: z.string(),
    resetAtUtc: z.string(),
  }),
  activeSchedules: usageMetricSchema,
})

export type UsageLimitsResponse = z.infer<typeof usageLimitsResponseSchema>
