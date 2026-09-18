import { getModerationFeedback } from "@/app/api/feedback/action"
import { getFeedbackErrorStatus } from "@/app/lib/feedback/errors"
import { FEEDBACK_READ_PERMISSION } from "@/app/lib/feedback/permissions"
import { mapFeedbackListItem } from "@/app/lib/feedback/mappers"
import { parseFeedbackModerationQuery } from "@/app/lib/feedback/query"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { hasPermission } from "@/app/lib/permissions"
import { AccessDenied } from "@/components/access-denied"

import { FeedbackQueuePage } from "./feedback-queue"

interface FeedbackSubmissionsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function FeedbackSubmissionsPage({
  searchParams,
}: FeedbackSubmissionsPageProps) {
  const permissions = await getCurrentPermissions()
  const dictionary = await getServerDictionary()
  if (!hasPermission(permissions, FEEDBACK_READ_PERMISSION)) {
    return (
      <AccessDenied
        description={dictionary.feedback.readDenied}
        permission={FEEDBACK_READ_PERMISSION}
      />
    )
  }

  const query = parseFeedbackModerationQuery(await searchParams)
  let response: Awaited<ReturnType<typeof getModerationFeedback>> | null = null
  let initialError: string | undefined
  let initialErrorTitle: string | undefined
  try {
    response = await getModerationFeedback(query)
  } catch (error: unknown) {
    response = null
    const status = getFeedbackErrorStatus(error)
    const accessDenied = status === 401 || status === 403
    initialError = accessDenied
      ? dictionary.feedback.readDenied
      : dictionary.feedback.queueErrorDescription
    initialErrorTitle = accessDenied
      ? dictionary.feedback.detailAccessDeniedTitle
      : undefined
  }

  return (
    <FeedbackQueuePage
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
