// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { toast } from "sonner"

const { routerRefresh } = vi.hoisted(() => ({
  routerRefresh: vi.fn(),
}))

vi.mock("@/app/api/telegram/action", () => ({
  createTelegramBotConnection: vi.fn(),
  createTelegramLinkToken: vi.fn(),
  createTelegramMarketAnalysisSchedule: vi.fn(),
  deleteTelegramBotConnection: vi.fn(),
  deleteTelegramDestination: vi.fn(),
  deleteTelegramMarketAnalysisSchedule: vi.fn(),
  disableTelegramDestination: vi.fn(),
  sendTelegramTestMessage: vi.fn(),
  updateTelegramFeatureSetting: vi.fn(),
  updateTelegramMarketAnalysisSchedule: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}))

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

import {
  createTelegramLinkToken,
  deleteTelegramBotConnection,
  deleteTelegramMarketAnalysisSchedule,
  updateTelegramFeatureSetting,
} from "@/app/api/telegram/action"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import type {
  TelegramBotConnectionResponse,
  TelegramConfigurationData,
} from "@/app/lib/telegram/definitions"
import { TooltipProvider } from "@/components/ui/tooltip"
import { TelegramConfigurationPage } from "@/app/[lang]/(main)/telegram/telegram-configuration"
import { BotConnectionsCard } from "@/app/[lang]/(main)/telegram/telegram-bot-connections"

const destination = {
  id: 8,
  botConnectionId: 1,
  chatType: "PRIVATE" as const,
  displayLabel: "Operations",
  status: "ACTIVE" as const,
}

const schedule = {
  id: 11,
  name: "Morning analysis",
  workspaceId: 7,
  workspaceName: "Workspace",
  destination,
  timezone: "Asia/Bangkok",
  localTimes: ["09:00"],
  asset: { assetId: 9, assetName: "Gold", assetSymbol: "GOLD" },
  outputLanguage: null,
  status: "ACTIVE" as const,
}

const featureSettings = [
  {
    id: 41,
    featureKey: "ECONOMIC_CALENDAR_ALERT" as const,
    workspaceId: 7,
    workspaceName: "Workspace",
    enabled: true,
    destination,
    outputLanguage: { id: 2, isoCode: "en", name: "English" },
  },
  {
    id: 42,
    featureKey: "MARKET_NEWS_ALERT" as const,
    workspaceId: 7,
    workspaceName: "Workspace",
    enabled: false,
    destination,
    outputLanguage: { id: 1, isoCode: "vi", name: "Tiếng Việt" },
  },
  {
    id: 43,
    featureKey: "SCHEDULED_MARKET_ANALYSIS" as const,
    workspaceId: 7,
    workspaceName: "Workspace",
    enabled: true,
    destination,
    outputLanguage: { id: 2, isoCode: "en", name: "English" },
  },
]

const data: TelegramConfigurationData = {
  botConnections: [],
  destinations: [destination],
  featureSettings: [],
  schedules: [schedule],
  currentWorkspace: {
    id: 7,
    name: "Workspace",
    currentWorkspace: true,
    createdDate: "2026-07-29T00:00:00Z",
    lastModifiedDate: "2026-07-29T00:00:00Z",
  },
  watchlistAssets: [
    {
      id: 10,
      assetId: 9,
      assetName: "Gold",
      assetSymbol: "GOLD",
      assetType: "COMMODITY",
      createdDate: "2026-07-29T00:00:00Z",
    },
  ],
  languages: [{ id: 1, isoCode: "en", name: "English" }],
  languageCatalogError: false,
  scheduleLoadError: false,
  botConnectionsLoadError: false,
  destinationsLoadError: false,
  featureSettingsLoadError: false,
  currentWorkspaceLoadError: false,
  watchlistAssetsLoadError: false,
  sectionAccess: {
    botConnections: false,
    destinations: false,
    featureSettings: true,
    schedules: true,
    watchlistAssets: true,
  },
  manageAccess: {
    botConnections: false,
    botConnectionsDelete: false,
    destinations: false,
    featureSettings: false,
  },
  scheduleActions: { create: true, update: true, delete: true },
}

const selectControlledWarning =
  "Base UI: A component is changing the uncontrolled value state of Select to be controlled."

