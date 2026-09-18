import { notFound } from "next/navigation"

import { getModerationFeedbackDetail } from "@/app/api/feedback/action"
import { getFeedbackErrorStatus } from "@/app/lib/feedback/errors"
import { FEEDBACK_READ_PERMISSION } from "@/app/lib/feedback/permissions"
import { mapFeedbackDetail } from "@/app/lib/feedback/mappers"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { hasPermission } from "@/app/lib/permissions"
import { AccessDenied } from "@/components/access-denied"

import { FeedbackDetailPage } from "../../feedback/feedback-detail"

interface FeedbackModerationDetailRouteProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function FeedbackModerationDetailRoute({
  params,
  searchParams,
}: FeedbackModerationDetailRouteProps) {
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

  const [{ id }, query] = await Promise.all([params, searchParams])
  const numericId = Number(id)
  if (!Number.isInteger(numericId) || numericId <= 0) {
    notFound()
  }
  const backQuery = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      value.forEach((item) => backQuery.append(key, item))
    } else if (value) {
      backQuery.set(key, value)
    }
  }
  const queryString = backQuery.toString()

  let record = null
  let initialError: string | undefined
  let initialErrorTitle: string | undefined
  try {
    const response = await getModerationFeedbackDetail(numericId)
    record = mapFeedbackDetail(response)
  } catch (error: unknown) {
    record = null
    const status = getFeedbackErrorStatus(error)
    if (status === 401 || status === 403) {
      initialErrorTitle = dictionary.feedback.detailAccessDeniedTitle
      initialError = dictionary.feedback.readDenied
    } else if (status === 404) {
      initialError = dictionary.feedback.missingDescription
    } else {
      initialErrorTitle = dictionary.feedback.detailLoadErrorTitle
      initialError = dictionary.feedback.detailLoadErrorDescription
    }
  }

  return (
    <FeedbackDetailPage
      record={record}
      moderation
      initialError={initialError}
      initialErrorTitle={initialErrorTitle}
      backHref={
        queryString ? `/feedback-submissions?${queryString}` : undefined
      }
    />
  )
}
