import * as z from "zod"

export const LanguageResponseSchema = z.object({
  id: z.number().int().optional(),
  isoCode: z.string().optional(),
  name: z.string().optional(),
})

export type LanguageResponse = z.infer<typeof LanguageResponseSchema>

export function isSelectableLanguage(
  language: LanguageResponse
): language is LanguageResponse & { isoCode: string } {
  return typeof language.isoCode === "string" && language.isoCode.trim() !== ""
}

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