function renderConfiguration(
  configurationData: TelegramConfigurationData = data
) {
  return render(
    <TooltipProvider delay={0}>
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <TelegramConfigurationPage data={configurationData} />
      </LocalizationProvider>
    </TooltipProvider>
  )
}

const botConnection: TelegramBotConnectionResponse = {
  id: 23,
  botUsername: "fixture_bot",
  botFirstName: "Fixture bot",
  displayLabel: "Fixture operations bot",
  status: "ACTIVE",
}

function renderBotConnectionsCard({
  botConnections = [botConnection],
  canRead = true,
  canManage = false,
  canDelete = false,
  loadError = false,
}: {
  botConnections?: TelegramBotConnectionResponse[]
  canRead?: boolean
  canManage?: boolean
  canDelete?: boolean
  loadError?: boolean
} = {}) {
  return render(
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
      <BotConnectionsCard
        botConnections={botConnections}
        canRead={canRead}
        canManage={canManage}
        canDelete={canDelete}
        loadError={loadError}
      />
    </LocalizationProvider>
  )
}

function expectNoSelectControlledWarning(calls: unknown[][]) {
  expect(
    calls.some((call) =>
      call.some(
        (argument) =>
          typeof argument === "string" &&
          argument.includes(selectControlledWarning)
      )
    )
  ).toBe(false)
}

