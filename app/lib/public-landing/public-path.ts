import { isAppLocale } from "@/app/lib/i18n/config"

/**
 * The public exception covers locale roots, sign-in descendants, and the
 * anonymous Articles reading experience. Every other pathname remains protected
 * by default.
 */
export function isPublicLandingPathname(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean)
  const locale = segments[0]

  if (!isAppLocale(locale)) return false

  return (
    segments.length === 1 ||
    segments[1] === "sign-in" ||
    segments[1] === "articles"
  )
}
