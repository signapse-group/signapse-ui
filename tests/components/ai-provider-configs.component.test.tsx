// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Suspense } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { routerPush, routerRefresh, getCurrentPermissions } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  routerRefresh: vi.fn(),
  getCurrentPermissions: vi.fn(async () => ["ai-provider-config:read"]),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/vi/ai-provider-configs",
  useRouter: () => ({ push: routerPush, refresh: routerRefresh }),
  useSearchParams: () => new URLSearchParams("page=1&size=10"),
}))

vi.mock("@/components/localized-link", () => ({
  LocalizedLink: ({ href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props} />
  ),
  useLocalizedPath: (path: string) => `/vi${path}`,
}))

vi.mock("@/app/api/ai-provider-configs/action", () => ({
  createAiProviderConfig: vi.fn(),
  getAiProviderConfigById: vi.fn(),
  getAiProviderConfigs: vi.fn(),
}))

vi.mock("@/app/lib/permissions-server", () => ({ getCurrentPermissions }))
vi.mock("@/app/lib/i18n/server", () => ({
  getServerDictionary: vi.fn(async () => viDictionary),
}))

import {
  createAiProviderConfig,
  getAiProviderConfigById,
  getAiProviderConfigs,
} from "@/app/api/ai-provider-configs/action"
import { en } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import { PermissionProvider } from "@/components/permission-provider"
import { AiProviderConfigCreateForm } from "@/app/[lang]/(main)/ai-provider-configs/ai-provider-config-create-form"
import { AiProviderConfigDetail } from "@/app/[lang]/(main)/ai-provider-configs/ai-provider-config-detail"
import { AiProviderConfigListPage } from "@/app/[lang]/(main)/ai-provider-configs/ai-provider-config-list"
import AiProviderConfigDetailPage from "@/app/[lang]/(main)/ai-provider-configs/[id]/page"
import CreateAiProviderConfigPage from "@/app/[lang]/(main)/ai-provider-configs/create/page"
import AiProviderConfigsPage from "@/app/[lang]/(main)/ai-provider-configs/page"

const legacyProvider = {
  id: 12,
  providerType: "GROQ" as const,
  description: "Existing connection",
  defaultProvider: true,
  credentials: [{ id: 101, keyPreview: "gsk-...legacy" }],
}

const listPage = {
  content: [legacyProvider],
  pageable: {
    pageNumber: 0,
    pageSize: 10,
    offset: 0,
    paged: true,
    unpaged: false,
    sort: { sorted: true, unsorted: false, empty: false },
  },
  last: false,
  totalElements: 21,
  totalPages: 3,
  size: 10,
  number: 0,
  first: true,
  numberOfElements: 1,
  sort: { sorted: true, unsorted: false, empty: false },
  empty: false,
}

function renderWithProviders(
  children: React.ReactNode,
  permissions: string[] = ["ai-provider-config:read"],
  dictionary: Dictionary = viDictionary
) {
  return render(
    <LocalizationProvider locale="vi" dictionary={dictionary}>
      <PermissionProvider permissions={permissions}>
        {children}
      </PermissionProvider>
    </LocalizationProvider>
  )
}

