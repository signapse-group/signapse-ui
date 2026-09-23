import Link from "next/link"
import { notFound } from "next/navigation"
import { createStaticEditor, PlateStatic } from "platejs/static"

import { getPublicBlogBySlug, PublicBlogNotFoundError } from "@/app/api/blogs/action"
import { isBlogContent } from "@/app/lib/blogs/definitions"
import { formatDateTime } from "@/app/lib/i18n/format"
import { isAppLocale } from "@/app/lib/i18n/config"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import { withLocalePath } from "@/app/lib/i18n/routing"
import { BaseEditorKit } from "@/components/editor/editor-base-kit"
import { ImageElementStatic } from "@/components/ui/media-image-node-static"
import { PublicArticlesShell } from "../public-articles-shell"

type ArticleDetailPageProps = {
  params: Promise<{ lang: string; slug: string }>
}

function isNotFoundError(error: unknown): boolean {
  if (error instanceof PublicBlogNotFoundError) {
    return true
  }

  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: unknown }).status === 404
  )
}

function ArticleBody({
  content,
  fallbackLabel,
  noContentLabel,
}: {
  content: unknown
  fallbackLabel: string
  noContentLabel: string
}) {
  if (!isBlogContent(content) || content.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/20 px-5 py-6 text-muted-foreground">
        {noContentLabel}
      </p>
    )
  }

  const editor = createStaticEditor({
    plugins: BaseEditorKit,
    value: content,
    components: {
      img: (props) => (
        <ImageElementStatic {...props} fallbackLabel={fallbackLabel} />
      ),
    },
  })

  return (
    <div className="prose prose-neutral max-w-none dark:prose-invert">
      <PlateStatic editor={editor} />
    </div>
  )
}

export default async function ArticleDetailPage({
  params,
}: ArticleDetailPageProps) {
  const { lang, slug } = await params

  if (!isAppLocale(lang)) {
    notFound()
  }

  const locale = lang
  const dictionary = await getDictionary(locale)
  const t = dictionary.publicArticles

  let article

  try {
    article = await getPublicBlogBySlug(slug)
  } catch (error) {
    if (isNotFoundError(error)) {
      notFound()
    }

    throw error
  }

  const date = article.publishedAt ?? article.createdDate

  return (
    <PublicArticlesShell dictionary={dictionary} locale={locale}>
      <article className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-[72ch]">
          <Link
            href={withLocalePath("/articles", locale)}
            className="inline-flex min-h-10 items-center rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span aria-hidden="true" className="mr-2">
              ←
            </span>
            {t.detailBack}
          </Link>

          <header className="mt-10 space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {t.published}
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {article.title}
            </h1>
            {article.shortDescription ? (
              <p className="text-xl leading-8 text-muted-foreground">
                {article.shortDescription}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span>{t.publishedAt}</span>
              <time dateTime={date}>
                {formatDateTime(
                  date,
                  locale,
                  { year: "numeric", month: "long", day: "numeric" }
                )}
              </time>
            </div>
          </header>

          <section
            aria-labelledby="article-content-heading"
            className="mt-12 border-t border-border/70 pt-10"
          >
            <h2 id="article-content-heading" className="sr-only">
              {t.contentLabel}
            </h2>
            <ArticleBody
              content={article.content}
              fallbackLabel={t.imageUnavailable}
              noContentLabel={t.noContent}
            />
          </section>
        </div>
      </article>
    </PublicArticlesShell>
  )
}
