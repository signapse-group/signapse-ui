import { getRequestLocale } from "@/app/lib/i18n/server"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import { Skeleton } from "@/components/ui/skeleton"
import { PublicArticlesShell } from "../public-articles-shell"

export default async function ArticleDetailLoading() {
  const locale = await getRequestLocale()
  const dictionary = await getDictionary(locale)
  const t = dictionary.articles

  return (
    <PublicArticlesShell dictionary={dictionary} locale={locale}>
      <article
        aria-busy="true"
        aria-label={t.loading}
        className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="mx-auto max-w-[72ch]">
          <Skeleton className="h-10 w-40" />
          <div className="mt-10 space-y-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="mt-12 space-y-4 border-t border-border/70 pt-10">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-11/12" />
            <Skeleton className="h-6 w-4/5" />
          </div>
        </div>
      </article>
    </PublicArticlesShell>
  )
}
