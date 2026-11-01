// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ComponentProps } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

const listState = vi.hoisted(() => ({
  canUpdate: true,
  searchParams: new URLSearchParams(),
  routerPush: vi.fn(),
  routerReplace: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/system-prompts",
  useRouter: () => ({
    push: listState.routerPush,
    replace: listState.routerReplace,
  }),
  useSearchParams: () => listState.searchParams,
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

function listNode(locale: "en" | "vi" = "vi", listPrompts = prompts) {
  return (
    <LocalizationProvider
      locale={locale}
      dictionary={locale === "en" ? enDictionary : viDictionary}
    >
      <SystemPromptList prompts={listPrompts} />
    </LocalizationProvider>
  )
}

function renderList(locale: "en" | "vi" = "vi", listPrompts = prompts) {
  return render(listNode(locale, listPrompts))
}

describe("system prompt list", () => {
  afterEach(() => {
    cleanup()
    listState.canUpdate = true
    listState.searchParams = new URLSearchParams()
    listState.routerPush.mockReset()
    listState.routerReplace.mockReset()
  })

  it("shows ten rows by default and navigates the remaining three without duplicates", async () => {
    const user = userEvent.setup()
    const view = renderList()

    expect(screen.getByRole("status")).toHaveTextContent("13 prompt")
    expect(screen.getAllByRole("row")).toHaveLength(11)
    for (const prompt of prompts.slice(0, 10)) {
      expect(screen.getByText(prompt.name)).toBeInTheDocument()
      expect(screen.getByText(prompt.promptType)).toBeInTheDocument()
    }
    for (const prompt of prompts.slice(10)) {
      expect(screen.queryByText(prompt.name)).not.toBeInTheDocument()
      expect(screen.queryByText(prompt.promptType)).not.toBeInTheDocument()
    }
    expect(screen.getByText(/1-10.*13/)).toBeInTheDocument()
    expect(
      screen.getByRole("combobox", { name: viDictionary.pagination.pageSize })
    ).toHaveTextContent("10")
    expect(
      screen.getAllByRole("link", { name: "Chỉnh sửa nội dung" })
    ).toHaveLength(10)
    expect(
      screen.queryByText(/thêm prompt|xóa prompt/i)
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole("button", {
        name: viDictionary.pagination.goToNext,
      })
    )
    await waitFor(() =>
      expect(listState.routerPush).toHaveBeenCalledWith(
        "/en/system-prompts?page=2"
      )
    )

    listState.searchParams = new URLSearchParams("page=2")
    view.rerender(listNode())
    expect(screen.getAllByRole("row")).toHaveLength(4)
    for (const prompt of prompts.slice(0, 10)) {
      expect(screen.queryByText(prompt.name)).not.toBeInTheDocument()
    }
    for (const prompt of prompts.slice(10)) {
      expect(screen.getByText(prompt.name)).toBeInTheDocument()
      expect(screen.getByText(prompt.promptType)).toBeInTheDocument()
    }
    expect(screen.getByText(/11-13.*13/)).toBeInTheDocument()
    expect(
      screen.getAllByRole("link", { name: "Chỉnh sửa nội dung" })
    ).toHaveLength(3)
  })

  it("normalizes an out-of-range deep link to the last local page", async () => {
    const searchablePrompts = prompts.map((prompt) => ({
      ...prompt,
      name: `Available ${prompt.name}`,
    }))
    listState.searchParams = new URLSearchParams(
      "page=7&size=10&search=available&sort=name"
    )

    renderList("vi", searchablePrompts)

    expect(screen.getAllByRole("row")).toHaveLength(4)
    expect(screen.getByText(/11-13.*13/)).toBeInTheDocument()
    await waitFor(() =>
      expect(listState.routerReplace).toHaveBeenCalledWith(
        "/en/system-prompts?page=2&size=10&search=available&sort=name"
      )
    )
  })

  it("keeps search and other query state when changing page size", async () => {
    const user = userEvent.setup()
    const searchablePrompts = prompts.map((prompt) => ({
      ...prompt,
      name: `Available ${prompt.name}`,
    }))
    listState.searchParams = new URLSearchParams(
      "page=2&size=10&search=available&sort=name"
    )

    const view = renderList("en", searchablePrompts)
    await user.click(
      screen.getByRole("combobox", { name: enDictionary.pagination.pageSize })
    )
    await user.click(await screen.findByRole("option", { name: /20/ }))

    await waitFor(() =>
      expect(listState.routerPush).toHaveBeenCalledWith(
        "/en/system-prompts?page=1&size=20&search=available&sort=name"
      )
    )

    listState.searchParams = new URLSearchParams(
      "page=1&size=20&search=available&sort=name"
    )
    view.rerender(listNode("en", searchablePrompts))

    expect(screen.getAllByRole("row")).toHaveLength(14)
    expect(screen.getByText(/1-13.*13/)).toBeInTheDocument()
    expect(
      screen.getByRole("combobox", { name: enDictionary.pagination.pageSize })
    ).toHaveTextContent("20")
    expect(
      screen.getByRole("button", {
        name: enDictionary.pagination.goToPrevious,
      })
    ).toBeDisabled()
    expect(
      screen.getByRole("button", {
        name: enDictionary.pagination.goToNext,
      })
    ).toBeDisabled()
  })

  it("searches the whole readable catalog before slicing the current page", () => {
    listState.searchParams = new URLSearchParams("page=2&size=10")
    renderList()
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: prompts[0].promptType },
    })

    expect(screen.getByRole("status")).toHaveTextContent("13 prompt")
    expect(screen.getAllByRole("row")).toHaveLength(2)
    expect(screen.getByText(prompts[0].name)).toBeInTheDocument()
    expect(screen.queryByText(prompts[10].name)).not.toBeInTheDocument()
  })

  it("keeps the size selector and empty state without page navigation", async () => {
    listState.searchParams = new URLSearchParams(
      "page=2&size=10&search=not-a-prompt"
    )

    renderList()

    expect(
      screen.getByText(viDictionary.systemPrompts.noResultsTitle)
    ).toBeInTheDocument()
    expect(
      screen.getByText(viDictionary.pagination.noResults)
    ).toBeInTheDocument()
    expect(
      screen.getByRole("combobox", { name: viDictionary.pagination.pageSize })
    ).toHaveTextContent("10")
    expect(
      screen.queryByRole("navigation", {
        name: viDictionary.pagination.navigationLabel,
      })
    ).not.toBeInTheDocument()
    await waitFor(() =>
      expect(listState.routerReplace).toHaveBeenCalledWith(
        "/en/system-prompts?page=1&size=10&search=not-a-prompt"
      )
    )
  })

  it("stores search in the URL and restores it from the current query", async () => {
    renderList()
    const search = screen.getByRole("searchbox")
    const query = "telegram_market_analysis_scalping"

    fireEvent.change(search, { target: { value: query } })

    expect(screen.getByText("Telegram stage 2")).toBeInTheDocument()
    await waitFor(() => {
      expect(listState.routerReplace).toHaveBeenCalledWith(
        `/en/system-prompts?search=${query}&page=1`,
        { scroll: false }
      )
    })

    cleanup()
    listState.searchParams = new URLSearchParams(`search=${query}`)
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
      expect(formattedTimes).toHaveLength(9)
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
