import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

import {
  getPathLocale,
  LOCALE_HEADER,
  negotiateLocale,
  withLocalePath,
} from "@/app/lib/i18n/routing"
import {
  isDevAuthModeEnabled,
  isP0FixtureModeEnabled,
} from "@/app/lib/dev-auth-mode"
import { isPublicAuthPathname } from "@/app/lib/auth/public-path"

function getLocaleRedirect(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl
  const pathLocale = getPathLocale(pathname)
  const isApi = pathname.startsWith("/api") || pathname.startsWith("/trpc")

  if (!isApi && !pathLocale) {
    const locale = negotiateLocale(req.headers.get("accept-language"))
    const url = req.nextUrl.clone()
    url.pathname = withLocalePath(pathname, locale)
    return NextResponse.redirect(url)
  }

  return null
}

function withLocaleHeaders(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl
  const pathLocale = getPathLocale(pathname)
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set(
    LOCALE_HEADER,
    pathLocale ?? negotiateLocale(req.headers.get("accept-language"))
  )

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

async function fixtureProxy(req: NextRequest) {
  return getLocaleRedirect(req) ?? withLocaleHeaders(req)
}

function createAuthenticatedProxy() {
  return clerkMiddleware(async (auth, req) => {
    const localeRedirect = getLocaleRedirect(req)
    if (localeRedirect) {
      return localeRedirect
    }

    const { pathname } = req.nextUrl
    const pathLocale = getPathLocale(pathname)
    const isApi =
      req.nextUrl.pathname.startsWith("/api") ||
      req.nextUrl.pathname.startsWith("/trpc")

    if (!isDevAuthModeEnabled() && !isPublicAuthPathname(pathname)) {
      await auth.protect(
        isApi
          ? undefined
          : {
              unauthenticatedUrl: new URL(
                `/${pathLocale}/sign-in`,
                req.url
              ).toString(),
            }
      )
    }

    return withLocaleHeaders(req)
  })
}

export default isP0FixtureModeEnabled()
  ? fixtureProxy
  : createAuthenticatedProxy()

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}
