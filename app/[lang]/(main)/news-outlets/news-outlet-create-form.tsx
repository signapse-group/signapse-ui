"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { createNewsOutlet } from "@/app/api/news-outlets/action"
import { useLocalization } from "@/app/lib/i18n/provider"
import { useLocalizedPath } from "@/components/localized-link"
import { CreateNewsOutletRequest } from "@/app/lib/news-outlets/definitions"
import {
  AppFormShell,
  AppFormShellBody,
  AppFormShellFooter,
} from "@/components/app-form-shell"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

import {
  getNewsOutletFormSchema,
  NewsOutletFormFields,
  NewsOutletFormValues,
} from "./news-outlet-form-fields"

const initialFormValues: NewsOutletFormValues = {
  name: "",
  homepageUrl: "",
  rssUrl: "",
  description: "",
  active: true,
}

export function NewsOutletCreateForm() {
  const router = useRouter()
  const { dictionary } = useLocalization()
  const newsOutletsPath = useLocalizedPath("/news-outlets")
  const newsOutletFormSchema = useMemo(
    () => getNewsOutletFormSchema(dictionary),
    [dictionary]
  )
  const form = useForm<NewsOutletFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(newsOutletFormSchema as any),
    defaultValues: initialFormValues,
  })

  const isSubmitting = form.formState.isSubmitting

  async function onSubmit(data: NewsOutletFormValues) {
    const request: CreateNewsOutletRequest = {
      name: data.name,
      homepageUrl: data.homepageUrl,
      active: data.active,
      ...(data.rssUrl ? { rssUrl: data.rssUrl } : {}),
      ...(data.description ? { description: data.description } : {}),
    }

    const result = await createNewsOutlet(request)

    if (result.success) {
      toast.success(dictionary.newsOutlets.createSuccess)
      router.push(newsOutletsPath)
      router.refresh()
      return
    }

    toast.error(result.error || dictionary.newsOutlets.createError)
  }

  return (
    <AppFormShell
      title={dictionary.newsOutlets.createTitle}
      description={dictionary.newsOutlets.createDescription}
      width="lg"
    >
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <AppFormShellBody className="flex flex-col gap-8">
          <NewsOutletFormFields
            control={form.control}
            isSubmitting={isSubmitting}
          />
        </AppFormShellBody>

        <AppFormShellFooter className="sm:justify-start">
          <div className="flex gap-4">
            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <>
                  <Spinner data-icon="inline-start" />
                  {dictionary.newsOutlets.createPending}
                </>
              ) : (
                dictionary.newsOutlets.createTitle
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => form.reset(initialFormValues)}
              disabled={isSubmitting}
            >
              {dictionary.common.cancel}
            </Button>
          </div>
        </AppFormShellFooter>
      </form>
    </AppFormShell>
  )
}
