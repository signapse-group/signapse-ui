import { getRequestLocale } from "@/app/lib/i18n/server"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import { Skeleton } from "@/components/ui/skeleton"
import { PublicArticlesShell } from "./public-articles-shell"

export default async function ArticlesLoading() {
  const locale = await getRequestLocale()
  const dictionary = await getDictionary(locale)
  const t = dictionary.articles

  return (
    <PublicArticlesShell dictionary={dictionary} locale={locale}>
      <section
        aria-busy="true"
        aria-label={t.loading}
        className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
      >
        <div className="max-w-3xl space-y-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-12 w-72 max-w-full" />
          <Skeleton className="h-6 w-full max-w-2xl" />
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-64 rounded-xl" />
          ))}
        </div>
      </section>
    </PublicArticlesShell>
  )
}
