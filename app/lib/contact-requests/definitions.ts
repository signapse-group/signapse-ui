import { z } from "zod"

import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from "@/app/lib/pagination/query"

export const CONTACT_REQUESTS_DEFAULT_PAGE_SIZE = DEFAULT_PAGE_SIZE
export const CONTACT_REQUESTS_PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS

export const contactRequestResponseSchema = z
  .object({
    id: z.number().int().optional(),
    email: z.string().email().max(254).optional(),
    name: z.string().max(100).nullable(),
    message: z.string().max(5000).optional(),
    createdDate: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough()

export const contactRequestPageResponseSchema = z
  .object({
    content: z.array(contactRequestResponseSchema).optional(),
    pageable: z
      .object({
        pageNumber: z.number().int().optional(),
        pageSize: z.number().int().optional(),
        offset: z.number().int().optional(),
        paged: z.boolean().optional(),
        unpaged: z.boolean().optional(),
      })
      .passthrough()
      .optional(),
    last: z.boolean().optional(),
    totalElements: z.number().int().optional(),
    totalPages: z.number().int().optional(),
    size: z.number().int().optional(),
    number: z.number().int().optional(),
    first: z.boolean().optional(),
    numberOfElements: z.number().int().optional(),
    empty: z.boolean().optional(),
  })
  .passthrough()

export type ContactRequestPageResponse = z.infer<
  typeof contactRequestPageResponseSchema
>

export type ContactRequestPageData = ContactRequestPageResponse & {
  content: ContactRequestResponse[]
}

export type ContactRequestResponse = z.infer<
  typeof contactRequestResponseSchema
>