describe("AI connection UI", () => {
  beforeEach(() => {
    routerPush.mockReset()
    routerRefresh.mockReset()
    vi.mocked(createAiProviderConfig).mockReset()
    vi.mocked(getAiProviderConfigById).mockReset()
    getCurrentPermissions
      .mockReset()
      .mockResolvedValue(["ai-provider-config:read"])
  })

  afterEach(() => cleanup())

  it("shows legacy connection metadata and masked keys without implying task references", async () => {
    const user = userEvent.setup()
    renderWithProviders(<AiProviderConfigListPage providerPage={listPage} />)

    expect(screen.getByRole("link", { name: "Groq #12" })).toHaveAttribute(
      "href",
      "/ai-provider-configs/12"
    )
    expect(screen.getByText("·")).toBeVisible()
    expect(screen.getByText("#12")).toBeVisible()
    expect(screen.getByText("Endpoint mặc định của Groq")).toBeVisible()
    expect(screen.getByText("Endpoint của nhà cung cấp")).toBeVisible()
    expect(screen.getByText("gsk-...legacy")).toBeVisible()
    expect(screen.getByText("API chưa cung cấp")).toBeVisible()
    expect(screen.queryByText("0 tác vụ")).not.toBeInTheDocument()
    expect(screen.queryByText("Mặc định")).not.toBeInTheDocument()

    expect(
      screen.queryByRole("link", { name: "Thêm kết nối" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("link", {
        name: viDictionary.aiProviderConfigs.openTaskConfiguration,
      })
    ).not.toBeInTheDocument()
    const navigation = screen.getByRole("navigation", {
      name: viDictionary.pagination.navigationLabel,
    })
    await user.click(
      within(navigation).getByRole("button", {
        name: viDictionary.pagination.goToNext,
      })
    )
    await vi.waitFor(() =>
      expect(routerPush).toHaveBeenCalledWith(
        "/vi/ai-provider-configs?page=2&size=10"
      )
    )
  })

  it("shows the create link only when the separate create permission is present", () => {
    renderWithProviders(<AiProviderConfigListPage providerPage={listPage} />, [
      "ai-provider-config:read",
      "ai-provider-config:create",
    ])

    expect(screen.getByRole("link", { name: "Thêm kết nối" })).toHaveAttribute(
      "href",
      "/ai-provider-configs/create"
    )
    expect(screen.getByText("21 kết nối")).toBeVisible()
  })

  it("shows the task-configuration shortcut only with its read permission", () => {
    renderWithProviders(<AiProviderConfigListPage providerPage={listPage} />, [
      "ai-provider-config:read",
      "ai-task-configuration:read",
    ])

    expect(
      screen.getByRole("link", {
        name: viDictionary.aiProviderConfigs.openTaskConfiguration,
      })
    ).toHaveAttribute("href", "/ai-task-configurations")
  })

  it("denies the list route to a user without read permission", async () => {
    getCurrentPermissions.mockResolvedValue(["ai-provider-config:create"])

    const page = await AiProviderConfigsPage({
      searchParams: Promise.resolve({}),
    })
    renderWithProviders(page, ["ai-provider-config:create"])

    expect(
      screen.getByText(viDictionary.aiProviderConfigs.readDenied, {
        exact: false,
      })
    ).toBeVisible()
    expect(getAiProviderConfigs).not.toHaveBeenCalled()
  })

  it("renders only actual detail references and keeps legacy task models out of the view", () => {
    renderWithProviders(
      <AiProviderConfigDetail
        provider={{
          ...legacyProvider,
          taskReferences: [
            { task: "MARKET_REACTION_ANALYSIS", model: "secret-model-choice" },
            { task: "NEWS_EVENT_EXTRACTION", model: "another-legacy-model" },
          ],
        }}
      />
    )

    expect(screen.getByText("2 tác vụ")).toBeVisible()
    expect(screen.getByText("gsk-...legacy")).toBeVisible()
    expect(screen.queryByText(/legacy-model/)).not.toBeInTheDocument()
    expect(screen.queryByText("secret-model-choice")).not.toBeInTheDocument()
    expect(screen.queryByText("Nhà cung cấp mặc định")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /sửa|xóa/i })
    ).not.toBeInTheDocument()
  })

  it("allows a reader without update permission to reach the detail route", async () => {
    getCurrentPermissions.mockResolvedValue(["ai-provider-config:read"])

    const page = await AiProviderConfigDetailPage({
      params: Promise.resolve({ id: "12" }),
    })

    expect(page).toHaveProperty("type", Suspense)
    expect(page).toHaveProperty("props.children.props.id", 12)
    expect(getAiProviderConfigById).not.toHaveBeenCalled()
  })

  it("denies the detail route without read permission", async () => {
    getCurrentPermissions.mockResolvedValue(["ai-provider-config:update"])

    const page = await AiProviderConfigDetailPage({
      params: Promise.resolve({ id: "12" }),
    })
    renderWithProviders(page, ["ai-provider-config:update"])

    expect(
      screen.getByText(viDictionary.aiProviderConfigs.readDenied, {
        exact: false,
      })
    ).toBeVisible()
    expect(getAiProviderConfigById).not.toHaveBeenCalled()
  })

  it("gates the create route when create permission is missing", async () => {
    getCurrentPermissions.mockResolvedValue(["ai-provider-config:read"])

    const page = await CreateAiProviderConfigPage()
    renderWithProviders(page)

    expect(
      screen.getByText(viDictionary.aiProviderConfigs.createDenied, {
        exact: false,
      })
    ).toBeVisible()
    expect(
      screen.queryByRole("button", { name: "Tạo kết nối" })
    ).not.toBeInTheDocument()
  })

  it("keeps create-only navigation away from the unreadable list", async () => {
    getCurrentPermissions.mockResolvedValue(["ai-provider-config:create"])

    const page = await CreateAiProviderConfigPage()
    renderWithProviders(page, ["ai-provider-config:create"], en)

    expect(
      screen.getByRole("link", { name: viDictionary.common.back })
    ).toHaveAttribute("href", "/dashboard")
    expect(
      screen.getByRole("heading", { name: en.aiProviderConfigs.createTitle })
    ).toBeVisible()
  })

  it("requires a non-empty key, keeps the draft on API errors, and sends no model/default fields", async () => {
    const user = userEvent.setup()
    vi.mocked(createAiProviderConfig)
      .mockResolvedValueOnce({ success: false, error: "API key was rejected" })
      .mockResolvedValueOnce({
        success: true,
        data: {
          id: 42,
          providerType: "OPENAI",
          defaultProvider: false,
          credentials: [{ id: 8, keyPreview: "sk-...test" }],
        },
      })
    renderWithProviders(
      <AiProviderConfigCreateForm />,
      ["ai-provider-config:create", "ai-provider-config:read"],
      en
    )

    expect(screen.queryByLabelText(/default provider/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^model$/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Create connection" }))
    expect(
      await screen.findByText(en.aiProviderConfigs.keyRequired)
    ).toBeVisible()
    expect(createAiProviderConfig).not.toHaveBeenCalled()

    const apiKey = screen.getByLabelText("Key 1")
    await user.type(apiKey, " sk-test-key ")
    await user.type(screen.getByLabelText("Endpoint"), "https://example.com/v1")
    await user.type(screen.getByLabelText("Description"), "Test connection")
    await user.click(screen.getByRole("button", { name: "Add key" }))
    expect(screen.getByLabelText("Key 2")).toHaveValue("")
    await user.click(screen.getByRole("button", { name: "Create connection" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "API key was rejected"
    )
    expect(apiKey).toHaveValue(" sk-test-key ")
    expect(routerPush).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Create connection" }))
    await vi.waitFor(() =>
      expect(createAiProviderConfig).toHaveBeenCalledTimes(2)
    )
    expect(createAiProviderConfig).toHaveBeenLastCalledWith({
      providerType: "OPENAI",
      baseUrl: "https://example.com/v1",
      description: "Test connection",
      credentials: [{ apiKey: " sk-test-key " }],
    })
    expect(routerPush).toHaveBeenCalledWith("/vi/ai-provider-configs")
    expect(routerRefresh).not.toHaveBeenCalled()
  })

  it("allows removing every draft key but requires a non-empty key before create", async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <AiProviderConfigCreateForm />,
      ["ai-provider-config:create"],
      en
    )

    await user.click(screen.getByRole("button", { name: "Remove API key 1" }))
    expect(screen.queryByLabelText("Key 1")).not.toBeInTheDocument()
    expect(screen.getByText(en.aiProviderConfigs.noKeysAdded)).toBeVisible()

    await user.click(screen.getByRole("button", { name: "Create connection" }))
    expect(
      await screen.findByText(en.aiProviderConfigs.keyRequired)
    ).toBeVisible()
    await vi.waitFor(() =>
      expect(screen.getByRole("button", { name: "Add key" })).toHaveFocus()
    )
    expect(createAiProviderConfig).not.toHaveBeenCalled()
  })

  it("confirms successful creation for a create-only user without navigating to the unreadable list", async () => {
    const user = userEvent.setup()
    vi.mocked(createAiProviderConfig).mockResolvedValue({
      success: true,
      data: {
        id: 43,
        providerType: "OPENAI",
        defaultProvider: false,
        credentials: [{ id: 9, keyPreview: "sk-...saved" }],
      },
    })

    renderWithProviders(
      <AiProviderConfigCreateForm />,
      ["ai-provider-config:create"],
      en
    )

    await user.type(screen.getByLabelText("Key 1"), "sk-new-key")
    await user.click(screen.getByRole("button", { name: "Create connection" }))

    expect(await screen.findByRole("status")).toHaveTextContent(
      "AI connection created."
    )
    expect(screen.getByLabelText("Key 1")).toHaveValue("")
    expect(routerPush).not.toHaveBeenCalled()
  })

  it("keeps the form draft and shows a safe message if the action rejects unexpectedly", async () => {
    const user = userEvent.setup()
    vi.mocked(createAiProviderConfig).mockRejectedValueOnce(
      new Error("unexpected secret-bearing error")
    )

    renderWithProviders(
      <AiProviderConfigCreateForm />,
      ["ai-provider-config:create", "ai-provider-config:read"],
      en
    )

    const apiKey = screen.getByLabelText("Key 1")
    await user.type(apiKey, "sk-test-key")
    await user.click(screen.getByRole("button", { name: "Create connection" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      en.aiProviderConfigs.createError
    )
    expect(screen.getByLabelText("Key 1")).toHaveValue("sk-test-key")
    expect(
      screen.queryByText("unexpected secret-bearing error")
    ).not.toBeInTheDocument()
  })
})
