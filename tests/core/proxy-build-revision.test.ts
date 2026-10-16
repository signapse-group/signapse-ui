import { NextRequest, NextResponse } from "next/server"
import { NextFetchEvent } from "next/dist/server/web/spec-extension/fetch-event"
import { beforeEach, expect, it, vi } from "vitest"

const { authenticatedProxy } = vi.hoisted(() => ({
  authenticatedProxy: vi.fn(),
}))

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: () => authenticatedProxy,
}))
vi.mock("@/app/lib/dev-auth-mode", () => ({
  isP0FixtureModeEnabled: () => false,
  isDevAuthModeEnabled: () => false,
}))

import proxy from "@/proxy"

beforeEach(() => {
  authenticatedProxy.mockReturnValue(new NextResponse(null, { status: 401 }))
})

it("serves build identity without invoking the authentication provider", async () => {
  const request = new NextRequest(
    "https://dev-dashboard.signapse.cloud/api/build-revision"
  )
  const event = new NextFetchEvent({
    request,
    page: "/api/build-revision",
    context: undefined,
  })
  const response = await proxy(request, event)
  expect(response?.status).toBe(200)
  expect(response?.headers.get("x-middleware-next")).toBe("1")
  expect(authenticatedProxy).not.toHaveBeenCalled()
})

it.each([
  "/api/build-revision/extra",
  "/api/build-revision-evil",
  "/api/user",
  "/vi/dashboard",
  "/vi/sign-in",
])("retains the authentication middleware for %s", async (pathname) => {
  const request = new NextRequest(`https://dev-dashboard.signapse.cloud${pathname}`)
  const event = new NextFetchEvent({
    request,
    page: pathname,
    context: undefined,
  })
  const response = await proxy(request, event)
  expect(response?.status).toBe(401)
  expect(authenticatedProxy).toHaveBeenCalledWith(request, event)
})
