import Link from "next/link"

import { getRequestLocale } from "@/app/lib/i18n/server"
import { getDictionary } from "@/app/lib/i18n/dictionaries"
import { withLocalePath } from "@/app/lib/i18n/routing"
import { PublicArticlesShell } from "../public-articles-shell"

export default async function ArticleNotFound() {
  const locale = await getRequestLocale()
  const dictionary = await getDictionary(locale)
  const t = dictionary.publicArticles

  return (
    <PublicArticlesShell dictionary={dictionary} locale={locale}>
      <section
        role="status"
        className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="max-w-2xl rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {t.navLabel}
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            {t.notFoundTitle}
          </h1>
          <p className="mt-4 leading-7 text-muted-foreground">
            {t.notFoundDescription}
          </p>
          <Link
            href={withLocalePath("/articles", locale)}
            className="mt-8 inline-flex min-h-10 items-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t.detailBack}
          </Link>
        </div>
      </section>
    </PublicArticlesShell>
  )
}
