"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import * as z from "zod"

import { updateBlog } from "@/app/api/blogs/action"
import {
  BLOG_CONTENT_SCHEMA_VERSION,
  createEmptyBlogContent,
  isBlogContent,
  type BlogPost,
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

export function getUpdateBlogSchema(dictionary: Dictionary) {
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

export type UpdateBlogRequest = BlogAuthoringFormValues

interface UpdateBlogFormProps {
  blog: BlogPost
}

export function UpdateBlogForm({ blog }: UpdateBlogFormProps) {
  const router = useRouter()
  const { dictionary } = useLocalization()
  const blogsPath = useLocalizedPath("/blogs")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [contentEditorKey, setContentEditorKey] = useState(0)
  const updateBlogSchema = useMemo(
    () => getUpdateBlogSchema(dictionary),
    [dictionary]
  )
  const initialFormValues: BlogAuthoringFormValues = {
    title: blog.title,
    slug: blog.slug,
    content: isBlogContent(blog.content)
      ? blog.content
      : createEmptyBlogContent(),
    shortDescription: blog.shortDescription ?? "",
  }
  const form = useForm<BlogAuthoringFormValues>({
    resolver: zodResolver(updateBlogSchema as never),
    defaultValues: initialFormValues,
  })
  const slugLocked = blog.status === "PUBLISHED" || blog.publishedAt !== null
  const unsupportedContent =
    blog.contentSchemaVersion !== BLOG_CONTENT_SCHEMA_VERSION

  async function onSubmit(data: UpdateBlogRequest) {
    setSubmitError(null)
    const result = await updateBlog(blog.id, {
      title: data.title.trim(),
      slug: data.slug.trim(),
      shortDescription: data.shortDescription.trim(),
      content: data.content,
      contentSchemaVersion: BLOG_CONTENT_SCHEMA_VERSION,
    })

    if (result.success) {
      toast.success(dictionary.blogs.updateSuccess)
      router.push(blogsPath)
      router.refresh()
      return
    }

    setSubmitError(result.error || dictionary.blogs.updateError)
  }

  function handleReset() {
    form.reset(initialFormValues)
    setContentEditorKey((current) => current + 1)
    setSubmitError(null)
  }

  return (
    <AppFormShell
      title={dictionary.blogs.updateTitle}
      description={dictionary.blogs.updateDescription}
      width="lg"
    >
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <AppFormShellBody>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">
              {dictionary.blogs.statusLabel}
            </span>
            <Badge
              variant={blog.status === "PUBLISHED" ? "default" : "secondary"}
            >
              {dictionary.blogs.statuses[blog.status]}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {blog.status === "PUBLISHED"
                ? dictionary.blogs.publishedDescription
                : dictionary.blogs.draftDescription}
            </span>
          </div>
          {slugLocked ? (
            <p className="mb-6 text-sm text-muted-foreground">
              {dictionary.blogs.slugLockedDescription}
            </p>
          ) : null}
          {unsupportedContent ? (
            <FieldError
              errors={[{ message: dictionary.blogs.unsupportedContent }]}
            />
          ) : null}
          {submitError ? (
            <FieldError errors={[{ message: submitError }]} />
          ) : null}
          <BlogAuthoringFields
            contentEditorKey={contentEditorKey}
            control={form.control}
            slugDescription={
              slugLocked
                ? dictionary.blogs.slugLockedDescription
                : dictionary.blogs.slugDescription
            }
            slugDisabled={slugLocked}
          />
        </AppFormShellBody>

        <AppFormShellFooter>
          <div className="flex gap-4">
            <Button
              disabled={form.formState.isSubmitting || unsupportedContent}
              type="submit"
            >
              {form.formState.isSubmitting ? (
                <>
                  <Spinner data-icon="inline-start" />
                  {dictionary.blogs.updatePending}
                </>
              ) : (
                dictionary.blogs.updateAction
              )}
            </Button>
            <Button type="button" variant="ghost" onClick={handleReset}>
              {dictionary.common.cancel}
            </Button>
          </div>
        </AppFormShellFooter>
      </form>
    </AppFormShell>
  )
}
