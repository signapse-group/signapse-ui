"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useRef, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import * as z from "zod"

import { createBlog } from "@/app/api/blogs/action"
import {
  BLOG_CONTENT_SCHEMA_VERSION,
  createEmptyBlogContent,
  isBlogContent,
  slugifyBlogTitle,
} from "@/app/lib/blogs/definitions"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { useLocalization } from "@/app/lib/i18n/provider"
import { useLocalizedPath } from "@/components/localized-link"
import {
  AppFormShell,
  AppFormShellBody,
  AppFormShellFooter,
} from "@/components/app-form-shell"
import {
  BlogAuthoringFields,
  type BlogAuthoringFormValues,
} from "../blog-authoring-fields"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

export function getCreateBlogSchema(dictionary: Dictionary) {
  return z.object({
    title: z
      .string()
      .trim()
      .min(1, dictionary.blogs.titleRequired)
      .max(255, dictionary.blogs.titleTooLong),
    slug: z
      .string()
      .trim()
      .min(1, dictionary.blogs.slugRequired)
      .max(255, dictionary.blogs.slugTooLong)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, dictionary.blogs.slugInvalid),
    shortDescription: z
      .string()
      .max(500, dictionary.blogs.shortDescriptionTooLong),
    content: z.custom<BlogAuthoringFormValues["content"]>(
      isBlogContent,
      dictionary.blogs.contentInvalid
    ),
  })
}

export type CreateBlogRequest = BlogAuthoringFormValues

export function CreateBlogForm() {
  const router = useRouter()
  const { dictionary } = useLocalization()
  const blogsPath = useLocalizedPath("/blogs")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const generatedSlugRef = useRef("")
  const createBlogSchema = useMemo(
    () => getCreateBlogSchema(dictionary),
    [dictionary]
  )
  const form = useForm<BlogAuthoringFormValues>({
    resolver: zodResolver(createBlogSchema as never),
    defaultValues: {
      title: "",
      slug: "",
      shortDescription: "",
      content: createEmptyBlogContent(),
    },
  })

  const titleValue = useWatch({ control: form.control, name: "title" })
  const slugValue = useWatch({ control: form.control, name: "slug" })

  useEffect(() => {
    const generatedSlug = slugifyBlogTitle(titleValue)
    if (
      generatedSlug &&
      (!slugValue || slugValue === generatedSlugRef.current)
    ) {
      form.setValue("slug", generatedSlug, { shouldValidate: true })
    }
    generatedSlugRef.current = generatedSlug
  }, [form, slugValue, titleValue])

  async function onSubmit(data: CreateBlogRequest) {
    setSubmitError(null)
    const result = await createBlog({
      title: data.title.trim(),
      slug: data.slug.trim(),
      shortDescription: data.shortDescription.trim(),
      content: data.content,
      contentSchemaVersion: BLOG_CONTENT_SCHEMA_VERSION,
    })

    if (result.success) {
      toast.success(dictionary.blogs.createSuccess)
      form.reset({
        title: "",
        slug: "",
        shortDescription: "",
        content: createEmptyBlogContent(),
      })
      router.push(blogsPath)
      router.refresh()
      return
    }

    setSubmitError(result.error || dictionary.blogs.createError)
  }

  return (
    <AppFormShell
      title={dictionary.blogs.createTitle}
      description={dictionary.blogs.createDescription}
      width="lg"
    >
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <AppFormShellBody>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">
              {dictionary.blogs.statusLabel}
            </span>
            <Badge variant="secondary">{dictionary.blogs.statuses.DRAFT}</Badge>
            <span className="text-sm text-muted-foreground">
              {dictionary.blogs.draftDescription}
            </span>
          </div>
          {submitError ? (
            <FieldError errors={[{ message: submitError }]} />
          ) : null}
          <BlogAuthoringFields
            control={form.control}
            slugDescription={dictionary.blogs.slugDescription}
          />
        </AppFormShellBody>

        <AppFormShellFooter>
          <div className="flex gap-4">
            <Button disabled={form.formState.isSubmitting} type="submit">
              {form.formState.isSubmitting ? (
                <>
                  <Spinner data-icon="inline-start" />
                  {dictionary.blogs.createPending}
                </>
              ) : (
                dictionary.blogs.createAction
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(blogsPath)}
            >
              {dictionary.common.cancel}
            </Button>
          </div>
        </AppFormShellFooter>
      </form>
    </AppFormShell>
  )
}
