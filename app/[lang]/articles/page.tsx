import Link from "next/link"
import { notFound } from "next/navigation"

import { getPublicBlogs } from "@/app/api/blogs/action"
import type { BlogPostListResponse } from "@/app/lib/blogs/definitions"
import { formatDateTime, formatNumber } from "@/app/lib/i18n/format"
import { isAppLocale, type AppLocale } from "@/app/lib/i18n/config"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import { withLocalePath } from "@/app/lib/i18n/routing"
import type { Page } from "@/app/lib/definitions"
import { PublicArticlesShell } from "./public-articles-shell"

type ArticlesPageProps = {
  params: Promise<{ lang: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function getPositiveInteger(
  value: string | string[] | undefined,
  fallback: number,
  maximum: number
): number {
  const candidate = Array.isArray(value) ? value[0] : value
  const parsed = Number.parseInt(candidate ?? "", 10)

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback
  }

  return Math.min(parsed, maximum)
}

function getPageUrl(locale: AppLocale, page: number, size: number): string {
  const query = new URLSearchParams()

  if (page > 1) {
    query.set("page", String(page))
  }

  if (size !== 10) {
    query.set("size", String(size))
  }

  const basePath = withLocalePath("/articles", locale)
  const queryString = query.toString()

  return queryString ? `${basePath}?${queryString}` : basePath
}

function getResultsSummary(
  template: string,
  page: Page<BlogPostListResponse>,
  locale: AppLocale
): string {
  const from =
    page.totalElements === 0 ? 0 : page.number * page.size + 1
  const to =
    page.totalElements === 0
      ? 0
      : page.number * page.size + page.numberOfElements

  return template
    .replace("{from}", formatNumber(from, locale))
    .replace("{to}", formatNumber(to, locale))
    .replace("{total}", formatNumber(page.totalElements, locale))
}

function ArticleCard({
  article,
  locale,
  publishedLabel,
  readLabel,
}: {
  article: BlogPostListResponse
  locale: AppLocale
  publishedLabel: string
  readLabel: string
}) {
  const href = withLocalePath(`/articles/${article.slug}`, locale)
  const date = article.publishedAt ?? article.createdDate

  return (
    <article
      aria-labelledby={`article-${article.id}`}
      className="flex min-h-64 flex-col justify-between rounded-xl border border-border/70 bg-card p-6 shadow-sm transition-colors hover:border-primary/50"
    >
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {publishedLabel}
        </p>
        <h2
          id={`article-${article.id}`}
          className="text-2xl font-semibold tracking-tight text-foreground"
        >
          <Link
            href={href}
            className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {article.title}
          </Link>
        </h2>
        {article.shortDescription ? (
          <p className="line-clamp-4 text-base leading-7 text-muted-foreground">
            {article.shortDescription}
          </p>
        ) : null}
      </div>

      <div className="mt-8 flex items-end justify-between gap-4 border-t border-border/60 pt-4 text-sm">
        <time
          dateTime={date}
          className="text-muted-foreground"
        >
          {formatDateTime(
            date,
            locale,
            { year: "numeric", month: "long", day: "numeric" }
          )}
        </time>
        <Link
          href={href}
          className="shrink-0 rounded-md font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {readLabel}
        </Link>
      </div>
    </article>
  )
}

function ArticlesPagination({
  locale,
  page,
  size,
  totalPages,
  previousLabel,
  nextLabel,
  paginationLabel,
}: {
  locale: AppLocale
  page: number
  size: number
  totalPages: number
  previousLabel: string
  nextLabel: string
  paginationLabel: string
}) {
  if (totalPages <= 1) {
    return null
  }

  const previousHref = getPageUrl(locale, page - 1, size)
  const nextHref = getPageUrl(locale, page + 1, size)
  const linkClassName =
    "inline-flex min-h-10 items-center rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  return (
    <nav
      aria-label={paginationLabel}
      className="mt-10 flex items-center justify-between gap-4"
    >
      {page > 1 ? (
        <Link href={previousHref} className={linkClassName}>
          {previousLabel}
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="inline-flex min-h-10 items-center rounded-md border border-border/50 px-4 py-2 text-sm text-muted-foreground/60"
        >
          {previousLabel}
        </span>
      )}
      <span className="text-sm text-muted-foreground">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={nextHref} className={linkClassName}>
          {nextLabel}
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="inline-flex min-h-10 items-center rounded-md border border-border/50 px-4 py-2 text-sm text-muted-foreground/60"
        >
          {nextLabel}
        </span>
      )}
    </nav>
  )
}

export default async function ArticlesPage({
  params,
  searchParams,
}: ArticlesPageProps) {
  const { lang } = await params

  if (!isAppLocale(lang)) {
    notFound()
  }

  const locale = lang
  const dictionary = await getDictionary(locale)
  const query = await searchParams
  const pageNumber = getPositiveInteger(query.page, 1, 10000)
  const pageSize = getPositiveInteger(query.size, 10, 100)
  const page = await getPublicBlogs(pageNumber - 1, pageSize)
  const t = dictionary.publicArticles

  return (
    <PublicArticlesShell dictionary={dictionary} locale={locale}>
      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <header className="max-w-3xl space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {t.navLabel}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {t.pageTitle}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            {t.pageDescription}
          </p>
        </header>

        {page.empty ? (
          <div
            role="status"
            className="mt-12 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center"
          >
            <h2 className="text-xl font-semibold">{t.emptyTitle}</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              {t.emptyDescription}
            </p>
          </div>
        ) : (
          <>
            <p className="mt-12 text-sm text-muted-foreground" aria-live="polite">
              {getResultsSummary(t.resultsSummary, page, locale)}
            </p>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              {page.content.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  locale={locale}
                  publishedLabel={t.published}
                  readLabel={t.readArticle}
                />
              ))}
            </div>
            <ArticlesPagination
              locale={locale}
              page={page.number + 1}
              size={page.size}
              totalPages={page.totalPages}
              previousLabel={t.previousPage}
              nextLabel={t.nextPage}
              paginationLabel={t.paginationLabel}
            />
          </>
        )}
      </section>
    </PublicArticlesShell>
  )
}
