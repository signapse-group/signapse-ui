import { ArrowLeft } from "lucide-react"
import { LocalizedLink as Link } from "@/components/localized-link"
import { notFound } from "next/navigation"

import { getNewsOutletById } from "@/app/api/news-outlets/action"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { hasPermission } from "@/app/lib/permissions"
import {
  NEWS_OUTLET_READ_PERMISSION,
  NEWS_OUTLET_UPDATE_PERMISSION,
} from "@/app/lib/news-outlets/permissions"
import type { NewsOutletResponse } from "@/app/lib/news-outlets/definitions"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { AccessDenied } from "@/components/access-denied"
import { AppFormShell, AppFormShellBody } from "@/components/app-form-shell"
import { buttonVariants } from "@/components/ui/button"

import { NewsOutletUpdateForm } from "../news-outlet-update-form"

interface EditNewsOutletPageProps {
  params: Promise<{ id: string }>
}

export default async function EditNewsOutletPage({
  params,
}: EditNewsOutletPageProps) {
  const [permissions, dictionary] = await Promise.all([
    getCurrentPermissions(),
    getServerDictionary(),
  ])

  if (!hasPermission(permissions, NEWS_OUTLET_READ_PERMISSION)) {
    return (
      <AccessDenied
        description={dictionary.newsOutlets.readDenied}
        permission={NEWS_OUTLET_READ_PERMISSION}
      />
    )
  }

  const { id } = await params
  const newsOutletId = Number(id)
  if (!Number.isSafeInteger(newsOutletId) || newsOutletId < 1) {
    notFound()
  }

  let newsOutlet: NewsOutletResponse
  try {
    newsOutlet = await getNewsOutletById(newsOutletId)
  } catch (error) {
    const status =
      error instanceof Error &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : undefined

    if (status === 404) {
      notFound()
    }
    if (status === 403) {
      return (
        <AccessDenied
          description={dictionary.newsOutlets.readDenied}
          permission={NEWS_OUTLET_READ_PERMISSION}
        />
      )
    }

    throw error
  }

  if (!newsOutlet) {
    notFound()
  }

  const canUpdate = hasPermission(permissions, NEWS_OUTLET_UPDATE_PERMISSION)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center">
        <Link
          href="/news-outlets"
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          <ArrowLeft data-icon="inline-start" />
          {dictionary.common.back}
        </Link>
      </div>

      {canUpdate ? (
        <NewsOutletUpdateForm newsOutlet={newsOutlet} />
      ) : (
        <NewsOutletReadOnlyDetails
          dictionary={dictionary}
          newsOutlet={newsOutlet}
        />
      )}
    </div>
  )
}

function NewsOutletReadOnlyDetails({
  dictionary,
  newsOutlet,
}: {
  dictionary: Dictionary
  newsOutlet: NewsOutletResponse
}) {
  return (
    <AppFormShell title={dictionary.newsOutlets.detailTitle} width="lg">
      <AppFormShellBody>
        <dl className="grid min-w-0 gap-5 sm:grid-cols-2">
          <NewsOutletDetailField
            label={dictionary.newsOutlets.nameLabel}
            value={newsOutlet.name}
          />
          <NewsOutletDetailField
            label={dictionary.newsOutlets.homepageLabel}
            value={newsOutlet.homepageUrl}
          />
          <NewsOutletDetailField
            label={dictionary.newsOutlets.rssLabel}
            value={newsOutlet.rssUrl || dictionary.common.notAvailable}
          />
          <NewsOutletDetailField
            className="sm:col-span-2"
            label={dictionary.newsOutlets.descriptionLabel}
            value={newsOutlet.description || dictionary.common.notAvailable}
          />
          <NewsOutletDetailField
            label={dictionary.newsOutlets.statusLabel}
            value={
              newsOutlet.active
                ? dictionary.newsOutlets.enabled
                : dictionary.newsOutlets.paused
            }
          />
        </dl>
      </AppFormShellBody>
    </AppFormShell>
  )
}

function NewsOutletDetailField({
  className,
  label,
  value,
}: {
  className?: string
  label: string
  value: string
}) {
  return (
    <div className={className}>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="m-0 text-sm break-all whitespace-pre-wrap">{value}</dd>
    </div>
  )
}
