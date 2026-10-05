import { notFound, redirect } from "next/navigation"

import { hasLocale } from "@/app/lib/i18n/dictionaries"
import { withLocalePath } from "@/app/lib/i18n/routing"

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  if (!hasLocale(lang)) {
    notFound()
  }

  redirect(withLocalePath("/dashboard", lang))
}