describe("Telegram schedule destructive actions", () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.mocked(deleteTelegramBotConnection).mockReset()
    vi.mocked(deleteTelegramMarketAnalysisSchedule).mockReset()
    vi.mocked(updateTelegramFeatureSetting).mockReset()
    vi.mocked(toast.success).mockReset()
    routerRefresh.mockReset()
  })

  it("shows owner-wide schedules with schedule read when Feature routing is unreadable", () => {
    renderConfiguration({
      ...data,
      schedules: [
        schedule,
        {
          ...schedule,
          id: 12,
          name: "Research close review",
          workspaceId: 12,
          workspaceName: "Research workspace",
        },
        { ...schedule, id: 13, name: "Removed schedule", status: "REMOVED" },
      ],
      sectionAccess: { ...data.sectionAccess, featureSettings: false },
      scheduleActions: { create: true, update: true, delete: true },
    })

    expect(screen.getAllByText("Morning analysis").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Research close review").length).toBeGreaterThan(
      0
    )
    expect(screen.queryByText("Removed schedule")).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: viDictionary.telegram.schedule.createSchedule,
      })
    ).toBeVisible()
  })

  it("shows only actions authorized by their own schedule permissions", () => {
    renderConfiguration({
      ...data,
      scheduleActions: { create: false, update: true, delete: false },
    })

    expect(
      screen.queryByRole("button", {
        name: viDictionary.telegram.schedule.createSchedule,
      })
    ).not.toBeInTheDocument()
    expect(
      screen.getAllByRole("button", {
        name: viDictionary.telegram.schedule.editTrigger,
      }).length
    ).toBeGreaterThan(0)
    expect(
      screen.queryByRole("button", {
        name: viDictionary.telegram.schedule.deleteTrigger,
      })
    ).not.toBeInTheDocument()
  })

  it("offers Create without exposing the schedule list to a create-only role", () => {
    renderConfiguration({
      ...data,
      sectionAccess: {
        ...data.sectionAccess,
        featureSettings: false,
        schedules: false,
      },
      scheduleActions: { create: true, update: false, delete: false },
    })

    expect(
      screen.getByRole("heading", {
        name: viDictionary.telegram.schedule.panelTitle,
      })
    ).toBeVisible()
    expect(
      screen.getByRole("button", {
        name: viDictionary.telegram.schedule.createSchedule,
      })
    ).toBeVisible()
    expect(
      screen.getAllByText(viDictionary.telegram.schedule.accessLimited).length
    ).toBeGreaterThan(0)
    expect(screen.queryByText("Morning analysis")).not.toBeInTheDocument()
  })

  it("does not report an unreadable Feature routing section as needing review", () => {
    renderConfiguration({
      ...data,
      sectionAccess: { ...data.sectionAccess, featureSettings: false },
    })

    const routingReadiness = screen
      .getByText(viDictionary.telegram.readiness.routing)
      .closest('[data-slot="card"]')

    expect(routingReadiness).not.toBeNull()
    expect(routingReadiness).toHaveTextContent(
      viDictionary.telegram.routing.accessLimited
    )
    expect(routingReadiness).toHaveTextContent(
      viDictionary.telegram.readiness.unavailable
    )
    expect(routingReadiness).not.toHaveTextContent(
      viDictionary.telegram.readiness.needsReview
    )
  })

  it("keeps schedules visible and reports a Feature routing read error", () => {
    renderConfiguration({ ...data, featureSettingsLoadError: true })

    expect(
      screen.getByRole("heading", {
        name: viDictionary.telegram.schedule.panelTitle,
      })
    ).toBeVisible()
    expect(screen.getAllByText("Morning analysis").length).toBeGreaterThan(0)
    expect(screen.getByRole("alert")).toHaveTextContent(
      viDictionary.telegram.common.readError
    )
  })

  it("associates an accessible tooltip with the icon-only Remove action", () => {
    renderConfiguration()

    const removeButton = screen.getAllByRole("button", {
      name: viDictionary.telegram.schedule.deleteTrigger,
    })[0]
    expect(removeButton).toHaveAttribute(
      "title",
      viDictionary.telegram.schedule.deleteTrigger
    )
    const tooltipId = removeButton.getAttribute("aria-describedby")
    expect(tooltipId).toBeTruthy()
    expect(document.getElementById(tooltipId!)).toHaveAttribute(
      "role",
      "tooltip"
    )
    expect(document.getElementById(tooltipId!)).toHaveTextContent(
      viDictionary.telegram.schedule.deleteTrigger
    )
  })

  it("keeps schedule read errors local and offers a retry", async () => {
    const user = userEvent.setup()
    renderConfiguration({
      ...data,
      schedules: [],
      scheduleLoadError: true,
      scheduleActions: { create: false, update: false, delete: false },
    })

    expect(
      screen.getAllByText(viDictionary.telegram.schedule.loadError).length
    ).toBeGreaterThan(0)
    await user.click(
      screen.getAllByRole("button", {
        name: viDictionary.telegram.schedule.retry,
      })[0]
    )
    expect(routerRefresh).toHaveBeenCalledTimes(1)
  })

  it("keeps inactive schedules removable without offering Edit when destination is null", () => {
    renderConfiguration({
      ...data,
      schedules: [
        {
          ...schedule,
          name: "Legacy inactive schedule",
          destination: null,
          outputLanguage: null,
          status: "DISABLED",
        },
      ],
      scheduleActions: { create: false, update: true, delete: true },
    })

    const inactiveRows = screen
      .getAllByText("Legacy inactive schedule")
      .map((element) => element.closest("tr, article"))
      .filter((row): row is HTMLElement => row instanceof HTMLElement)

    expect(inactiveRows.length).toBeGreaterThan(0)
    inactiveRows.forEach((inactiveRow) => {
      expect(inactiveRow).toHaveTextContent(
        viDictionary.telegram.schedule.noDestination
      )
      expect(
        within(inactiveRow).getAllByRole("button", {
          name: viDictionary.telegram.schedule.deleteTrigger,
        }).length
      ).toBeGreaterThan(0)
      expect(
        within(inactiveRow).queryAllByRole("button", {
          name: viDictionary.telegram.schedule.editTrigger,
        })
      ).toHaveLength(0)
    })
  })

  it("keeps delete confirmation open through failure, supports retry, and restores focus", async () => {
    const user = userEvent.setup()
    renderConfiguration()

    const trigger = screen.getAllByRole("button", {
      name: viDictionary.telegram.schedule.deleteTrigger,
    })[0]
    await user.click(trigger)

    const dialog = screen.getByRole("alertdialog")
    expect(
      within(dialog).getByRole("heading", {
        name: viDictionary.telegram.schedule.deleteTitle,
      })
    ).toBeVisible()
    expect(dialog).toHaveTextContent("dừng các lượt chạy mới")
    expect(dialog).toHaveTextContent("Lịch sử đã ghi được bảo toàn.")
    expect(dialog).not.toHaveTextContent("không thể hoàn tác")

    vi.mocked(deleteTelegramMarketAnalysisSchedule).mockResolvedValueOnce({
      success: false,
      error: "Delete failed",
    })
    const confirm = within(dialog).getByRole("button", {
      name: viDictionary.telegram.schedule.deleteAction,
    })
    await user.click(confirm)

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Delete failed")
    )
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    await waitFor(() => expect(confirm).toBeEnabled())

    vi.mocked(deleteTelegramMarketAnalysisSchedule).mockResolvedValueOnce({
      success: true,
      data: undefined,
    })
    await user.click(confirm)
    await waitFor(() =>
      expect(deleteTelegramMarketAnalysisSchedule).toHaveBeenCalledTimes(2)
    )
    await waitFor(() => expect(routerRefresh).toHaveBeenCalledTimes(1))
    expect(toast.success).toHaveBeenCalledWith(
      "Đã gỡ lịch phân tích. Lịch sử đã ghi được bảo toàn."
    )
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: viDictionary.telegram.schedule.panelTitle,
        })
      ).toHaveFocus()
    )
  })

  it("leaves the schedule unchanged when delete confirmation is cancelled", async () => {
    const user = userEvent.setup()
    renderConfiguration()

    const trigger = screen.getAllByRole("button", {
      name: viDictionary.telegram.schedule.deleteTrigger,
    })[0]
    await user.click(trigger)
    const dialog = screen.getByRole("alertdialog")
    await user.click(
      within(dialog).getByRole("button", {
        name: viDictionary.telegram.common.cancel,
      })
    )

    expect(deleteTelegramMarketAnalysisSchedule).not.toHaveBeenCalled()
    expect(screen.getAllByText("Morning analysis").length).toBeGreaterThan(0)
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it("keeps an unassigned feature route Select controlled when assigning a destination", async () => {
    const user = userEvent.setup()
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined)

    vi.mocked(updateTelegramFeatureSetting).mockResolvedValue({
      success: true,
      data: {
        id: 12,
        featureKey: "ECONOMIC_CALENDAR_ALERT",
        workspaceId: 7,
        enabled: false,
        destination,
      },
    })

    try {
      renderConfiguration({
        ...data,
        manageAccess: {
          ...data.manageAccess,
          featureSettings: true,
        },
      })

      const routeRow = screen
        .getByText(
          viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
        )
        .closest("tr")
      expect(routeRow).not.toBeNull()

      await user.click(
        within(routeRow as HTMLElement).getByRole("combobox", {
          name: viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT
            .label,
        })
      )
      await user.click(
        await screen.findByRole("option", { name: destination.displayLabel })
      )

      await waitFor(() => {
        expect(updateTelegramFeatureSetting).toHaveBeenCalledWith({
          featureKey: "ECONOMIC_CALENDAR_ALERT",
          workspaceId: 7,
          destinationId: 8,
          enabled: false,
          outputLanguageIsoCode: undefined,
        })
      })
      await waitFor(() => expect(routerRefresh).toHaveBeenCalledTimes(1))
      expectNoSelectControlledWarning(consoleError.mock.calls)
    } finally {
      consoleError.mockRestore()
    }
  })

  it("exposes language controls only for effective feature flows", async () => {
    const user = userEvent.setup()
    vi.mocked(updateTelegramFeatureSetting).mockResolvedValue({
      success: true,
      data: featureSettings[0],
    })

    renderConfiguration({
      ...data,
      featureSettings,
      manageAccess: {
        ...data.manageAccess,
        featureSettings: true,
      },
    })

    const calendarRow = screen
      .getByText(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )
      .closest("tr") as HTMLElement
    const newsRow = screen
      .getByText(viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label)
      .closest("tr") as HTMLElement
    const calendarLanguage = within(calendarRow).getByRole("combobox", {
      name: viDictionary.telegram.routing.languageAria.replace(
        "{route}",
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      ),
    })
    expect(calendarLanguage).toBeEnabled()
    expect(
      within(newsRow).getByRole("combobox", {
        name: viDictionary.telegram.routing.languageAria.replace(
          "{route}",
          viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
        ),
      })
    ).toBeEnabled()
    expect(
      within(newsRow).getByRole("switch", {
        name: viDictionary.telegram.routing.switchAria.replace(
          "{route}",
          viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
        ),
      })
    ).toBeEnabled()
    expect(
      screen.queryByText(
        viDictionary.telegram.routeDefinitions.SCHEDULED_MARKET_ANALYSIS.label
      )
    ).not.toBeInTheDocument()

    await user.click(calendarLanguage)
    await user.click(
      await screen.findByRole("option", {
        name: viDictionary.telegram.routing.defaultLanguage,
      })
    )

    await waitFor(() =>
      expect(updateTelegramFeatureSetting).toHaveBeenCalledWith({
        featureKey: "ECONOMIC_CALENDAR_ALERT",
        workspaceId: 7,
        destinationId: 8,
        enabled: true,
        outputLanguageIsoCode: undefined,
      })
    )
  })

  it("preserves a flow language through destination and enabled updates", async () => {
    const user = userEvent.setup()
    vi.mocked(updateTelegramFeatureSetting).mockResolvedValue({
      success: true,
      data: featureSettings[0],
    })

    renderConfiguration({
      ...data,
      featureSettings,
      destinations: [
        destination,
        { ...destination, id: 9, displayLabel: "Backup" },
      ],
      manageAccess: {
        ...data.manageAccess,
        featureSettings: true,
      },
    })

    const calendarRow = screen
      .getByText(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )
      .closest("tr") as HTMLElement

    await user.click(
      within(calendarRow).getByRole("combobox", {
        name: viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT
          .label,
      })
    )
    await user.click(await screen.findByRole("option", { name: "Backup" }))

    await waitFor(() =>
      expect(updateTelegramFeatureSetting).toHaveBeenCalledWith(
        expect.objectContaining({
          featureKey: "ECONOMIC_CALENDAR_ALERT",
          destinationId: 9,
          enabled: true,
          outputLanguageIsoCode: "en",
        })
      )
    )

    vi.mocked(updateTelegramFeatureSetting).mockClear()
    const routeSwitch = within(calendarRow).getByRole("switch", {
      name: viDictionary.telegram.routing.switchAria.replace(
        "{route}",
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      ),
    })
    Object.defineProperty(window, "PointerEvent", {
      configurable: true,
      value: MouseEvent,
    })
    await waitFor(() => expect(routeSwitch).toBeEnabled())
    fireEvent.click(routeSwitch)

    await waitFor(() =>
      expect(updateTelegramFeatureSetting).toHaveBeenCalledWith(
        expect.objectContaining({
          featureKey: "ECONOMIC_CALENDAR_ALERT",
          destinationId: 9,
          enabled: false,
          outputLanguageIsoCode: "en",
        })
      )
    )

    expect(
      screen.queryByText(
        viDictionary.telegram.routeDefinitions.SCHEDULED_MARKET_ANALYSIS.label
      )
    ).not.toBeInTheDocument()
  })

  it("keeps existing language visible but disables only its selector when the catalog fails", () => {
    renderConfiguration({
      ...data,
      featureSettings,
      languageCatalogError: true,
      manageAccess: {
        ...data.manageAccess,
        featureSettings: true,
      },
    })

    const calendarRow = screen
      .getByText(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )
      .closest("tr") as HTMLElement

    expect(
      within(calendarRow).getByRole("combobox", {
        name: viDictionary.telegram.routing.languageAria.replace(
          "{route}",
          viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
        ),
      })
    ).toBeDisabled()
    expect(
      within(calendarRow).getByRole("switch", {
        name: viDictionary.telegram.routing.switchAria.replace(
          "{route}",
          viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
        ),
      })
    ).toBeEnabled()
    expect(
      within(calendarRow).getByText(
        viDictionary.telegram.routing.languageCatalogError
      )
    ).toBeVisible()
  })

  it("keeps a persisted language visible when it is no longer in the catalog", () => {
    renderConfiguration({
      ...data,
      featureSettings: [
        {
          ...featureSettings[0],
          outputLanguage: { id: 9, isoCode: "fr", name: "Legacy French" },
        },
      ],
      manageAccess: {
        ...data.manageAccess,
        featureSettings: true,
      },
    })

    const calendarRow = screen
      .getByText(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )
      .closest("tr") as HTMLElement

    expect(calendarRow).toHaveTextContent(
      `Legacy French (fr) — ${viDictionary.telegram.routing.languageUnavailable}`
    )
    expect(
      within(calendarRow).getByRole("combobox", {
        name: viDictionary.telegram.routing.languageAria.replace(
          "{route}",
          viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
        ),
      })
    ).toBeEnabled()
  })

  it("disables language configuration without a route destination or update access", () => {
    const calendarLanguageName =
      viDictionary.telegram.routing.languageAria.replace(
        "{route}",
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )

    renderConfiguration({
      ...data,
      featureSettings: [
        {
          ...featureSettings[0],
          destination: undefined,
        },
      ],
      manageAccess: {
        ...data.manageAccess,
        featureSettings: true,
      },
    })

    const unassignedRow = screen
      .getByText(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )
      .closest("tr") as HTMLElement
    expect(
      within(unassignedRow).getByRole("combobox", {
        name: calendarLanguageName,
      })
    ).toBeDisabled()
    expect(
      within(unassignedRow).getByText(
        viDictionary.telegram.routing.languageDestinationRequired
      )
    ).toBeVisible()

    cleanup()
    renderConfiguration({
      ...data,
      featureSettings,
      manageAccess: {
        ...data.manageAccess,
        featureSettings: false,
      },
    })

    const readOnlyRow = screen
      .getByText(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )
      .closest("tr") as HTMLElement
    expect(
      within(readOnlyRow).getByRole("combobox", { name: calendarLanguageName })
    ).toBeDisabled()
  })
})

