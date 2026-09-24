import { z } from "zod"

const quotaSchema = z.object({
  used: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative(),
})

const watchlistWorkspaceUsageSchema = z.object({
  workspaceId: z.number().int(),
  used: z.number().int().nonnegative(),
})

export const usageLimitsResponseSchema = z.object({
  workspace: quotaSchema,
  watchlist: z.object({
    limit: z.number().int().nonnegative(),
    workspaces: z.array(watchlistWorkspaceUsageSchema),
  }),
  conversationTurns: quotaSchema.extend({
    periodStartUtc: z.string().datetime({ offset: false }),
    resetAtUtc: z.string().datetime({ offset: false }),
  }),
  activeSchedules: quotaSchema,
})

export type UsageLimitsResponse = z.infer<typeof usageLimitsResponseSchema>
