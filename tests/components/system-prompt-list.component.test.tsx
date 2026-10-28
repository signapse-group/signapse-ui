// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import type { ComponentProps } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

const listState = vi.hoisted(() => ({
  canUpdate: true,
  searchParams: "",
  routerReplace: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/system-prompts",
  useRouter: () => ({ replace: listState.routerReplace }),
  useSearchParams: () => new URLSearchParams(listState.searchParams),
}))
vi.mock("@/components/localized-link", () => ({
  LocalizedLink: ({ href, children, ...props }: ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))
vi.mock("@/components/permission-provider", () => ({
  useHasAnyPermission: () => listState.canUpdate,
}))

import { LocalizationProvider } from "@/app/lib/i18n/provider"
import { en as enDictionary } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { SYSTEM_PROMPT_CONTENT_TYPES } from "@/app/lib/system-prompts/definitions"
import { SystemPromptList } from "@/app/[lang]/(main)/system-prompts/system-prompt-list"

const telegramTypes = SYSTEM_PROMPT_CONTENT_TYPES.filter((promptType) =>
  promptType.startsWith("TELEGRAM_")
)
const updatedAt = "2026-10-18T13:21:00.000Z"
const prompts = SYSTEM_PROMPT_CONTENT_TYPES.map((promptType, index) => ({
  promptType,
  name: promptType.startsWith("TELEGRAM_")
    ? `Telegram stage ${telegramTypes.indexOf(promptType) + 1}`
    : `Purpose ${index + 1}`,
  content: `Content ${index + 1}`,
  requiredVariables: [],
  lastModifiedDate: index === 1 ? null : updatedAt,
}))

function renderList(locale: "en" | "vi" = "vi") {
  return render(
    <LocalizationProvider
      locale={locale}
      dictionary={locale === "en" ? enDictionary : viDictionary}
    >
      <SystemPromptList prompts={prompts} />
    </LocalizationProvider>
  )
}

describe("system prompt list", () => {
  afterEach(() => {
    cleanup()
    listState.canUpdate = true
    listState.searchParams = ""
    listState.routerReplace.mockReset()
  })

  it("renders every producer row and groups the Telegram stages together", () => {
    renderList()

    expect(screen.getByRole("status")).toHaveTextContent("13 prompt")
    for (const prompt of prompts) {
      expect(screen.getByText(prompt.name)).toBeInTheDocument()
      expect(screen.getByText(prompt.promptType)).toBeInTheDocument()
    }
    expect(screen.getAllByText("Telegram")).toHaveLength(3)
    expect(
      screen.getAllByRole("link", { name: "Chỉnh sửa nội dung" })
    ).toHaveLength(13)
    expect(
      screen.queryByText(/thêm prompt|xóa prompt/i)
    ).not.toBeInTheDocument()
  })

  it("searches producer purpose and type locally without changing the count", () => {
    renderList()
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "telegram_market_analysis_scalping" },
    })

    expect(screen.getByRole("status")).toHaveTextContent("13 prompt")
    expect(screen.getByText("Telegram stage 2")).toBeInTheDocument()
    expect(screen.queryByText("Telegram stage 1")).not.toBeInTheDocument()
    expect(screen.queryByText("Purpose 4")).not.toBeInTheDocument()
  })

  it("stores search in the URL and restores it from the current query", async () => {
    renderList()
    const search = screen.getByRole("searchbox")
    const query = "telegram_market_analysis_scalping"

    fireEvent.change(search, { target: { value: query } })

    expect(screen.getByText("Telegram stage 2")).toBeInTheDocument()
    await waitFor(() => {
      expect(listState.routerReplace).toHaveBeenCalledWith(
        `/en/system-prompts?search=${query}`,
        { scroll: false }
      )
    })

    cleanup()
    listState.searchParams = `search=${query}`
    renderList()

    expect(screen.getByRole("searchbox")).toHaveValue(query)
    expect(screen.getByText("Telegram stage 2")).toBeInTheDocument()
    expect(screen.queryByText("Purpose 4")).not.toBeInTheDocument()
  })

  it("keeps the catalog readable without update permission", () => {
    listState.canUpdate = false
    renderList()

    expect(screen.getByRole("link", { name: "Purpose 4" })).toHaveAttribute(
      "href",
      "/system-prompts/EVENT_ASSET_THEME_ENRICHMENT"
    )
    expect(
      screen.queryByRole("link", { name: "Chỉnh sửa nội dung" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Chỉnh sửa nội dung" })
    ).not.toBeInTheDocument()
  })

  it.each([
    ["en", "en-US"],
    ["vi", "vi-VN"],
  ] as const)(
    "formats producer audit times for %s and shows no-data only for null",
    (locale, intlLocale) => {
      renderList(locale)

      const expectedDate = new Intl.DateTimeFormat(intlLocale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "UTC",
      }).format(new Date(updatedAt))

      const formattedTimes = screen.getAllByText(expectedDate)
      expect(formattedTimes).toHaveLength(12)
      expect(formattedTimes[0].closest("time")).toHaveAttribute(
        "datetime",
        updatedAt
      )
      expect(screen.getByText("—")).toHaveAttribute(
        "aria-label",
        (locale === "en" ? enDictionary : viDictionary).systemPrompts
          .updatedUnavailable
      )
    }
  )
})