describe("Telegram bot connection removal", () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    vi.mocked(deleteTelegramBotConnection).mockReset()
    routerRefresh.mockReset()
  })

  it("keeps Connect and Remove independently permission-gated and removes Disable", () => {
    const { rerender } = renderBotConnectionsCard({
      canManage: true,
      canDelete: false,
    })

    expect(
      screen.getByRole("button", {
        name: viDictionary.telegram.bot.connect,
      })
    ).toBeVisible()
    expect(
      screen.queryByRole("button", { name: /Gỡ bot Fixture operations bot/ })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(viDictionary.telegram.common.disable)
    ).not.toBeInTheDocument()

    rerender(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <BotConnectionsCard
          botConnections={[botConnection]}
          canRead
          canManage={false}
          canDelete
          loadError={false}
        />
      </LocalizationProvider>
    )

    expect(
      screen.queryByRole("button", {
        name: viDictionary.telegram.bot.connect,
      })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: "Gỡ bot Fixture operations bot",
      })
    ).toBeVisible()
    expect(
      screen.queryByText(viDictionary.telegram.bot.readOnlyDescription)
    ).not.toBeInTheDocument()
  })

  it("does not expose Remove without read access, even when delete is granted", () => {
    renderBotConnectionsCard({ canRead: false, canDelete: true })

    expect(
      screen.getByText(viDictionary.telegram.bot.accessLimited)
    ).toBeVisible()
    expect(
      screen.queryByRole("button", { name: /Gỡ bot Fixture operations bot/ })
    ).not.toBeInTheDocument()
  })

  it("supports keyboard cancel, blocked retry, pending state, and post-remove focus/readback", async () => {
    const user = userEvent.setup()
    const { rerender } = renderBotConnectionsCard({ canDelete: true })
    const removeTrigger = screen.getByRole("button", {
      name: "Gỡ bot Fixture operations bot",
    })

    removeTrigger.focus()
    await user.keyboard("{Enter}")
    const dialog = screen.getByRole("alertdialog")
    expect(dialog).toHaveTextContent("Gỡ kết nối bot “Fixture operations bot”?")
    expect(dialog).toHaveTextContent("Hãy gỡ tất cả điểm nhận của bot trước")
    await user.keyboard("{Escape}")
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    expect(deleteTelegramBotConnection).not.toHaveBeenCalled()
    await waitFor(() => expect(removeTrigger).toHaveFocus())

    await user.click(removeTrigger)
    const openDialog = screen.getByRole("alertdialog")
    const confirm = within(openDialog).getByRole("button", { name: "Gỡ bot" })
    const cancel = within(openDialog).getByRole("button", {
      name: viDictionary.telegram.common.cancel,
    })
    let settleRequest!: (
      result: Awaited<ReturnType<typeof deleteTelegramBotConnection>>
    ) => void
    vi.mocked(deleteTelegramBotConnection).mockReturnValueOnce(
      new Promise((resolve) => {
        settleRequest = resolve
      })
    )

    confirm.focus()
    await user.keyboard("{Enter}")
    await waitFor(() => {
      expect(confirm).toBeDisabled()
      expect(cancel).toBeDisabled()
      expect(within(openDialog).getByRole("status")).toHaveTextContent(
        viDictionary.telegram.bot.deletePending
      )
      expect(within(openDialog).getByRole("status")).toHaveFocus()
    })
    expect(confirm).toHaveAccessibleName(viDictionary.telegram.bot.deleteAction)
    settleRequest({
      success: false,
      error: viDictionary.telegram.bot.deleteBlockedByDestinations,
    })

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        viDictionary.telegram.bot.deleteBlockedByDestinations
      )
      expect(screen.getByRole("alert")).toHaveFocus()
    })
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    expect(routerRefresh).not.toHaveBeenCalled()
    await waitFor(() => expect(confirm).toBeEnabled())

    vi.mocked(deleteTelegramBotConnection).mockResolvedValueOnce({
      success: true,
      data: undefined,
    })
    await user.click(confirm)
    await waitFor(() =>
      expect(deleteTelegramBotConnection).toHaveBeenLastCalledWith(23)
    )
    await waitFor(() => expect(routerRefresh).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: viDictionary.telegram.bot.sectionTitle,
        })
      ).toHaveFocus()
    )

    rerender(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <BotConnectionsCard
          botConnections={[]}
          canRead
          canManage={false}
          canDelete
          loadError={false}
        />
      </LocalizationProvider>
    )
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Gỡ bot Fixture operations bot" })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("heading", {
        name: viDictionary.telegram.bot.sectionTitle,
      })
    ).toHaveFocus()
  })
})

