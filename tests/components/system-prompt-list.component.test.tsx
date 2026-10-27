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
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { SystemPromptList } from "@/app/[lang]/(main)/system-prompts/system-prompt-list"

const prompts = Array.from({ length: 13 }, (_, index) => ({
  promptType:
    index < 3
      ? `TELEGRAM_MARKET_ANALYSIS_STAGE_${index + 1}`
      : `PRODUCER_PROMPT_${index + 1}`,
  name: index < 3 ? `Telegram stage ${index + 1}` : `Purpose ${index + 1}`,
  content: `Content ${index + 1}`,
  requiredVariables: [],
}))

function renderList() {
  return render(
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
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
      target: { value: "telegram_market_analysis_stage_2" },
    })

    expect(screen.getByRole("status")).toHaveTextContent("13 prompt")
    expect(screen.getByText("Telegram stage 2")).toBeInTheDocument()
    expect(screen.queryByText("Telegram stage 1")).not.toBeInTheDocument()
    expect(screen.queryByText("Purpose 4")).not.toBeInTheDocument()
  })

  it("stores search in the URL and restores it from the current query", async () => {
    renderList()
    const search = screen.getByRole("searchbox")
    const query = "telegram_market_analysis_stage_2"

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
      "/system-prompts/PRODUCER_PROMPT_4"
    )
    expect(
      screen.queryByRole("link", { name: "Chỉnh sửa nội dung" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Chỉnh sửa nội dung" })
    ).not.toBeInTheDocument()
  })
})
