import { formatDateTime } from "@/app/lib/i18n/format"
import type { AppLocale } from "@/app/lib/i18n/config"

const NEWS_ARTICLE_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
}

export function formatNewsArticleDateTime(
  value: string | null | undefined,
  locale: AppLocale,
  timeZone: string,
  fallback: string
) {
  if (!value) return fallback

  return formatDateTime(
    value,
    locale,
    { ...NEWS_ARTICLE_DATE_TIME_OPTIONS, timeZone },
    fallback
  )
}