describe("Telegram destination test message eligibility", () => {
  afterEach(() => cleanup())

  it("disables testing when a readable linked bot is inactive", () => {
    renderConfiguration({
      ...data,
      botConnections: [{ id: 1, status: "DISABLED" }],
      sectionAccess: {
        ...data.sectionAccess,
        botConnections: true,
        destinations: true,
      },
      manageAccess: {
        ...data.manageAccess,
        destinations: true,
      },
    })

    const button = screen.getByRole("button", {
      name: viDictionary.telegram.destination.testMessageAction.replace(
        "{destination}",
        "Operations"
      ),
    })
    expect(button).toHaveAttribute("aria-disabled", "true")
    expect(button).toHaveAccessibleDescription(
      viDictionary.telegram.destination.testMessageInactive
    )
  })

  it("keeps the action available when bot state is hidden by separate read permission", () => {
    renderConfiguration({
      ...data,
      sectionAccess: {
        ...data.sectionAccess,
        botConnections: false,
        destinations: true,
      },
      manageAccess: {
        ...data.manageAccess,
        destinations: true,
      },
    })

    const button = screen.getByRole("button", {
      name: viDictionary.telegram.destination.testMessageAction.replace(
        "{destination}",
        "Operations"
      ),
    })
    expect(button).not.toHaveAttribute("aria-disabled", "true")
  })
})

