import { z } from "zod"

export const CONTACT_REQUESTS_DEFAULT_PAGE_SIZE = 10
export const CONTACT_REQUESTS_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

export const contactRequestResponseSchema = z
  .object({
    id: z.number().int().optional(),
    email: z.string().email().max(254).optional(),
    name: z.string().max(100).optional(),
    message: z.string().max(5000).optional(),
    createdDate: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough()

export const contactRequestPageResponseSchema = z
  .object({
    content: z.array(contactRequestResponseSchema),
    pageable: z
      .object({
        pageNumber: z.number().int().nonnegative(),
        pageSize: z.number().int().positive(),
        offset: z.number().int().nonnegative(),
        paged: z.boolean(),
        unpaged: z.boolean(),
      })
      .passthrough(),
    last: z.boolean(),
    totalElements: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    size: z.number().int().positive(),
    number: z.number().int().nonnegative(),
    first: z.boolean(),
    numberOfElements: z.number().int().nonnegative(),
    empty: z.boolean(),
  })
  .passthrough()

export type ContactRequestResponse = z.infer<
  typeof contactRequestResponseSchema
>
