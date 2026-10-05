import { SignIn } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

import { isDevAuthModeEnabled } from "@/app/lib/dev-auth-mode"
import { DEFAULT_APP_LOCALE } from "@/app/lib/i18n/config"
import { hasLocale } from "@/app/lib/i18n/dictionaries"
import { withLocalePath } from "@/app/lib/i18n/routing"

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const locale = hasLocale(lang) ? lang : DEFAULT_APP_LOCALE
  const dashboardHref = withLocalePath("/dashboard", locale)

  if (isDevAuthModeEnabled() || (await auth()).isAuthenticated) {
    redirect(dashboardHref)
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignIn
          fallbackRedirectUrl={dashboardHref}
          withSignUp={false}
          appearance={{ elements: { footerAction: { display: "none" } } }}
        />
      </div>
    </div>
  )
}
