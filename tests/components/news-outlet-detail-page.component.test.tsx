// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import type { ComponentProps, ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const routeMocks = vi.hoisted(() => ({
  dictionary: vi.fn(),
  getCurrentPermissions: vi.fn(),
  getNewsOutletById: vi.fn(),
  notFound: vi.fn(),
  permissions: [] as string[],
}))

vi.mock("next/navigation", () => ({ notFound: routeMocks.notFound }))
vi.mock("@/app/api/news-outlets/action", () => ({
  getNewsOutletById: routeMocks.getNewsOutletById,
}))
vi.mock("@/app/lib/i18n/server", () => ({
  getServerDictionary: routeMocks.dictionary,
}))
vi.mock("@/app/lib/permissions-server", () => ({
  getCurrentPermissions: routeMocks.getCurrentPermissions,
}))
vi.mock("@/components/localized-link", () => ({
  LocalizedLink: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))
vi.mock("@/app/[lang]/(main)/news-outlets/news-outlet-update-form", () => ({
  NewsOutletUpdateForm: ({ newsOutlet }: { newsOutlet: { name: string } }) => (
    <div data-testid="update-form">{newsOutlet.name}</div>
  ),
}))

import { LocalizationProvider } from "@/app/lib/i18n/provider"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import {
  NEWS_OUTLET_READ_PERMISSION,
  NEWS_OUTLET_UPDATE_PERMISSION,
} from "@/app/lib/news-outlets/permissions"
import NewsOutletDetailPage from "@/app/[lang]/(main)/news-outlets/[id]/page"

const newsOutlet = {
  id: 7,
  name: "Read-only source",
  description: null,
  homepageUrl: "news.example",
  rssUrl: null,
  active: true,
  createdDate: "2026-11-04T12:00:00Z",
}

function renderPage(node: ReactNode) {
  return render(
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
      {node}
    </LocalizationProvider>
  )
}

async function loadPage() {
  return NewsOutletDetailPage({
    params: Promise.resolve({ id: String(newsOutlet.id) }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  routeMocks.permissions = [NEWS_OUTLET_READ_PERMISSION]
  routeMocks.getCurrentPermissions.mockImplementation(
    async () => routeMocks.permissions
  )
  routeMocks.dictionary.mockResolvedValue(viDictionary)
  routeMocks.getNewsOutletById.mockResolvedValue(newsOutlet)
  routeMocks.notFound.mockImplementation(() => {
    throw new Error("NOT_FOUND")
  })
})

afterEach(cleanup)

describe("News Outlet detail route", () => {
  it("shows all details to a reader without update permission", async () => {
    renderPage(await loadPage())

    expect(
      screen.getByRole("heading", {
        name: viDictionary.newsOutlets.detailTitle,
      })
    ).toBeInTheDocument()
    expect(screen.getByText(newsOutlet.name)).toBeInTheDocument()
    expect(screen.getByText(newsOutlet.homepageUrl)).toBeInTheDocument()
    expect(
      screen.getByText(viDictionary.newsOutlets.enabled)
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", {
        name: viDictionary.newsOutlets.saveChanges,
      })
    ).not.toBeInTheDocument()
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    expect(routeMocks.getNewsOutletById).toHaveBeenCalledWith(newsOutlet.id)
  })

  it("shows the update form when read and update permissions are both present", async () => {
    routeMocks.permissions = [
      NEWS_OUTLET_READ_PERMISSION,
      NEWS_OUTLET_UPDATE_PERMISSION,
    ]

    renderPage(await loadPage())

    expect(screen.getByTestId("update-form")).toHaveTextContent(newsOutlet.name)
  })

  it("does not fetch detail data without read permission even when update is present", async () => {
    routeMocks.permissions = [NEWS_OUTLET_UPDATE_PERMISSION]

    renderPage(await loadPage())

    expect(
      screen.getByText(/Bạn không có quyền xem khu vực quản lý nguồn tin/)
    ).toBeInTheDocument()
    expect(routeMocks.getNewsOutletById).not.toHaveBeenCalled()
  })

  it("maps API 403 to access denied, 404 to not found, and lets load errors reach the error boundary", async () => {
    routeMocks.getNewsOutletById.mockRejectedValueOnce(
      Object.assign(new Error("Forbidden"), { status: 403 })
    )
    renderPage(await loadPage())
    expect(
      screen.getByText(/Bạn không có quyền xem khu vực quản lý nguồn tin/)
    ).toBeInTheDocument()

    routeMocks.getNewsOutletById.mockRejectedValueOnce(
      Object.assign(new Error("Missing"), { status: 404 })
    )
    await expect(loadPage()).rejects.toThrow("NOT_FOUND")
    expect(routeMocks.notFound).toHaveBeenCalledOnce()

    const loadError = Object.assign(new Error("Service unavailable"), {
      status: 503,
    })
    routeMocks.getNewsOutletById.mockRejectedValueOnce(loadError)
    await expect(loadPage()).rejects.toBe(loadError)
  })
})
