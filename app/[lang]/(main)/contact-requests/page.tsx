import { getContactRequests } from "@/app/api/contact-requests/action"
import type { BackendApiError } from "@/app/api/auth/action"
import type { ContactRequestPageData } from "@/app/lib/contact-requests/definitions"
import { CONTACT_REQUEST_READ_PERMISSION } from "@/app/lib/contact-requests/permissions"
import {
  parseContactRequestsQuery,
  type ContactRequestsQuery,
} from "@/app/lib/contact-requests/query"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { hasPermission } from "@/app/lib/permissions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { AccessDenied } from "@/components/access-denied"

import { ContactRequestsList } from "./contact-requests-list"

interface ContactRequestsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function getErrorStatus(error: unknown): number | undefined {
  if (!(error instanceof Error)) return undefined
  return (error as BackendApiError).status
}

export default async function ContactRequestsPage({
  searchParams,
}: ContactRequestsPageProps) {
  const dictionary = await getServerDictionary()
  const query = parseContactRequestsQuery(await searchParams)
  const permissions = await getCurrentPermissions()

  if (!hasPermission(permissions, CONTACT_REQUEST_READ_PERMISSION)) {
    return (
      <>
        <h1 className="sr-only">{dictionary.contactRequests.pageTitle}</h1>
        <AccessDenied
          title={dictionary.contactRequests.permissionDeniedTitle}
          description={dictionary.contactRequests.permissionDeniedDescription}
          permission={CONTACT_REQUEST_READ_PERMISSION}
        />
      </>
    )
  }

  let page: ContactRequestPageData
  try {
    page = await getContactRequests(query)
  } catch (error: unknown) {
    const status = getErrorStatus(error)
    if (status === 401 || status === 403) {
      return (
        <>
          <h1 className="sr-only">{dictionary.contactRequests.pageTitle}</h1>
          <AccessDenied
            title={dictionary.contactRequests.permissionDeniedTitle}
            description={dictionary.contactRequests.permissionDeniedDescription}
            permission={CONTACT_REQUEST_READ_PERMISSION}
          />
        </>
      )
    }

    return (
      <ContactRequestsPageContent
        page={null}
        query={query}
        errorDescription={dictionary.contactRequests.errorDescription}
        errorTitle={dictionary.contactRequests.errorTitle}
        pageTitle={dictionary.contactRequests.pageTitle}
        pageDescription={dictionary.contactRequests.description}
      />
    )
  }

  return (
    <ContactRequestsPageContent
      page={page}
      query={query}
      pageTitle={dictionary.contactRequests.pageTitle}
      pageDescription={dictionary.contactRequests.description}
    />
  )
}

function ContactRequestsPageContent({
  page,
  query,
  errorDescription,
  errorTitle,
  pageTitle,
  pageDescription,
}: {
  page: ContactRequestPageData | null
  query: ContactRequestsQuery
  errorDescription?: string
  errorTitle?: string
  pageTitle: string
  pageDescription: string
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <h1 className="sr-only">{pageTitle}</h1>
      <p className="text-sm text-muted-foreground">{pageDescription}</p>
      <ContactRequestsList
        page={page}
        query={query}
        errorDescription={errorDescription}
        errorTitle={errorTitle}
      />
    </div>
  )
}
