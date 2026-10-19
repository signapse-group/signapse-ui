import { getPersonalFeedback } from "@/app/api/feedback/action"
import { getFeedbackErrorStatus } from "@/app/lib/feedback/errors"
import { mapFeedbackListItem } from "@/app/lib/feedback/mappers"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { parsePaginationQuery } from "@/app/lib/pagination/query"

import { FeedbackListPage } from "./feedback-list"

interface FeedbackPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function FeedbackPage({
  searchParams,
}: FeedbackPageProps) {
  const query = await searchParams
  const { page, size } = parsePaginationQuery(query)
  const dictionary = await getServerDictionary()

  let response: Awaited<ReturnType<typeof getPersonalFeedback>> | null = null
  let initialError: string | undefined
  let initialErrorTitle: string | undefined
  try {
    response = await getPersonalFeedback({ page, size })
  } catch (error: unknown) {
    response = null
    const status = getFeedbackErrorStatus(error)
    const accessDenied = status === 401 || status === 403
    initialError = accessDenied
      ? dictionary.feedback.historyAccessDeniedDescription
      : dictionary.feedback.historyErrorDescription
    initialErrorTitle = accessDenied
      ? dictionary.feedback.historyAccessDeniedTitle
      : undefined
  }

  return (
    <FeedbackListPage
      initialPage={
        response
          ? {
              ...response,
              content: response.content.map(mapFeedbackListItem),
            }
          : null
      }
      initialError={response ? undefined : initialError}
      initialErrorTitle={response ? undefined : initialErrorTitle}
    />
  )
}
