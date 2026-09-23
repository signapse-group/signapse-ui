import Link from "next/link"
import type { ReactNode } from "react"

import { SUPPORTED_APP_LOCALES, type AppLocale } from "@/app/lib/i18n/config"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { withLocalePath } from "@/app/lib/i18n/routing"
import { Logo } from "@/components/logo"

export function PublicArticlesShell({
  children,
  dictionary,
  locale,
  currentPath = "/articles",
  currentQuery,
}: {
  children: ReactNode
  dictionary: Dictionary
  locale: AppLocale
  currentPath?: string
  currentQuery?: string
}) {
  const t = dictionary.publicArticles
  const getLocalizedArticlesHref = (targetLocale: AppLocale) => {
    const basePath = withLocalePath(currentPath, targetLocale)
    return currentQuery ? basePath + "?" + currentQuery : basePath
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <a
        href="#articles-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:ring-2 focus:ring-ring"
      >
        {t.skipToContent}
      </a>

      <header className="border-b border-border/70 bg-background/95">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href={withLocalePath("/", locale)}
            aria-label={t.backToLanding}
            className="flex shrink-0 items-center gap-2 rounded-md font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Logo width={32} height={32} />
            <span>{dictionary.common.appName}</span>
          </Link>

          <nav
            aria-label={t.languageLabel}
            className="flex items-center gap-1 text-sm"
          >
            <Link
              href={withLocalePath("/articles", locale)}
              aria-current="page"
              className="rounded-md px-2 py-1.5 font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t.navLabel}
            </Link>
            <Link
              href={withLocalePath("/", locale)}
              className="hidden rounded-md px-2 py-1.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
            >
              {t.backToLanding}
            </Link>
            <span aria-hidden="true" className="text-border">
              /
            </span>
            <Link
              {SUPPORTED_APP_LOCALES.map((targetLocale) => (
                <Link
                  key={targetLocale}
                  href={getLocalizedArticlesHref(targetLocale)}
                  lang={targetLocale}
                  className="rounded-md px-2 py-1.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {targetLocale === "vi"
                    ? dictionary.landing.localeControl.vietnamese
                    : dictionary.landing.localeControl.english}
                </Link>
              ))}
          </nav>
        </div>
      </header>

      <main id="articles-main" tabIndex={-1}>
        {children}
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-muted-foreground sm:px-6 lg:px-8">
          {dictionary.common.appName} · {t.pageDescription}
        </div>
      </footer>
    </div>
  )
}
