import { notFound } from "next/navigation"

import { getPersonalFeedbackDetail } from "@/app/api/feedback/action"
import { getFeedbackErrorStatus } from "@/app/lib/feedback/errors"
import { mapFeedbackDetail } from "@/app/lib/feedback/mappers"
import { getServerDictionary } from "@/app/lib/i18n/server"

import { FeedbackDetailPage } from "../feedback-detail"

interface FeedbackDetailRouteProps {
  params: Promise<{ id: string }>
}

export default async function FeedbackDetailRoute({
  params,
}: FeedbackDetailRouteProps) {
  const { id } = await params
  const numericId = Number(id)
  if (!Number.isInteger(numericId) || numericId <= 0) {
    notFound()
  }

  let record = null
  let initialError: string | undefined
  let initialErrorTitle: string | undefined
  try {
    const response = await getPersonalFeedbackDetail(numericId)
    record = mapFeedbackDetail(response)
  } catch (error: unknown) {
    const dictionary = await getServerDictionary()
    const status = getFeedbackErrorStatus(error)
    if (status === 401 || status === 403) {
      initialErrorTitle = dictionary.feedback.detailAccessDeniedTitle
      initialError = dictionary.feedback.historyAccessDeniedDescription
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
      initialError={initialError}
      initialErrorTitle={initialErrorTitle}
    />
  )
}
