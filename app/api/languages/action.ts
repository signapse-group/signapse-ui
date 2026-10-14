"use server"

import { fetchAuthenticated } from "@/app/api/auth/action"
import { LanguageCatalogResponseSchema } from "@/app/lib/languages/definitions"

export async function getLanguages() {
  const response = await fetchAuthenticated<unknown>("/languages")

  return LanguageCatalogResponseSchema.parse(response)
}