describe("Telegram destination link dialog", () => {
  const botConnections = [
    { id: 1, displayLabel: "Market bot", status: "ACTIVE" as const },
    { id: 2, displayLabel: "Operations bot", status: "ACTIVE" as const },
  ]
  const linkToken = {
    botConnectionId: 2,
    token: "ExampleLinkToken0123456789ABCDEF",
    startCommand: "/start ExampleLinkToken0123456789ABCDEF",
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  }

  beforeEach(() => {
    vi.mocked(createTelegramLinkToken).mockReset()
    vi.mocked(toast.success).mockClear()
    vi.mocked(toast.error).mockClear()
    routerRefresh.mockClear()
  })

  afterEach(() => cleanup())

  function linkableData(canReadDestinations = true) {
    return {
      ...data,
      botConnections,
      destinations: [],
      sectionAccess: {
        ...data.sectionAccess,
        botConnections: true,
        destinations: canReadDestinations,
      },
      manageAccess: {
        ...data.manageAccess,
        destinations: true,
      },
    }
  }

  async function openAndSelectBot(user: ReturnType<typeof userEvent.setup>) {
    await user.click(
      screen.getByRole("button", {
        name: viDictionary.telegram.destination.link,
      })
    )
    const botSelect = screen.getByRole("combobox", {
      name: viDictionary.telegram.destination.commandBot,
    })
    await user.click(botSelect)
    await user.click(screen.getByRole("option", { name: "Operations bot" }))
    return screen.getByRole("dialog")
  }

  it("posts the selected bot and shows only the pending response until readback", async () => {
    const user = userEvent.setup()
    vi.mocked(createTelegramLinkToken).mockResolvedValue({
      success: true,
      data: linkToken,
    })
    const currentData = linkableData()
    const { rerender } = renderConfiguration(currentData)

    const dialog = await openAndSelectBot(user)
    await user.click(
      within(dialog).getByRole("button", {
        name: viDictionary.telegram.destination.createCommand,
      })
    )

    await waitFor(() =>
      expect(createTelegramLinkToken).toHaveBeenCalledWith({
        botConnectionId: 2,
      })
    )
    expect(
      await within(dialog).findByText(
        viDictionary.telegram.destination.awaitingVerification,
        { exact: true }
      )
    ).toBeVisible()
    expect(
      within(dialog).getByText("Operations bot", { exact: true })
    ).toBeVisible()
    expect(
      screen.getByLabelText(viDictionary.telegram.destination.linkCommand)
    ).toHaveValue(linkToken.startCommand)
    expect(screen.getByText(/Hết hạn:/)).toBeVisible()
    expect(screen.queryByText("Đã xác minh", { exact: true })).toBeNull()

    const closeButtons = within(dialog).getAllByRole("button", {
      name: viDictionary.common.close,
    })
    await user.click(closeButtons[1]!)
    await waitFor(() => expect(routerRefresh).toHaveBeenCalledTimes(1))
    expect(screen.queryByText("Verified channel", { exact: true })).toBeNull()

    const apiReadback = {
      id: 31,
      botConnectionId: 2,
      chatId: "-100123",
      chatType: "CHANNEL" as const,
      displayLabel: "Verified channel",
      status: "DISABLED" as const,
    }
    rerender(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <TelegramConfigurationPage
          data={{ ...currentData, destinations: [apiReadback] }}
        />
      </LocalizationProvider>
    )
    expect(screen.getByText("Verified channel")).toBeVisible()
    expect(
      screen.getByText(viDictionary.telegram.statuses.DISABLED, { exact: true })
    ).toBeVisible()
  })

  it("keeps token creation available with manage permission but does not read without read permission", async () => {
    const user = userEvent.setup()
    vi.mocked(createTelegramLinkToken).mockResolvedValue({
      success: true,
      data: linkToken,
    })
    renderConfiguration(linkableData(false))

    const dialog = await openAndSelectBot(user)
    await user.click(
      within(dialog).getByRole("button", {
        name: viDictionary.telegram.destination.createCommand,
      })
    )

    expect(
      await within(dialog).findByText(
        viDictionary.telegram.destination.awaitingVerification,
        { exact: true }
      )
    ).toBeVisible()
    expect(
      within(dialog).getByText(
        viDictionary.telegram.destination.destinationReadPermissionRequired
      )
    ).toBeVisible()

    await user.click(
      within(dialog).getAllByRole("button", {
        name: viDictionary.common.close,
      })[1]!
    )
    expect(routerRefresh).not.toHaveBeenCalled()
  })

  it("does not report a token as successful when the response bot is no longer active", async () => {
    const user = userEvent.setup()
    vi.mocked(createTelegramLinkToken).mockResolvedValue({
      success: true,
      data: { ...linkToken, botConnectionId: 99 },
    })
    renderConfiguration(linkableData())
    const dialog = await openAndSelectBot(user)
    await user.click(
      within(dialog).getByRole("button", {
        name: viDictionary.telegram.destination.createCommand,
      })
    )

    expect(
      await within(dialog).findByText(
        viDictionary.telegram.destination.botUnavailable
      )
    ).toBeVisible()
    expect(
      within(dialog).queryByText(
        viDictionary.telegram.destination.awaitingVerification,
        { exact: true }
      )
    ).toBeNull()
    expect(toast.success).not.toHaveBeenCalledWith(
      viDictionary.telegram.destination.linkCreated
    )
  })

  it("shows token permission failures without a pending state", async () => {
    const user = userEvent.setup()
    vi.mocked(createTelegramLinkToken).mockResolvedValue({
      success: false,
      error: "Permission denied",
    })
    renderConfiguration(linkableData())
    const dialog = await openAndSelectBot(user)
    await user.click(
      within(dialog).getByRole("button", {
        name: viDictionary.telegram.destination.createCommand,
      })
    )

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Permission denied"
    )
    expect(
      within(dialog).queryByText(
        viDictionary.telegram.destination.awaitingVerification,
        { exact: true }
      )
    ).toBeNull()
    expect(toast.success).not.toHaveBeenCalledWith(
      viDictionary.telegram.destination.linkCreated
    )
  })
})
