import * as z from "zod"

export const LanguageResponseSchema = z.object({
  id: z.number().int(),
  isoCode: z.string(),
  name: z.string(),
})

export type LanguageResponse = z.infer<typeof LanguageResponseSchema>

export const LanguageCatalogResponseSchema = z.object({
  currentLanguage: z.string(),
  preferredLanguage: z.string().nullable(),
  languages: z.array(LanguageResponseSchema),
})

export type LanguageCatalogResponse = z.infer<
  typeof LanguageCatalogResponseSchema
>

export const UpdatePreferredLanguageRequestSchema = z.object({
  isoCode: z.string().trim().min(1),
})

export type UpdatePreferredLanguageRequest = z.infer<
  typeof UpdatePreferredLanguageRequestSchema
>
