import { isAppLocale } from "@/app/lib/i18n/config"

export function isPublicAuthPathname(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean)

  return isAppLocale(segments[0]) && segments[1] === "sign-in"
}
