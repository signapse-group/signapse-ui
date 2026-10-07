"use server"

import { fetchAuthenticated, type BackendApiError } from "@/app/api/auth/action"
import type { Page } from "@/app/lib/definitions"
import {
  contactRequestPageResponseSchema,
  type ContactRequestResponse,
} from "@/app/lib/contact-requests/definitions"
import { CONTACT_REQUEST_READ_PERMISSION } from "@/app/lib/contact-requests/permissions"
import { serializeContactRequestsQuery } from "@/app/lib/contact-requests/query"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { hasPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"

export async function getContactRequests(
  query: Parameters<typeof serializeContactRequestsQuery>[0]
): Promise<Page<ContactRequestResponse>> {
  const permissions = await getCurrentPermissions()
  if (!hasPermission(permissions, CONTACT_REQUEST_READ_PERMISSION)) {
    const dictionary = await getServerDictionary()
    const error = new Error(
      dictionary.contactRequests.permissionDeniedDescription
    ) as BackendApiError
    error.status = 403
    throw error
  }

  const response = await fetchAuthenticated<unknown>(
    `/contact-requests?${serializeContactRequestsQuery(query)}`
  )
  const parsed = contactRequestPageResponseSchema.safeParse(response)
  if (!parsed.success) {
    throw new Error("Invalid contact request page response")
  }

  return parsed.data
}
