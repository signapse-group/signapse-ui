import { z } from "zod"

export const createNewsOutletRequestSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().nullable().optional(),
  homepageUrl: z.string().trim().min(1),
  rssUrl: z.string().trim().nullable().optional(),
  active: z.boolean().optional(),
})

export const updateNewsOutletRequestSchema = z.object({
  name: z.string().trim().min(1).nullable().optional(),
  description: z.string().trim().nullable().optional(),
  homepageUrl: z.string().trim().nullable().optional(),
  rssUrl: z.string().trim().nullable().optional(),
  active: z.boolean().nullable().optional(),
})

export type CreateNewsOutletRequest = z.infer<
  typeof createNewsOutletRequestSchema
>

export type UpdateNewsOutletRequest = z.infer<
  typeof updateNewsOutletRequestSchema
>

export interface NewsOutletResponse {
  id: number
  name: string
  description: string | null
  homepageUrl: string
  rssUrl: string | null
  active: boolean
  createdDate: string
  lastModifiedDate?: string
}

export interface NewsOutletListResponse {
  id: number
  name: string
  homepageUrl: string
  rssUrl: string | null
  active: boolean
  createdDate: string
}
