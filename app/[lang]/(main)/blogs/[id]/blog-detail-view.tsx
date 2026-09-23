"use client"

import { ArrowLeft } from "lucide-react"

import {
  createEmptyBlogContent,
  isBlogContent,
  type BlogPost,
} from "@/app/lib/blogs/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import {
  AppFormShell,
  AppFormShellBody,
  AppFormShellFooter,
} from "@/components/app-form-shell"
import { PlateEditor } from "@/components/editor/plate-editor"
import { LocalizedLink } from "@/components/localized-link"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"

interface BlogDetailViewProps {
  blog: BlogPost
  returnTo: string
}

export function BlogDetailView({ blog, returnTo }: BlogDetailViewProps) {
  const { dictionary, formatDateTime } = useLocalization()
  const content = isBlogContent(blog.content)
    ? blog.content
    : createEmptyBlogContent()

  return (
    <AppFormShell
      title={dictionary.blogs.detailTitle}
      description={dictionary.blogs.detailDescription}
      width="lg"
    >
      <AppFormShellBody>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">
            {dictionary.blogs.statusLabel}
          </span>
          <Badge
            variant={blog.status === "PUBLISHED" ? "default" : "secondary"}
          >
            {dictionary.blogs.statuses[blog.status]}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {dictionary.blogs.statusDescriptions[blog.status]}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            {blog.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {blog.shortDescription || dictionary.blogs.noShortDescription}
          </p>
        </div>

        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">
              {dictionary.blogs.createdAt}
            </dt>
            <dd>
              {formatDateTime(
                blog.createdDate,
                { year: "numeric", month: "2-digit", day: "2-digit" },
                dictionary.common.notAvailable
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">
              {dictionary.blogs.publishedAt}
            </dt>
            <dd>
              {formatDateTime(
                blog.publishedAt,
                { year: "numeric", month: "2-digit", day: "2-digit" },
                dictionary.common.notAvailable
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">
              {dictionary.blogs.lastModifiedAt}
            </dt>
            <dd>
              {formatDateTime(
                blog.lastModifiedDate,
                { year: "numeric", month: "2-digit", day: "2-digit" },
                dictionary.common.notAvailable
              )}
            </dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-col gap-3">
          <h3 className="text-sm font-medium">
            {dictionary.blogs.contentLabel}
          </h3>
          <div className="min-h-80 overflow-hidden rounded-md border border-input bg-background">
            {content.length > 0 ? (
              <PlateEditor
                editorId={`blog-detail-${blog.id}`}
                initialValue={content}
                mode="blog"
                readOnly
              />
            ) : (
              <p className="p-6 text-sm text-muted-foreground">
                {dictionary.blogs.noContent}
              </p>
            )}
          </div>
        </div>
      </AppFormShellBody>

      <AppFormShellFooter>
        <LocalizedLink
          href={returnTo}
          className={buttonVariants({ variant: "outline" })}
        >
          <ArrowLeft data-icon="inline-start" />
          {dictionary.blogs.backToList}
        </LocalizedLink>
      </AppFormShellFooter>
    </AppFormShell>
  )
}
