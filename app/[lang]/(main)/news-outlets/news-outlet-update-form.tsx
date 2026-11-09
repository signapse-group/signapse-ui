"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Clock3, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useSyncExternalStore } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { updateNewsOutlet } from "@/app/api/news-outlets/action"
import { useLocalization } from "@/app/lib/i18n/provider"
import { useLocalizedPath } from "@/components/localized-link"
import {
  NewsOutletResponse,
  UpdateNewsOutletRequest,
} from "@/app/lib/news-outlets/definitions"
import {
  AppFormShell,
  AppFormShellBody,
  AppFormShellFooter,
} from "@/components/app-form-shell"
import { AppTimeMetadata } from "@/components/app-time-metadata"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

import {
  getNewsOutletFormSchema,
  NewsOutletFormFields,
  NewsOutletFormValues,
} from "./news-outlet-form-fields"
import { NewsOutletDateTime } from "./news-outlet-date-time"

const subscribeClientReady = () => () => {}
const getClientReadySnapshot = () => true
const getServerReadySnapshot = () => false

interface NewsOutletUpdateFormProps {
  newsOutlet: NewsOutletResponse
}

function getInitialFormValues(
  newsOutlet: NewsOutletResponse
): NewsOutletFormValues {
  return {
    name: newsOutlet.name || "",
    homepageUrl: newsOutlet.homepageUrl || "",
    rssUrl: newsOutlet.rssUrl || "",
    description: newsOutlet.description || "",
    active: newsOutlet.active ?? true,
  }
}

export function NewsOutletUpdateForm({
  newsOutlet,
}: NewsOutletUpdateFormProps) {
  const router = useRouter()
  const { dictionary } = useLocalization()
  const newsOutletsPath = useLocalizedPath("/news-outlets")
  const newsOutletFormSchema = useMemo(
    () => getNewsOutletFormSchema(dictionary),
    [dictionary]
  )
  const initialFormValues = getInitialFormValues(newsOutlet)
  const form = useForm<NewsOutletFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(newsOutletFormSchema as any),
    defaultValues: initialFormValues,
  })

  const isSubmitting = form.formState.isSubmitting
  const isHydrated = useSyncExternalStore(
    subscribeClientReady,
    getClientReadySnapshot,
    getServerReadySnapshot
  )

  const isBusy = !isHydrated || isSubmitting

  async function onSubmit(data: NewsOutletFormValues) {
    const request: UpdateNewsOutletRequest = {
      name: data.name,
      homepageUrl: data.homepageUrl,
      active: data.active,
      rssUrl: data.rssUrl,
      description: data.description,
    }

    const result = await updateNewsOutlet(newsOutlet.id, request)

    if (result.success) {
      toast.success(dictionary.newsOutlets.updateSuccess)
      router.push(newsOutletsPath)
      router.refresh()
      return
    }

    toast.error(result.error || dictionary.newsOutlets.updateError)
  }

  return (
    <AppFormShell
      title={dictionary.newsOutlets.updateTitle}
      description={dictionary.newsOutlets.updateDescription}
      width="lg"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} aria-busy={isBusy}>
        <AppFormShellBody className="flex flex-col gap-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {dictionary.newsOutlets.createdAtLabel}
              </div>
              <p className="mt-2">
                <AppTimeMetadata icon={Clock3}>
                  <NewsOutletDateTime value={newsOutlet.createdDate} />
                </AppTimeMetadata>
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {dictionary.newsOutlets.updatedAtLabel}
              </div>
              <p className="mt-2">
                <AppTimeMetadata icon={RefreshCw}>
                  <NewsOutletDateTime value={newsOutlet.lastModifiedDate} />
                </AppTimeMetadata>
              </p>
            </div>
          </div>

          <NewsOutletFormFields control={form.control} isDisabled={isBusy} />
        </AppFormShellBody>

        <AppFormShellFooter className="sm:justify-start">
          <div className="flex gap-4">
            <Button disabled={isBusy} type="submit">
              {!isHydrated ? (
                <>
                  <Spinner data-icon="inline-start" />
                  {dictionary.common.loading}
                </>
              ) : isSubmitting ? (
                <>
                  <Spinner data-icon="inline-start" />
                  {dictionary.newsOutlets.saving}
                </>
              ) : (
                dictionary.newsOutlets.saveChanges
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => form.reset(initialFormValues)}
              disabled={isBusy}
            >
              {dictionary.common.cancel}
            </Button>
          </div>
        </AppFormShellFooter>
      </form>
    </AppFormShell>
  )
}
