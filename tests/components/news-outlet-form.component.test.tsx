// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createNewsOutlet: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
  updateNewsOutlet: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}))
vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}))
vi.mock("@/app/api/news-outlets/action", () => ({
  createNewsOutlet: mocks.createNewsOutlet,
  updateNewsOutlet: mocks.updateNewsOutlet,
}))
vi.mock("@/components/localized-link", () => ({
  useLocalizedPath: (path: string) => `/vi${path}`,
}))

import { LocalizationProvider } from "@/app/lib/i18n/provider"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { NewsOutletCreateForm } from "@/app/[lang]/(main)/news-outlets/news-outlet-create-form"
import { NewsOutletUpdateForm } from "@/app/[lang]/(main)/news-outlets/news-outlet-update-form"
import { getNewsOutletFormSchema } from "@/app/[lang]/(main)/news-outlets/news-outlet-form-fields"

const newsOutlet = {
  id: 7,
  name: "Example source",
  description: "Current description",
  homepageUrl: "example.com",
  rssUrl: "example.com/feed.xml",
  active: true,
  createdDate: "2026-11-04T12:00:00Z",
}

function renderForm(form: ReactNode) {
  return render(
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
      {form}
    </LocalizationProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.createNewsOutlet.mockResolvedValue({
    success: false,
    error: "Homepage already exists",
  })
  mocks.updateNewsOutlet.mockResolvedValue({
    success: false,
    error: "Forbidden",
  })
})

afterEach(cleanup)

describe("News Outlet form contract", () => {
  it("only validates required trimmed name and homepage and accepts long or non-HTTP values", () => {
    const result = getNewsOutletFormSchema(viDictionary).safeParse({
      name: ` ${"N".repeat(300)} `,
      homepageUrl: " ftp://source.example ",
      rssUrl: "not a URL",
      description: "x".repeat(1001),
      active: true,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe("N".repeat(300))
      expect(result.data.homepageUrl).toBe("ftp://source.example")
    }

    const invalid = getNewsOutletFormSchema(viDictionary).safeParse({
      name: "  ",
      homepageUrl: "  ",
      rssUrl: "",
      description: "",
      active: true,
    })
    expect(invalid.success).toBe(false)
    if (!invalid.success) {
      expect(invalid.error.issues.map((issue) => issue.message)).toEqual([
        viDictionary.newsOutlets.nameRequired,
        viDictionary.newsOutlets.homepageRequired,
      ])
    }
  })

  it("trims create fields, omits blank optional values, and keeps the form on a duplicate error", async () => {
    const user = userEvent.setup()
    renderForm(<NewsOutletCreateForm />)

    const name = screen.getByLabelText(/Tên nguồn tin/)
    const homepage = screen.getByLabelText(/URL trang chủ/)
    await user.type(name, "  Example source  ")
    await user.type(homepage, "  custom:homepage  ")
    await user.click(
      screen.getByRole("button", {
        name: viDictionary.newsOutlets.createTitle,
      })
    )

    expect(mocks.createNewsOutlet).toHaveBeenCalledWith({
      name: "Example source",
      homepageUrl: "custom:homepage",
      active: true,
    })
    expect(name).toHaveValue("  Example source  ")
    expect(homepage).toHaveValue("  custom:homepage  ")
    expect(mocks.toastError).toHaveBeenCalledWith("Homepage already exists")
    expect(mocks.toastSuccess).not.toHaveBeenCalled()
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it("sends blank update optionals to clear them and preserves draft values after 403", async () => {
    const user = userEvent.setup()
    renderForm(<NewsOutletUpdateForm newsOutlet={newsOutlet} />)

    const rss = screen.getByLabelText(/URL RSS/)
    const description = screen.getByLabelText(/^Mô tả/)
    await user.clear(rss)
    await user.clear(description)
    await user.click(
      screen.getByRole("button", {
        name: viDictionary.newsOutlets.saveChanges,
      })
    )

    expect(mocks.updateNewsOutlet).toHaveBeenCalledWith(newsOutlet.id, {
      name: newsOutlet.name,
      homepageUrl: newsOutlet.homepageUrl,
      active: true,
      rssUrl: "",
      description: "",
    })
    expect(rss).toHaveValue("")
    expect(description).toHaveValue("")
    expect(mocks.toastError).toHaveBeenCalledWith("Forbidden")
    expect(mocks.toastSuccess).not.toHaveBeenCalled()
    expect(mocks.push).not.toHaveBeenCalled()
  })
})
