import { ClerkProvider } from "@clerk/nextjs"
import { enUS, viVN } from "@clerk/localizations"
import { notFound } from "next/navigation"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import NextTopLoader from "nextjs-toploader"
import type { Metadata } from "next"

import "../globals.css"

import { getDictionary, hasLocale } from "@/app/lib/i18n/dictionaries"
import { AppLocale, SUPPORTED_APP_LOCALES } from "@/app/lib/i18n/config"
import { isP0FixtureModeEnabled } from "@/app/lib/dev-auth-mode"
import { cn } from "@/lib/utils"
import { Providers } from "@/components/providers"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

const fontSans = Geist({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono",
})

const fontDisplay = Inter({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-display",
})

const clerkLocalizations: Record<AppLocale, typeof viVN> = {
  en: enUS,
  vi: viVN,
}

export const metadata: Metadata = {
  title: "Signapse - Market Intelligence Platform",
  description: "Real-time market data visualization and analysis",
  icons: {
    icon: "/favicon.svg",
  },
}

export async function generateStaticParams() {
  return SUPPORTED_APP_LOCALES.map((lang) => ({ lang }))
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ lang: string }>
}>) {
  const { lang } = await params

  if (!hasLocale(lang)) {
    notFound()
  }

  const dictionary = await getDictionary(lang)
  const p0FixtureMode = isP0FixtureModeEnabled()
  const appProviders = (
    <Providers locale={lang} dictionary={dictionary}>
      {children}
    </Providers>
  )

  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={cn(
        "h-screen antialiased",
        fontDisplay.variable,
        fontMono.variable,
        "font-sans",
        fontSans.variable
      )}
    >
      <body className="flex h-screen flex-col">
        <NextTopLoader color="var(--primary)" showSpinner={false} height={3} />
        {p0FixtureMode ? (
          appProviders
        ) : (
          <ClerkProvider localization={clerkLocalizations[lang]}>
            {appProviders}
          </ClerkProvider>
        )}
        {p0FixtureMode ? null : <SpeedInsights />}
        {p0FixtureMode ? null : <Analytics />}
      </body>
    </html>
  )
}
