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

const { routerRefresh } = vi.hoisted(() => ({
  routerRefresh: vi.fn(),
}))

vi.mock("@/app/api/telegram/action", () => ({
  createTelegramBotConnection: vi.fn(),
  createTelegramLinkToken: vi.fn(),
  createTelegramMarketAnalysisSchedule: vi.fn(),
  deleteTelegramBotConnection: vi.fn(),
  reconnectTelegramBotConnection: vi.fn(),
  deleteTelegramDestination: vi.fn(),
  deleteTelegramMarketAnalysisSchedule: vi.fn(),
  disableTelegramBotConnection: vi.fn(),
  disableTelegramMarketAnalysisSchedule: vi.fn(),
  sendTelegramTestMessage: vi.fn(),
  updateTelegramFeatureSetting: vi.fn(),
  updateTelegramMarketAnalysisSchedule: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}))

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}))

import {
  createTelegramBotConnection,
  createTelegramLinkToken,
  deleteTelegramBotConnection,
  deleteTelegramDestination,
  reconnectTelegramBotConnection,
  deleteTelegramMarketAnalysisSchedule,
  updateTelegramFeatureSetting,
  updateTelegramMarketAnalysisSchedule,
} from "@/app/api/telegram/action"
import { toast } from "sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { en as enDictionary } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import type {
  TelegramBotConnectionResponse,
  TelegramBotConnectionReadback,
  TelegramConfigurationData,
} from "@/app/lib/telegram/definitions"
import { BotConnectionsCard } from "@/app/[lang]/(main)/telegram/telegram-bot-connections"
import {
  TelegramConfigurationPage,
  TelegramConfigurationSkeleton,
} from "@/app/[lang]/(main)/telegram/telegram-configuration"

const destination = {
  id: 8,
  botConnectionId: 1,
  chatId: "chat-8",
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
  destinationsLoadError: false,
  featureSettings: [],
  featureSettingsLoadError: false,
  economicCalendarSettings: [],
  economicCalendarWorkspace: { id: 7, name: "Workspace" },
  economicCalendarLoadError: false,
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
  currentWorkspaceLoadError: false,
  watchlistAssetsLoadError: false,
  sectionAccess: {
    botConnections: false,
    destinations: true,
    featureSettings: true,
    economicCalendarRouting: false,
    marketNewsRouting: true,
    schedules: true,
    watchlistAssets: true,
  },
  manageAccess: {
    botConnections: false,
    botConnectionsUpdate: false,
    botConnectionsDelete: false,
    destinations: false,
    featureSettings: false,
    economicCalendarRouting: false,
    marketNewsRouting: false,
  },
  scheduleActions: { create: true, update: true, delete: true },
}

const selectControlledWarning =
  "Base UI: A component is changing the uncontrolled value state of Select to be controlled."

function renderConfiguration(
  configurationData: TelegramConfigurationData = data,
  access: {
    canCreateBotConnections?: boolean
  } = {}
) {
  return render(
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
      <TelegramConfigurationPage data={configurationData} {...access} />
    </LocalizationProvider>
  )
}

function getFeatureRouteContainer(label: string) {
  const cell = screen
    .getAllByText(label)
    .find((element) => element.closest("[data-feature-key]"))

  if (!cell)
    throw new Error(`Could not find a feature route containing "${label}"`)
  return cell.closest("[data-feature-key]") as HTMLElement
}

function destinationSelectorName(route: string) {
  return viDictionary.telegram.routing.destinationSelectorAria.replace(
    "{route}",
    route
  )
}

describe("Telegram destination selector accessible names", () => {
  afterEach(() => cleanup())

  it.each([
    [
      "en",
      enDictionary,
      "Market news alerts",
      "Destination for Market news alerts",
      "Remove the destination for Market news alerts",
    ],
    [
      "vi",
      viDictionary,
      "Cảnh báo tin thị trường",
      "Điểm nhận cho Cảnh báo tin thị trường",
      "Bỏ điểm nhận của Cảnh báo tin thị trường",
    ],
  ] as const)(
    "names the market destination selector with its purpose and route in %s",
    (locale, dictionary, routeLabel, destinationName, clearName) => {
      render(
        <LocalizationProvider locale={locale} dictionary={dictionary}>
          <TelegramConfigurationPage
            data={{
              ...data,
              featureSettings: [featureSettings[1]],
              manageAccess: { ...data.manageAccess, marketNewsRouting: true },
            }}
          />
        </LocalizationProvider>
      )

      const marketRow = getFeatureRouteContainer(routeLabel)
      const destinationSelect = within(marketRow).getByRole("combobox", {
        name: destinationName,
      })
      expect(destinationSelect).toBeVisible()
      expect(
        within(marketRow).getByRole("button", { name: clearName })
      ).toBeVisible()
    }
  )
})

function economicCalendarData(
  settings: TelegramConfigurationData["economicCalendarSettings"] = [],
  overrides: Partial<TelegramConfigurationData> = {}
): TelegramConfigurationData {
  return {
    ...data,
    destinations: [],
    featureSettings: [],
    schedules: [],
    currentWorkspace: null,
    economicCalendarSettings: settings,
    economicCalendarWorkspace: { id: 7, name: "Workspace" },
    economicCalendarLoadError: false,
    sectionAccess: {
      ...data.sectionAccess,
      botConnections: false,
      destinations: false,
      featureSettings: false,
      economicCalendarRouting: true,
      marketNewsRouting: false,
      schedules: false,
      watchlistAssets: false,
    },
    manageAccess: {
      ...data.manageAccess,
      botConnections: false,
      destinations: false,
      featureSettings: false,
      economicCalendarRouting: true,
      marketNewsRouting: false,
    },
    scheduleActions: { create: false, update: false, delete: false },
    ...overrides,
  }
}

const economicCalendarSetting = featureSettings[0]

describe("Telegram configuration loading permissions", () => {
  afterEach(() => cleanup())

  it("keeps the route-only fallback in the same responsive page shell", () => {
    const { container } = render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <TelegramConfigurationSkeleton
          sectionAccess={economicCalendarData().sectionAccess}
        />
      </LocalizationProvider>
    )

    const shell = container.firstElementChild
    expect(shell).toHaveClass("grid", "w-full", "min-w-0")
    expect(shell?.children).toHaveLength(2)
    expect(
      screen.getByTestId("telegram-infrastructure-skeleton")
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId("telegram-readiness-skeleton")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId("telegram-readiness-summary")
    ).not.toBeInTheDocument()
    expect(screen.queryByText(destination.displayLabel)).not.toBeInTheDocument()

    const fallbackClassName = shell?.className
    cleanup()
    const resolved = renderConfiguration(economicCalendarData())
    expect(resolved.container.firstElementChild?.className).toBe(
      fallbackClassName
    )
  })

  it("reserves a routing readiness slot only with separate workspace read access", () => {
    render(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <TelegramConfigurationSkeleton
          sectionAccess={economicCalendarData().sectionAccess}
          canReadWorkspace
        />
      </LocalizationProvider>
    )

    expect(
      screen.getByTestId("telegram-readiness-skeleton")
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId("telegram-readiness-summary")
    ).not.toBeInTheDocument()
    expect(screen.queryByText(destination.displayLabel)).not.toBeInTheDocument()

    cleanup()
    renderConfiguration(
      economicCalendarData([], { currentWorkspace: data.currentWorkspace })
    )
    expect(screen.getByTestId("telegram-readiness-summary")).toBeInTheDocument()
  })

  it("does not report an empty destination list after its read failed", () => {
    renderConfiguration({
      ...data,
      destinations: [],
      destinationsLoadError: true,
    })

    const summary = screen.getByTestId("telegram-readiness-summary")
    expect(
      within(summary).queryByText(
        viDictionary.telegram.readiness.activeDestinations.replace(
          "{count}",
          "0"
        )
      )
    ).not.toBeInTheDocument()
    expect(
      within(summary).queryByText(viDictionary.telegram.readiness.needsLink)
    ).not.toBeInTheDocument()
  })
})

describe("Economic calendar route permissions and persistence", () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    if (!window.PointerEvent) {
      Object.defineProperty(window, "PointerEvent", {
        configurable: true,
        value: MouseEvent,
      })
    }
    vi.mocked(updateTelegramFeatureSetting).mockReset()
    vi.mocked(toast.error).mockReset()
    vi.mocked(toast.success).mockReset()
    routerRefresh.mockReset()
  })

  it("keeps Market News before Economic Calendar when both routes are readable", () => {
    const bothRouteAccess = economicCalendarData([], {
      sectionAccess: {
        ...economicCalendarData().sectionAccess,
        marketNewsRouting: true,
      },
    })
    renderConfiguration(bothRouteAccess)

    const marketNewsRoute = getFeatureRouteContainer(
      viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
    )
    const economicCalendarRoute = getFeatureRouteContainer(
      viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
    )

    expect(
      marketNewsRoute.compareDocumentPosition(economicCalendarRoute) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it("shows its saved route without granting destination, workspace, or schedule reads", () => {
    renderConfiguration(
      economicCalendarData([economicCalendarSetting], {
        manageAccess: { ...data.manageAccess, economicCalendarRouting: false },
      })
    )

    const card = screen.getByTestId("economic-calendar-routing-card")
    expect(card).toHaveTextContent(destination.displayLabel)
    expect(card).toHaveTextContent(
      viDictionary.telegram.routing.destinationReadOnly
    )
    expect(
      within(card).queryByRole("combobox", {
        name: destinationSelectorName(
          viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
        ),
      })
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId("market-news-routing-card")).toBeNull()
    expect(
      screen.queryByText(viDictionary.telegram.schedule.panelTitle)
    ).toBeNull()
    expect(screen.queryByTestId("telegram-readiness-summary")).toBeNull()
  })

  it("keeps the saved destination visible and allows retry and clear when the destination list fails", async () => {
    const user = userEvent.setup()
    renderConfiguration(
      economicCalendarData([economicCalendarSetting], {
        destinations: [],
        destinationsLoadError: true,
        sectionAccess: {
          ...economicCalendarData().sectionAccess,
          destinations: true,
        },
      })
    )

    const card = screen.getByTestId("economic-calendar-routing-card")
    expect(card).toHaveTextContent(destination.displayLabel)
    expect(card).toHaveTextContent(viDictionary.telegram.destination.loadError)
    expect(
      within(card).queryByRole("combobox", {
        name: destinationSelectorName(
          viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
        ),
      })
    ).not.toBeInTheDocument()
    expect(within(card).queryByRole("option")).not.toBeInTheDocument()

    await user.click(
      within(card).getByRole("button", {
        name: viDictionary.telegram.routing.retry,
      })
    )
    expect(routerRefresh).toHaveBeenCalledTimes(1)

    vi.mocked(updateTelegramFeatureSetting).mockResolvedValueOnce({
      success: true,
      data: {
        ...economicCalendarSetting,
        enabled: false,
        destination: null,
      },
    })
    await user.click(
      within(card).getByRole("button", {
        name: viDictionary.telegram.routing.destinationClearAria.replace(
          "{route}",
          viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
        ),
      })
    )

    await waitFor(() =>
      expect(updateTelegramFeatureSetting).toHaveBeenCalledWith({
        featureKey: "ECONOMIC_CALENDAR_ALERT",
        workspaceId: 7,
        destinationId: null,
        enabled: false,
      })
    )
    expect(toast.success).toHaveBeenCalledWith(
      viDictionary.telegram.routing.destinationClearSuccess
    )
    expect(routerRefresh).toHaveBeenCalledTimes(2)
  })

  it("can pause an inactive route and confirms before refreshing", async () => {
    const user = userEvent.setup()
    const inactiveSetting = {
      ...economicCalendarSetting,
      enabled: true,
      destination: { ...destination, status: "DISABLED" as const },
    }
    renderConfiguration(economicCalendarData([inactiveSetting]))
    vi.mocked(updateTelegramFeatureSetting).mockResolvedValueOnce({
      success: true,
      data: { ...inactiveSetting, enabled: false },
    })

    const routeSwitch = within(
      screen.getByTestId("economic-calendar-routing-card")
    ).getByRole("switch")
    await user.click(routeSwitch)

    await waitFor(() =>
      expect(updateTelegramFeatureSetting).toHaveBeenCalledWith({
        featureKey: "ECONOMIC_CALENDAR_ALERT",
        workspaceId: 7,
        enabled: false,
      })
    )
    expect(routerRefresh).toHaveBeenCalledTimes(1)
    expect(toast.success).toHaveBeenCalledWith(
      viDictionary.telegram.routing.disabledSuccess
    )
  })

  it("keeps saved controls hidden until a complete matching setting is read back", async () => {
    const user = userEvent.setup()
    const view = renderConfiguration(
      economicCalendarData([economicCalendarSetting], {
        destinations: [destination],
        sectionAccess: {
          ...economicCalendarData().sectionAccess,
          destinations: true,
        },
      })
    )
    vi.mocked(updateTelegramFeatureSetting).mockResolvedValueOnce({
      success: true,
      data: { readbackUnverified: true },
    })

    const card = screen.getByTestId("economic-calendar-routing-card")
    const clear = within(card).getByRole("button", {
      name: viDictionary.telegram.routing.destinationClearAria.replace(
        "{route}",
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      ),
    })
    clear.focus()
    await user.keyboard("{Enter}")

    const unverifiedStatus = await within(card).findByRole("status")
    expect(unverifiedStatus).toHaveTextContent(
      viDictionary.telegram.routing.economicCalendarReadbackUnverified
    )
    expect(unverifiedStatus).toHaveFocus()
    expect(within(card).queryByRole("switch")).not.toBeInTheDocument()
    expect(within(card).queryByRole("combobox")).not.toBeInTheDocument()
    expect(toast.success).not.toHaveBeenCalled()
    expect(routerRefresh).toHaveBeenCalledTimes(1)

    await user.click(
      within(card).getByRole("button", {
        name: viDictionary.telegram.routing.retry,
      })
    )
    expect(routerRefresh).toHaveBeenCalledTimes(2)

    view.rerender(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <TelegramConfigurationPage
          data={economicCalendarData([], {
            destinations: [destination],
            sectionAccess: {
              ...economicCalendarData().sectionAccess,
              destinations: true,
            },
          })}
        />
      </LocalizationProvider>
    )
    const emptyReadbackCard = screen.getByTestId(
      "economic-calendar-routing-card"
    )
    expect(within(emptyReadbackCard).getByRole("status")).toHaveTextContent(
      viDictionary.telegram.routing.economicCalendarReadbackUnverified
    )
    expect(
      within(emptyReadbackCard).queryByRole("switch")
    ).not.toBeInTheDocument()
    expect(
      within(emptyReadbackCard).queryByRole("combobox")
    ).not.toBeInTheDocument()

    view.rerender(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <TelegramConfigurationPage
          data={economicCalendarData([
            {
              ...economicCalendarSetting,
              enabled: false,
              destination: null,
            },
          ])}
        />
      </LocalizationProvider>
    )
    await waitFor(() =>
      expect(
        within(
          screen.getByTestId("economic-calendar-routing-card")
        ).queryByText(
          viDictionary.telegram.routing.economicCalendarReadbackUnverified
        )
      ).not.toBeInTheDocument()
    )
    expect(
      within(screen.getByTestId("economic-calendar-routing-card")).getByRole(
        "switch"
      )
    ).not.toBeChecked()
  })

  it("clears atomically and restores focus to the switch when language is unavailable and destinations are unreadable", async () => {
    const user = userEvent.setup()
    const view = renderConfiguration(
      economicCalendarData([economicCalendarSetting], {
        languageCatalogError: true,
        languages: [],
      })
    )
    vi.mocked(updateTelegramFeatureSetting).mockResolvedValueOnce({
      success: true,
      data: {
        ...economicCalendarSetting,
        enabled: false,
        destination: null,
      },
    })

    const card = screen.getByTestId("economic-calendar-routing-card")
    const clear = within(card).getByRole("button", {
      name: viDictionary.telegram.routing.destinationClearAria.replace(
        "{route}",
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      ),
    })
    clear.focus()
    await user.keyboard("{Enter}")
    await waitFor(() =>
      expect(updateTelegramFeatureSetting).toHaveBeenCalledWith({
        featureKey: "ECONOMIC_CALENDAR_ALERT",
        workspaceId: 7,
        destinationId: null,
        enabled: false,
      })
    )
    expect(routerRefresh).toHaveBeenCalledTimes(1)

    view.rerender(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <TelegramConfigurationPage
          data={economicCalendarData(
            [
              {
                ...economicCalendarSetting,
                enabled: false,
                destination: null,
              },
            ],
            { languageCatalogError: true, languages: [] }
          )}
        />
      </LocalizationProvider>
    )
    await waitFor(() =>
      expect(
        within(screen.getByTestId("economic-calendar-routing-card")).getByRole(
          "switch"
        )
      ).toHaveFocus()
    )
  })

  it("keeps assignment and enable failures Off without presenting an unsaved target", async () => {
    const user = userEvent.setup()
    vi.mocked(updateTelegramFeatureSetting)
      .mockResolvedValueOnce({ success: false, error: "Assignment failed" })
      .mockResolvedValueOnce({
        success: false,
        error: "Destination eligibility failed",
      })
    renderConfiguration(
      economicCalendarData([], {
        destinations: [destination],
        sectionAccess: {
          ...economicCalendarData().sectionAccess,
          destinations: true,
        },
      })
    )

    const card = screen.getByTestId("economic-calendar-routing-card")
    const selector = within(card).getByRole("combobox", {
      name: destinationSelectorName(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      ),
    })
    await user.click(selector)
    await user.click(await screen.findByRole("option", { name: "Operations" }))

    await waitFor(() =>
      expect(updateTelegramFeatureSetting).toHaveBeenCalledWith({
        featureKey: "ECONOMIC_CALENDAR_ALERT",
        workspaceId: 7,
        enabled: false,
        destinationId: 8,
      })
    )
    expect(selector).not.toHaveTextContent(destination.displayLabel)
    expect(toast.error).toHaveBeenCalledWith("Assignment failed")

    const routeSwitch = within(card).getByRole("switch")
    await user.click(routeSwitch)
    await waitFor(() =>
      expect(updateTelegramFeatureSetting).toHaveBeenLastCalledWith({
        featureKey: "ECONOMIC_CALENDAR_ALERT",
        workspaceId: 7,
        enabled: true,
      })
    )
    expect(routeSwitch).not.toBeChecked()
    expect(toast.error).toHaveBeenLastCalledWith(
      "Destination eligibility failed"
    )
    expect(toast.success).not.toHaveBeenCalled()
    expect(routerRefresh).not.toHaveBeenCalled()
  })

  it("fails closed on load errors and incomplete route readback", () => {
    renderConfiguration(
      economicCalendarData([], { economicCalendarLoadError: true })
    )
    let card = screen.getByTestId("economic-calendar-routing-card")
    expect(card).toHaveTextContent(
      viDictionary.telegram.routing.settingsLoadError
    )
    expect(within(card).queryByRole("switch")).not.toBeInTheDocument()

    cleanup()
    const incompleteSetting = { ...economicCalendarSetting }
    Reflect.deleteProperty(incompleteSetting, "id")
    renderConfiguration(economicCalendarData([incompleteSetting]))
    card = screen.getByTestId("economic-calendar-routing-card")
    expect(card).toHaveTextContent(
      viDictionary.telegram.routing.economicCalendarReadbackUnverified
    )
    expect(within(card).queryByRole("switch")).not.toBeInTheDocument()
    expect(within(card).queryByRole("combobox")).not.toBeInTheDocument()
  })
})

const botConnection: TelegramBotConnectionResponse = {
  id: 12,
  botId: 1012,
  botUsername: "new_fixture_bot",
  displayLabel: "New fixture bot",
  status: "ACTIVE",
}

function renderBotConnectionsCard({
  botConnections = [],
  canRead = false,
  canUpdate = false,
  canCreate = false,
  canDelete = false,
  loadError = false,
}: {
  botConnections?: TelegramBotConnectionReadback[]
  canRead?: boolean
  canUpdate?: boolean
  canCreate?: boolean
  canDelete?: boolean
  loadError?: boolean
} = {}) {
  return render(
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
      <BotConnectionsCard
        botConnections={botConnections}
        canRead={canRead}
        canUpdate={canUpdate}
        canCreate={canCreate}
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
    if (!window.PointerEvent) {
      Object.defineProperty(window, "PointerEvent", {
        configurable: true,
        value: MouseEvent,
      })
    }
    vi.mocked(deleteTelegramBotConnection).mockReset()
    vi.mocked(deleteTelegramMarketAnalysisSchedule).mockReset()
    vi.mocked(updateTelegramFeatureSetting).mockReset()
    vi.mocked(toast.error).mockReset()
    vi.mocked(toast.success).mockReset()
    routerRefresh.mockReset()
  })

  it("lists schedules across workspaces, omits REMOVED, and handles null destinations", () => {
    const inactive = {
      ...schedule,
      id: 12,
      name: "Legacy inactive schedule",
      workspaceId: 12,
      workspaceName: "Research workspace",
      destination: null,
      status: "DISABLED" as const,
    }

    renderConfiguration({
      ...data,
      schedules: [
        schedule,
        inactive,
        { ...schedule, id: 13, name: "Removed schedule", status: "REMOVED" },
      ],
      sectionAccess: {
        ...data.sectionAccess,
        featureSettings: false,
        marketNewsRouting: false,
      },
      scheduleActions: { create: false, update: true, delete: true },
    })

    expect(screen.getAllByText("Morning analysis").length).toBeGreaterThan(0)
    expect(
      screen.getAllByText("Legacy inactive schedule").length
    ).toBeGreaterThan(0)
    expect(screen.getAllByText(/Research workspace/).length).toBeGreaterThan(0)
    expect(
      screen.getAllByText((_, element) =>
        Boolean(
          element?.textContent?.includes(
            viDictionary.telegram.schedule.noDestination
          )
        )
      ).length
    ).toBeGreaterThan(0)
    expect(screen.queryByText("Removed schedule")).not.toBeInTheDocument()

    const inactiveRows = screen
      .getAllByText("Legacy inactive schedule")
      .map((element) => element.closest("article, tr"))
      .filter((row): row is HTMLElement => row instanceof HTMLElement)
    expect(inactiveRows.length).toBeGreaterThan(0)
    inactiveRows.forEach((row) => {
      expect(
        within(row).getByText(viDictionary.telegram.schedule.inactiveStatus)
      ).toBeVisible()
      expect(
        within(row).queryByRole("button", {
          name: viDictionary.telegram.schedule.editTrigger,
        })
      ).not.toBeInTheDocument()
      expect(
        within(row).getByRole("button", {
          name: viDictionary.telegram.schedule.deleteTrigger,
        })
      ).toBeVisible()
    })
  })

  it("shows Create to a create-only role without exposing the schedule list", () => {
    renderConfiguration({
      ...data,
      sectionAccess: {
        ...data.sectionAccess,
        featureSettings: false,
        marketNewsRouting: false,
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
    expect(screen.queryByText("Morning analysis")).not.toBeInTheDocument()
  })

  it.each([
    ["watchlist read permission is absent", false, false],
    ["watchlist read fails", true, true],
  ] as const)(
    "preserves the saved asset when %s",
    async (_state, canReadWatchlist, watchlistAssetsLoadError) => {
      const user = userEvent.setup()
      vi.mocked(updateTelegramMarketAnalysisSchedule).mockResolvedValue({
        success: true,
        data: schedule,
      })
      renderConfiguration({
        ...data,
        watchlistAssets: [],
        watchlistAssetsLoadError,
        sectionAccess: {
          ...data.sectionAccess,
          watchlistAssets: canReadWatchlist,
        },
        scheduleActions: { create: false, update: true, delete: false },
      })

      await user.click(
        screen.getAllByRole("button", {
          name: viDictionary.telegram.schedule.editTrigger,
        })[0]
      )
      const dialog = screen.getByRole("dialog")
      expect(
        within(dialog).getByRole("combobox", {
          name: viDictionary.telegram.schedule.assetLabel,
        })
      ).toBeDisabled()
      expect(
        within(dialog).getByText(
          viDictionary.telegram.schedule.assetPreservedWatchlistDescription,
          { exact: true }
        )
      ).toBeVisible()

      const name = within(dialog).getByLabelText(
        viDictionary.telegram.schedule.nameLabel
      )
      await user.clear(name)
      await user.type(name, "Updated analysis")
      await user.click(
        within(dialog).getByRole("button", {
          name: viDictionary.telegram.schedule.saveSchedule,
        })
      )

      await waitFor(() =>
        expect(updateTelegramMarketAnalysisSchedule).toHaveBeenCalledWith(11, {
          name: "Updated analysis",
          workspaceId: 7,
          destinationId: 8,
          assetId: 9,
          timezone: "Asia/Bangkok",
          localTimes: ["09:00"],
          outputLanguageIsoCode: undefined,
        })
      )
      expect(routerRefresh).toHaveBeenCalledTimes(1)
    }
  )

  it("keeps Create, Edit, and Remove independently permission-gated", () => {
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

    cleanup()
    renderConfiguration({
      ...data,
      scheduleActions: { create: false, update: false, delete: true },
    })
    expect(
      screen.queryByRole("button", {
        name: viDictionary.telegram.schedule.editTrigger,
      })
    ).not.toBeInTheDocument()
    expect(
      screen.getAllByRole("button", {
        name: viDictionary.telegram.schedule.deleteTrigger,
      }).length
    ).toBeGreaterThan(0)
  })

  it("keeps Scheduled analysis available without Feature routing permission", () => {
    renderConfiguration({
      ...data,
      sectionAccess: {
        ...data.sectionAccess,
        featureSettings: false,
        marketNewsRouting: false,
      },
    })

    expect(
      screen.getByRole("heading", {
        name: viDictionary.telegram.schedule.panelTitle,
      })
    ).toBeVisible()
    expect(screen.getAllByText("Morning analysis").length).toBeGreaterThan(0)
    expect(
      screen.getByText(viDictionary.telegram.routing.accessLimited)
    ).toBeVisible()
  })

  it("keeps Scheduled analysis available when Market news read fails", () => {
    renderConfiguration({
      ...data,
      featureSettingsLoadError: true,
      sectionAccess: {
        ...data.sectionAccess,
        featureSettings: false,
        marketNewsRouting: true,
      },
    })

    expect(
      screen.getByRole("heading", {
        name: viDictionary.telegram.schedule.panelTitle,
      })
    ).toBeVisible()
    expect(screen.getAllByText("Morning analysis").length).toBeGreaterThan(0)
    expect(screen.getByRole("alert")).toHaveTextContent(
      viDictionary.telegram.routing.settingsLoadError
    )
  })

  it("uses dedicated read/update permissions for market news and keeps schedule read separate", () => {
    const marketOnlyData: TelegramConfigurationData = {
      ...data,
      destinations: [],
      featureSettings: [featureSettings[1]],
      schedules: [],
      sectionAccess: {
        ...data.sectionAccess,
        botConnections: false,
        destinations: false,
        featureSettings: false,
        marketNewsRouting: true,
        schedules: false,
        watchlistAssets: false,
      },
      manageAccess: {
        ...data.manageAccess,
        featureSettings: true,
        marketNewsRouting: false,
      },
    }

    renderConfiguration(marketOnlyData)

    const readiness = screen.getByTestId("telegram-readiness-summary")
    expect(readiness).toHaveTextContent("0/1 luồng đã bật trong Workspace.")
    expect(
      within(readiness).queryByText(viDictionary.telegram.readiness.bot)
    ).not.toBeInTheDocument()
    expect(
      within(readiness).queryByText(
        viDictionary.telegram.readiness.destinations
      )
    ).not.toBeInTheDocument()
    expect(
      within(readiness).queryByText(
        viDictionary.telegram.readiness.scheduledAnalysis
      )
    ).not.toBeInTheDocument()

    const marketCard = screen.getByTestId("market-news-routing-card")
    expect(
      within(marketCard).getByText(
        viDictionary.telegram.routing.destinationColumn
      )
    ).toBeVisible()
    expect(
      within(marketCard).getByText(viDictionary.telegram.routing.languageColumn)
    ).toBeVisible()
    const marketRow = getFeatureRouteContainer(
      viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
    )
    expect(
      screen.queryByText(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )
    ).not.toBeInTheDocument()
    expect(
      within(marketRow).getByRole("switch", {
        name: viDictionary.telegram.routing.switchAria.replace(
          "{route}",
          viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
        ),
      })
    ).toHaveAttribute("aria-disabled", "true")

    cleanup()
    renderConfiguration({
      ...marketOnlyData,
      manageAccess: {
        ...marketOnlyData.manageAccess,
        marketNewsRouting: true,
      },
    })

    const manageableMarketRow = getFeatureRouteContainer(
      viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
    )
    expect(
      within(manageableMarketRow).getByRole("switch", {
        name: viDictionary.telegram.routing.switchAria.replace(
          "{route}",
          viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
        ),
      })
    ).toBeEnabled()
  })

  it("shows a retry state and hides market routing controls when settings fail to load", async () => {
    const user = userEvent.setup()
    renderConfiguration({
      ...data,
      featureSettings: [],
      featureSettingsLoadError: true,
      manageAccess: { ...data.manageAccess, marketNewsRouting: true },
    })

    const marketRow = getFeatureRouteContainer(
      viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
    )
    expect(
      within(marketRow).getByText(
        viDictionary.telegram.routing.settingsLoadError
      )
    ).toBeVisible()
    expect(within(marketRow).queryByRole("switch")).not.toBeInTheDocument()
    expect(within(marketRow).queryByRole("combobox")).not.toBeInTheDocument()
    expect(marketRow).not.toHaveTextContent(viDictionary.telegram.common.paused)
    expect(marketRow).not.toHaveTextContent(
      viDictionary.telegram.routing.noDestination
    )

    await user.click(
      within(marketRow).getByRole("button", {
        name: viDictionary.telegram.routing.retry,
      })
    )

    expect(routerRefresh).toHaveBeenCalledOnce()
    expect(updateTelegramFeatureSetting).not.toHaveBeenCalled()
  })

  it("keeps Scheduled analysis visible with schedule read and no route read", () => {
    renderConfiguration({
      ...data,
      sectionAccess: {
        ...data.sectionAccess,
        featureSettings: false,
        marketNewsRouting: false,
        schedules: true,
      },
    })

    expect(
      screen.getByText(viDictionary.telegram.schedule.panelTitle)
    ).toBeVisible()
    expect(
      screen.queryByText(
        viDictionary.telegram.routeDefinitions.SCHEDULED_MARKET_ANALYSIS.label
      )
    ).not.toBeInTheDocument()
  })

  it("announces the desktop schedule read error and keeps Retry available", () => {
    const { container } = renderConfiguration({
      ...data,
      scheduleLoadError: true,
    })
    const desktopTable = container.querySelector(
      '[class~="hidden"][class~="md:block"]'
    )

    expect(desktopTable).not.toBeNull()
    expect(
      within(desktopTable as HTMLElement).getByRole("alert")
    ).toHaveTextContent(viDictionary.telegram.schedule.loadError)
    expect(
      within(desktopTable as HTMLElement).getByRole("button", {
        name: viDictionary.telegram.schedule.retry,
      })
    ).toBeEnabled()
  })

  const readinessReadFailures: {
    errorKey:
      | "botConnectionsLoadError"
      | "destinationsLoadError"
      | "featureSettingsLoadError"
      | "scheduleLoadError"
    unavailable: string
    unaffected: string
    failedData: Partial<TelegramConfigurationData>
  }[] = [
    {
      errorKey: "botConnectionsLoadError",
      unavailable: viDictionary.telegram.readiness.bot,
      unaffected: viDictionary.telegram.readiness.scheduledAnalysis,
      failedData: { botConnections: [] },
    },
    {
      errorKey: "destinationsLoadError",
      unavailable: viDictionary.telegram.readiness.destinations,
      unaffected: viDictionary.telegram.readiness.scheduledAnalysis,
      failedData: { destinations: [] },
    },
    {
      errorKey: "featureSettingsLoadError",
      unavailable: viDictionary.telegram.readiness.routing,
      unaffected: viDictionary.telegram.readiness.scheduledAnalysis,
      failedData: { featureSettings: [] },
    },
    {
      errorKey: "scheduleLoadError",
      unavailable: viDictionary.telegram.readiness.scheduledAnalysis,
      unaffected: viDictionary.telegram.readiness.routing,
      failedData: { schedules: [] },
    },
  ]

  it.each(readinessReadFailures)(
    "hides only the $unavailable readiness metric when its read fails",
    ({ errorKey, unavailable, unaffected, failedData }) => {
      const readableData: TelegramConfigurationData = {
        ...data,
        botConnections: [{ id: 12, status: "ACTIVE" }],
        featureSettings: [featureSettings[0]],
        sectionAccess: {
          ...data.sectionAccess,
          botConnections: true,
          destinations: true,
          featureSettings: true,
          marketNewsRouting: true,
          schedules: true,
        },
      }
      const failedReadData: TelegramConfigurationData = {
        ...readableData,
        ...failedData,
        [errorKey]: true,
      }

      renderConfiguration(failedReadData)

      const readiness = screen.getByTestId("telegram-readiness-summary")
      expect(readiness).not.toHaveTextContent(unavailable)
      expect(readiness).toHaveTextContent(unaffected)
    }
  )

  it("shows and updates each owned market route setting without workspace access", async () => {
    const user = userEvent.setup()
    const secondMarketSetting = {
      ...featureSettings[1],
      id: 44,
      workspaceId: 8,
      workspaceName: "Workspace Beta",
    }
    renderConfiguration({
      ...data,
      currentWorkspace: null,
      destinations: [],
      featureSettings: [featureSettings[1], secondMarketSetting],
      sectionAccess: {
        ...data.sectionAccess,
        botConnections: false,
        destinations: false,
        featureSettings: false,
        schedules: false,
      },
      manageAccess: {
        ...data.manageAccess,
        marketNewsRouting: true,
      },
    })

    const marketCards = screen.getAllByTestId("market-news-routing-card")
    expect(marketCards).toHaveLength(2)
    expect(marketCards[0]).toHaveTextContent("Workspace")
    expect(marketCards[1]).toHaveTextContent("Workspace Beta")
    expect(marketCards[0]).toHaveTextContent("Operations")
    expect(marketCards[1]).toHaveTextContent("Operations")
    expect(
      within(marketCards[0]).getByRole("combobox", {
        name: "Điểm nhận cho Cảnh báo tin thị trường — Workspace",
      })
    ).toBeDisabled()
    expect(
      within(marketCards[1]).getByRole("combobox", {
        name: "Điểm nhận cho Cảnh báo tin thị trường — Workspace Beta",
      })
    ).toBeDisabled()

    vi.mocked(updateTelegramFeatureSetting).mockResolvedValueOnce({
      success: true,
      data: secondMarketSetting,
    })
    await user.click(
      within(marketCards[1]).getByRole("combobox", {
        name: "Chọn ngôn ngữ đầu ra cho Cảnh báo tin thị trường — Workspace Beta",
      })
    )
    await user.click(
      await screen.findByRole("option", { name: "English (en)" })
    )
    await waitFor(() =>
      expect(updateTelegramFeatureSetting).toHaveBeenCalledWith({
        featureKey: "MARKET_NEWS_ALERT",
        workspaceId: 8,
        outputLanguageIsoCode: "en",
      })
    )
  })

  it("marks a market setting with missing enabled as unverified", () => {
    const incompleteSetting = { ...featureSettings[1] }
    Reflect.deleteProperty(incompleteSetting, "enabled")

    renderConfiguration({
      ...data,
      featureSettings: [incompleteSetting],
      sectionAccess: {
        ...data.sectionAccess,
        featureSettings: false,
        schedules: false,
      },
      manageAccess: {
        ...data.manageAccess,
        marketNewsRouting: true,
      },
    })

    const marketCard = screen.getByTestId("market-news-routing-card")
    expect(marketCard).toHaveTextContent(
      viDictionary.telegram.routing.readbackUnverified
    )
    expect(within(marketCard).queryByRole("switch")).not.toBeInTheDocument()
    expect(within(marketCard).queryByRole("combobox")).not.toBeInTheDocument()
    expect(marketCard).not.toHaveTextContent(
      viDictionary.telegram.common.paused
    )
    expect(
      screen.getByTestId("telegram-readiness-summary")
    ).not.toHaveTextContent("0/1 luồng đã bật")
  })

  it("does not identify a market setting when the route key is missing", () => {
    const unidentifiedSetting = { ...featureSettings[1] }
    Reflect.deleteProperty(unidentifiedSetting, "featureKey")
    Reflect.deleteProperty(unidentifiedSetting, "workspaceId")
    Reflect.deleteProperty(unidentifiedSetting, "enabled")

    renderConfiguration({
      ...data,
      currentWorkspace: null,
      featureSettings: [unidentifiedSetting],
      sectionAccess: {
        ...data.sectionAccess,
        featureSettings: false,
        schedules: false,
      },
      manageAccess: {
        ...data.manageAccess,
        marketNewsRouting: true,
      },
    })

    const marketCard = screen.getByTestId("market-news-routing-card")
    expect(marketCard).toHaveTextContent(
      viDictionary.telegram.routing.readbackUnverified
    )
    expect(marketCard).not.toHaveTextContent("Operations")
    expect(within(marketCard).queryByRole("switch")).not.toBeInTheDocument()
    expect(within(marketCard).queryByRole("combobox")).not.toBeInTheDocument()
  })

  it("does not assign a market setting without its workspace id", () => {
    const settingWithoutWorkspace = { ...featureSettings[1] }
    Reflect.deleteProperty(settingWithoutWorkspace, "workspaceId")

    renderConfiguration({
      ...data,
      featureSettings: [settingWithoutWorkspace],
      sectionAccess: {
        ...data.sectionAccess,
        featureSettings: false,
        schedules: false,
      },
      manageAccess: {
        ...data.manageAccess,
        marketNewsRouting: true,
      },
    })

    const marketCard = screen.getByTestId("market-news-routing-card")
    expect(marketCard).toHaveTextContent(
      viDictionary.telegram.routing.readbackUnverified
    )
    expect(marketCard).toHaveTextContent(
      viDictionary.telegram.routing.readbackWorkspaceUnknown
    )
    expect(marketCard).not.toHaveTextContent("Operations")
    expect(within(marketCard).queryByRole("switch")).not.toBeInTheDocument()
  })

  it("keeps the saved route context on failure and refreshes only after a confirmed clear", async () => {
    const user = userEvent.setup()
    const marketData: TelegramConfigurationData = {
      ...data,
      featureSettings: [featureSettings[1]],
      manageAccess: {
        ...data.manageAccess,
        marketNewsRouting: true,
      },
    }
    const view = renderConfiguration(marketData)

    const marketRow = getFeatureRouteContainer(
      viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
    )
    const clear = within(marketRow).getByRole("button", {
      name: viDictionary.telegram.routing.destinationClearAria.replace(
        "{route}",
        viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
      ),
    })
    vi.mocked(updateTelegramFeatureSetting).mockResolvedValueOnce({
      success: false,
      error: "Destination update failed",
    })

    clear.focus()
    await user.keyboard("{Enter}")

    expect(updateTelegramFeatureSetting).toHaveBeenLastCalledWith({
      featureKey: "MARKET_NEWS_ALERT",
      workspaceId: 7,
      destinationId: null,
      enabled: false,
    })
    expect(
      within(marketRow).getByRole("combobox", {
        name: destinationSelectorName(
          viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
        ),
      })
    ).toHaveTextContent(destination.displayLabel)
    expect(toast.error).toHaveBeenCalledWith("Destination update failed")
    expect(routerRefresh).not.toHaveBeenCalled()

    const clearedSetting = {
      ...featureSettings[1],
      enabled: false,
      destination: null,
    }
    vi.mocked(updateTelegramFeatureSetting).mockResolvedValueOnce({
      success: true,
      data: clearedSetting,
    })
    await user.click(clear)

    await waitFor(() => expect(routerRefresh).toHaveBeenCalledTimes(1))
    expect(toast.success).toHaveBeenCalledWith(
      viDictionary.telegram.routing.destinationClearSuccess
    )

    view.rerender(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <TelegramConfigurationPage
          data={{ ...marketData, featureSettings: [clearedSetting] }}
        />
      </LocalizationProvider>
    )
    const reloadedMarketRow = getFeatureRouteContainer(
      viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
    )
    const reloadedDestinationSelect = within(reloadedMarketRow).getByRole(
      "combobox",
      {
        name: destinationSelectorName(
          viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
        ),
      }
    )
    expect(reloadedDestinationSelect).toHaveTextContent(
      viDictionary.telegram.destination.placeholder
    )
    expect(reloadedDestinationSelect).toHaveFocus()
    expect(reloadedMarketRow).toHaveTextContent("Tiếng Việt")
    expect(
      within(reloadedMarketRow).queryByRole("button", {
        name: viDictionary.telegram.routing.destinationClearAria.replace(
          "{route}",
          viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
        ),
      })
    ).not.toBeInTheDocument()
  })

  it("does not show an unsaved destination after an API failure", async () => {
    const user = userEvent.setup()
    vi.mocked(updateTelegramFeatureSetting).mockResolvedValue({
      success: false,
      error: "Destination unavailable",
    })
    renderConfiguration({
      ...data,
      featureSettings: [featureSettings[0]],
      sectionAccess: {
        ...data.sectionAccess,
        destinations: true,
      },
      manageAccess: {
        ...data.manageAccess,
        marketNewsRouting: true,
      },
    })

    const marketRow = getFeatureRouteContainer(
      viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
    )
    const destinationSelect = within(marketRow).getByRole("combobox", {
      name: destinationSelectorName(
        viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
      ),
    })
    await user.click(destinationSelect)
    await user.click(
      await screen.findByRole("option", { name: destination.displayLabel })
    )

    expect(updateTelegramFeatureSetting).toHaveBeenCalledWith({
      featureKey: "MARKET_NEWS_ALERT",
      workspaceId: 7,
      destinationId: destination.id,
      enabled: false,
    })
    expect(destinationSelect).toHaveTextContent(
      viDictionary.telegram.destination.placeholder
    )
    expect(toast.error).toHaveBeenCalledWith("Destination unavailable")
    expect(routerRefresh).not.toHaveBeenCalled()
  })

  it("moves focus to the no-destination status after clearing an inactive target", async () => {
    const user = userEvent.setup()
    const inactiveDestination = { ...destination, status: "DISABLED" as const }
    const savedSetting = {
      ...featureSettings[1],
      destination: inactiveDestination,
    }
    const marketData: TelegramConfigurationData = {
      ...data,
      destinations: [],
      featureSettings: [savedSetting],
      manageAccess: {
        ...data.manageAccess,
        marketNewsRouting: true,
      },
    }
    const rendered = renderConfiguration(marketData)
    const marketRow = getFeatureRouteContainer(
      viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
    )
    const clear = within(marketRow).getByRole("button", {
      name: viDictionary.telegram.routing.destinationClearAria.replace(
        "{route}",
        viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
      ),
    })
    const clearedSetting = {
      ...savedSetting,
      enabled: false,
      destination: null,
    }
    vi.mocked(updateTelegramFeatureSetting).mockResolvedValueOnce({
      success: true,
      data: clearedSetting,
    })

    clear.focus()
    await user.keyboard("{Enter}")
    await waitFor(() => expect(routerRefresh).toHaveBeenCalledTimes(1))

    rendered.rerender(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <TelegramConfigurationPage
          data={{ ...marketData, featureSettings: [clearedSetting] }}
        />
      </LocalizationProvider>
    )

    const noDestinationStatus = within(
      getFeatureRouteContainer(
        viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
      )
    ).getByText(viDictionary.telegram.destination.noActiveDestination)
    await waitFor(() => expect(noDestinationStatus).toHaveFocus())
  })

  it("blocks enabling a cleared market route until an eligible destination is saved", () => {
    const clearedSetting = {
      ...featureSettings[1],
      enabled: false,
      destination: null,
    }
    renderConfiguration({
      ...data,
      featureSettings: [clearedSetting],
      manageAccess: {
        ...data.manageAccess,
        marketNewsRouting: true,
      },
    })

    const marketRow = getFeatureRouteContainer(
      viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
    )
    const routeSwitch = within(marketRow).getByRole("switch", {
      name: viDictionary.telegram.routing.switchAria.replace(
        "{route}",
        viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
      ),
    })

    expect(routeSwitch).toHaveAttribute("aria-disabled", "true")
    expect(routeSwitch).toHaveAccessibleDescription(
      viDictionary.telegram.routing.enableDestinationRequired
    )
  })

  it("can pause an enabled route with an inactive destination and reassign it while paused", async () => {
    const user = userEvent.setup()
    const inactiveDestination = {
      ...destination,
      id: 22,
      displayLabel: "Disabled destination",
      status: "DISABLED" as const,
    }
    const savedSetting = {
      ...featureSettings[1],
      enabled: true,
      destination: inactiveDestination,
    }
    const pausedSetting = { ...savedSetting, enabled: false }
    const reassignedSetting = { ...pausedSetting, destination }
    vi.mocked(updateTelegramFeatureSetting)
      .mockResolvedValueOnce({
        success: true,
        data: pausedSetting,
      })
      .mockResolvedValueOnce({
        success: true,
        data: reassignedSetting,
      })

    renderConfiguration({
      ...data,
      featureSettings: [savedSetting],
      destinations: [destination, inactiveDestination],
      manageAccess: {
        ...data.manageAccess,
        marketNewsRouting: true,
      },
    })

    const marketRow = getFeatureRouteContainer(
      viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
    )
    const routeSwitch = within(marketRow).getByRole("switch", {
      name: viDictionary.telegram.routing.switchAria.replace(
        "{route}",
        viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
      ),
    })
    expect(routeSwitch).toBeEnabled()
    expect(
      within(marketRow).getByRole("combobox", {
        name: destinationSelectorName(
          viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
        ),
      })
    ).toHaveTextContent(inactiveDestination.displayLabel)

    await user.click(routeSwitch)
    await waitFor(() =>
      expect(updateTelegramFeatureSetting).toHaveBeenLastCalledWith({
        featureKey: "MARKET_NEWS_ALERT",
        workspaceId: 7,
        enabled: false,
      })
    )
    expect(routerRefresh).toHaveBeenCalledTimes(1)

    cleanup()
    renderConfiguration({
      ...data,
      featureSettings: [pausedSetting],
      destinations: [destination, inactiveDestination],
      sectionAccess: {
        ...data.sectionAccess,
        destinations: true,
      },
      manageAccess: {
        ...data.manageAccess,
        marketNewsRouting: true,
      },
    })
    const pausedMarketRow = getFeatureRouteContainer(
      viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
    )
    expect(
      within(pausedMarketRow).getByRole("switch", {
        name: viDictionary.telegram.routing.switchAria.replace(
          "{route}",
          viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
        ),
      })
    ).not.toBeChecked()
    expect(
      within(pausedMarketRow).getByRole("combobox", {
        name: destinationSelectorName(
          viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
        ),
      })
    ).toHaveTextContent(inactiveDestination.displayLabel)
    await user.click(
      within(pausedMarketRow).getByRole("combobox", {
        name: destinationSelectorName(
          viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
        ),
      })
    )
    await user.click(
      await screen.findByRole("option", { name: destination.displayLabel })
    )

    expect(updateTelegramFeatureSetting).toHaveBeenLastCalledWith({
      featureKey: "MARKET_NEWS_ALERT",
      workspaceId: 7,
      destinationId: destination.id,
    })
    expect(routerRefresh).toHaveBeenCalledTimes(2)

    cleanup()
    renderConfiguration({
      ...data,
      featureSettings: [reassignedSetting],
      destinations: [destination, inactiveDestination],
      sectionAccess: {
        ...data.sectionAccess,
        destinations: true,
      },
      manageAccess: {
        ...data.manageAccess,
        marketNewsRouting: true,
      },
    })
    const reassignedMarketRow = getFeatureRouteContainer(
      viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
    )
    expect(
      within(reassignedMarketRow).getByRole("switch", {
        name: viDictionary.telegram.routing.switchAria.replace(
          "{route}",
          viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
        ),
      })
    ).not.toBeChecked()
    expect(
      within(reassignedMarketRow).getByRole("combobox", {
        name: destinationSelectorName(
          viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
        ),
      })
    ).toHaveTextContent(destination.displayLabel)
  })

  it("keeps delete confirmation open through failure, supports retry, and restores focus", async () => {
    const user = userEvent.setup()
    renderConfiguration()

    const [trigger] = screen.getAllByRole("button", {
      name: viDictionary.telegram.schedule.deleteTrigger,
    })
    if (!trigger) throw new Error("Expected a schedule remove trigger")
    await user.click(trigger)

    const dialog = screen.getByRole("alertdialog")
    expect(
      within(dialog).getByRole("heading", {
        name: viDictionary.telegram.schedule.deleteTitle,
      })
    ).toBeVisible()

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
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: viDictionary.telegram.schedule.panelTitle,
        })
      ).toHaveFocus()
    )
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
        outputLanguage: null,
      },
    })

    try {
      const access = economicCalendarData().sectionAccess
      renderConfiguration(
        economicCalendarData([], {
          destinations: [destination],
          sectionAccess: { ...access, destinations: true },
        })
      )

      const routeRow = getFeatureRouteContainer(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )

      await user.click(
        within(routeRow as HTMLElement).getByRole("combobox", {
          name: destinationSelectorName(
            viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
          ),
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

    const economicAccess = economicCalendarData()
    renderConfiguration(
      economicCalendarData([economicCalendarSetting], {
        featureSettings: [featureSettings[1]],
        sectionAccess: {
          ...economicAccess.sectionAccess,
          marketNewsRouting: true,
        },
        manageAccess: {
          ...economicAccess.manageAccess,
          marketNewsRouting: true,
        },
      })
    )

    const calendarRow = screen
      .getByText(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )
      .closest("[data-feature-key]") as HTMLElement
    const newsRow = getFeatureRouteContainer(
      viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
    )
    const marketNewsRouteLabel = `${viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label} — Workspace`
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
          marketNewsRouteLabel
        ),
      })
    ).toBeEnabled()
    expect(
      within(newsRow).getByRole("switch", {
        name: viDictionary.telegram.routing.switchAria.replace(
          "{route}",
          marketNewsRouteLabel
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
        outputLanguageIsoCode: null,
      })
    )
  })

  it("preserves a flow language through destination and enabled updates", async () => {
    const user = userEvent.setup()
    vi.mocked(updateTelegramFeatureSetting).mockResolvedValue({
      success: true,
      data: featureSettings[0],
    })

    const economicAccess = economicCalendarData().sectionAccess
    renderConfiguration(
      economicCalendarData([economicCalendarSetting], {
        destinations: [
          destination,
          { ...destination, id: 9, displayLabel: "Backup" },
        ],
        sectionAccess: { ...economicAccess, destinations: true },
      })
    )

    const calendarRow = screen
      .getByText(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )
      .closest("[data-feature-key]") as HTMLElement

    await user.click(
      within(calendarRow).getByRole("combobox", {
        name: destinationSelectorName(
          viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
        ),
      })
    )
    await user.click(await screen.findByRole("option", { name: "Backup" }))

    await waitFor(() =>
      expect(updateTelegramFeatureSetting).toHaveBeenCalledWith({
        featureKey: "ECONOMIC_CALENDAR_ALERT",
        workspaceId: 7,
        destinationId: 9,
      })
    )

    const routeSwitch = within(calendarRow).getByRole("switch", {
      name: viDictionary.telegram.routing.switchAria.replace(
        "{route}",
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      ),
    })
    await waitFor(() => expect(routeSwitch).toBeEnabled())
    await user.click(routeSwitch)

    await waitFor(() =>
      expect(updateTelegramFeatureSetting).toHaveBeenCalledWith({
        featureKey: "ECONOMIC_CALENDAR_ALERT",
        workspaceId: 7,
        enabled: false,
      })
    )
  })

  it("keeps existing language visible but disables only its selector when the catalog fails", () => {
    renderConfiguration(
      economicCalendarData([economicCalendarSetting], {
        languageCatalogError: true,
      })
    )

    const calendarRow = screen
      .getByText(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )
      .closest("[data-feature-key]") as HTMLElement

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
    renderConfiguration(
      economicCalendarData([
        {
          ...economicCalendarSetting,
          outputLanguage: { id: 9, isoCode: "fr", name: "Legacy French" },
        },
      ])
    )

    const calendarRow = screen
      .getByText(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )
      .closest("[data-feature-key]") as HTMLElement

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

  it("allows language configuration without a destination and requires route update access", () => {
    const calendarLanguageName =
      viDictionary.telegram.routing.languageAria.replace(
        "{route}",
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )

    const noDestinationSetting = {
      ...economicCalendarSetting,
      enabled: false,
      destination: null,
    }
    renderConfiguration(economicCalendarData([noDestinationSetting]))

    const unassignedRow = screen
      .getByText(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )
      .closest("[data-feature-key]") as HTMLElement
    expect(
      within(unassignedRow).getByRole("combobox", {
        name: calendarLanguageName,
      })
    ).toBeEnabled()
    expect(
      within(unassignedRow).queryByText(
        viDictionary.telegram.routing.languageDestinationRequired
      )
    ).not.toBeInTheDocument()

    cleanup()
    const access = economicCalendarData().manageAccess
    renderConfiguration(
      economicCalendarData([noDestinationSetting], {
        manageAccess: { ...access, economicCalendarRouting: false },
      })
    )

    const readOnlyRow = screen
      .getByText(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )
      .closest("[data-feature-key]") as HTMLElement
    expect(
      within(readOnlyRow).getByRole("combobox", { name: calendarLanguageName })
    ).toBeDisabled()
  })
})

describe("Telegram bot connections", () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.mocked(createTelegramBotConnection).mockReset()
    vi.mocked(reconnectTelegramBotConnection).mockReset()
    routerRefresh.mockReset()
    vi.mocked(toast.error).mockClear()
    vi.mocked(toast.info).mockClear()
    vi.mocked(toast.success).mockClear()
    vi.mocked(toast.warning).mockClear()
  })

  it("shows create-only users the connect action without exposing the list", () => {
    renderBotConnectionsCard({
      botConnections: [{ ...botConnection, displayLabel: "Hidden bot" }],
      canCreate: true,
    })

    expect(
      screen.getByRole("button", {
        name: viDictionary.telegram.bot.connect,
      })
    ).toBeEnabled()
    expect(
      screen.getByText(viDictionary.telegram.bot.accessLimited)
    ).toBeVisible()
    expect(screen.queryByText("Hidden bot")).not.toBeInTheDocument()
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument()
  })

  it("keeps read-only permissions from creating or reconnecting a bot", () => {
    renderBotConnectionsCard({
      botConnections: [botConnection],
      canRead: true,
    })

    expect(
      screen.queryByRole("button", {
        name: viDictionary.telegram.bot.connect,
      })
    ).not.toBeInTheDocument()
    expect(screen.getByText(botConnection.displayLabel as string)).toBeVisible()
    expect(
      screen.queryByRole("button", { name: /Gỡ bot/ })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Kết nối lại/ })
    ).not.toBeInTheDocument()
  })

  it("shows Reconnect only for identified ACTIVE or INVALID rows with read and update", () => {
    const invalidConnection = {
      ...botConnection,
      id: 13,
      displayLabel: "Invalid bot",
      status: "INVALID" as const,
    }
    renderBotConnectionsCard({
      botConnections: [
        botConnection,
        invalidConnection,
        { ...botConnection, id: 14, status: "DISABLED" },
        { displayLabel: "Missing identity or status" },
      ],
      canRead: true,
      canUpdate: true,
    })

    expect(
      screen.getByRole("button", {
        name: viDictionary.telegram.bot.reconnectTrigger.replace(
          "{botName}",
          "New fixture bot"
        ),
      })
    ).toBeVisible()
    expect(
      screen.getByRole("button", {
        name: viDictionary.telegram.bot.reconnectTrigger.replace(
          "{botName}",
          "Invalid bot"
        ),
      })
    ).toBeVisible()
    expect(
      screen.queryByRole("button", {
        name: viDictionary.telegram.bot.reconnectTrigger.replace(
          "{botName}",
          "Bot #14"
        ),
      })
    ).not.toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: /Kết nối lại/ })).toHaveLength(2)
  })

  it.each([
    { permission: "create", canCreate: true },
    { permission: "delete", canDelete: true },
  ])("does not grant Reconnect from $permission permission alone", (access) => {
    renderBotConnectionsCard({
      botConnections: [botConnection],
      canRead: true,
      ...access,
    })

    expect(
      screen.queryByRole("button", { name: /Kết nối lại/ })
    ).not.toBeInTheDocument()
  })

  it("opens the selected bot token dialog by keyboard and keeps localized errors focused", async () => {
    const user = userEvent.setup()
    vi.mocked(reconnectTelegramBotConnection).mockResolvedValue({
      success: false,
      error: viDictionary.telegram.bot.reconnectTokenMismatch,
    })
    renderBotConnectionsCard({
      botConnections: [botConnection],
      canRead: true,
      canUpdate: true,
    })

    const trigger = screen.getByRole("button", {
      name: viDictionary.telegram.bot.reconnectTrigger.replace(
        "{botName}",
        "New fixture bot"
      ),
    })
    trigger.focus()
    await user.keyboard("{Enter}")

    const dialog = await screen.findByRole("dialog", {
      name: viDictionary.telegram.bot.reconnectTitle,
    })
    expect(dialog).toHaveTextContent("New fixture bot (@new_fixture_bot)")
    const token = within(dialog).getByLabelText(
      viDictionary.telegram.bot.tokenLabel
    )
    await waitFor(() => expect(token).toHaveFocus())
    expect(token).toHaveAttribute("type", "password")

    await user.type(token, "fake-token")
    await user.keyboard("{Enter}")

    await waitFor(() =>
      expect(reconnectTelegramBotConnection).toHaveBeenCalledWith(12, {
        botToken: "fake-token",
      })
    )
    expect(screen.getByRole("alert")).toHaveTextContent(
      viDictionary.telegram.bot.reconnectTokenMismatch
    )
    expect(token).toHaveValue("fake-token")
    await waitFor(() => expect(token).toHaveFocus())
    expect(toast.success).not.toHaveBeenCalled()
    expect(routerRefresh).not.toHaveBeenCalled()
  })

  it.each([
    {
      status: "ACTIVE" as const,
      toastKind: "success",
      expected: viDictionary.telegram.bot.reconnectSuccess,
    },
    {
      status: "INVALID" as const,
      toastKind: "warning",
      expected: viDictionary.telegram.bot.reconnectIncomplete,
    },
    {
      status: undefined,
      toastKind: "warning",
      expected: viDictionary.telegram.bot.reconnectOutcomeUnverified,
    },
  ])("reports only readback status $status", async ({ status, toastKind, expected }) => {
    const user = userEvent.setup()
    vi.mocked(reconnectTelegramBotConnection).mockResolvedValue({
      success: true,
      data: status ? { status } : {},
    })
    renderBotConnectionsCard({
      botConnections: [botConnection],
      canRead: true,
      canUpdate: true,
    })

    await user.click(
      screen.getByRole("button", {
        name: viDictionary.telegram.bot.reconnectTrigger.replace(
          "{botName}",
          "New fixture bot"
        ),
      })
    )
    await user.type(
      screen.getByLabelText(viDictionary.telegram.bot.tokenLabel),
      "fake-token"
    )
    await user.click(
      screen.getByRole("button", {
        name: viDictionary.telegram.bot.reconnectAction,
      })
    )

    await waitFor(() => {
      if (toastKind === "success") {
        expect(toast.success).toHaveBeenCalledWith(expected)
      } else {
        expect(toast.warning).toHaveBeenCalledWith(expected)
      }
    })
    if (toastKind !== "success") expect(toast.success).not.toHaveBeenCalled()
    await waitFor(() => expect(routerRefresh).toHaveBeenCalledTimes(1))
  })

  it("keeps a pending create open with its token after a delayed rejection", async () => {
    const user = userEvent.setup()
    let resolveCreate!: (result: { success: false; error: string }) => void
    vi.mocked(createTelegramBotConnection)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveCreate = resolve
          })
      )
      .mockResolvedValueOnce({
        success: false,
        error: viDictionary.telegram.bot.createTokenVerificationError,
      })
    renderBotConnectionsCard({ canCreate: true })

    await user.click(
      screen.getByRole("button", { name: viDictionary.telegram.bot.connect })
    )
    const dialog = await screen.findByRole("dialog")
    const token = screen.getByLabelText(viDictionary.telegram.bot.tokenLabel)
    await user.type(token, "fake-token")
    await user.click(
      screen.getByRole("button", {
        name: viDictionary.telegram.bot.connectBot,
      })
    )

    expect(
      within(dialog).getByRole("status", {
        name: viDictionary.common.loading,
      })
    ).toBeInTheDocument()

    await waitFor(() =>
      expect(createTelegramBotConnection).toHaveBeenCalledTimes(1)
    )
    const closeButtons = within(dialog).getAllByRole("button", {
      name: viDictionary.common.close,
    })
    expect(closeButtons).toHaveLength(2)
    expect(closeButtons[0]).toBeDisabled()
    expect(closeButtons[1]).toBeDisabled()
    expect(token).toBeDisabled()

    await user.click(closeButtons[0]!)
    await user.click(closeButtons[1]!)
    expect(dialog).toBeInTheDocument()
    await user.keyboard("{Escape}")
    expect(dialog).toBeInTheDocument()
    fireEvent.pointerDown(document.body, { pointerType: "mouse" })
    expect(dialog).toBeInTheDocument()

    resolveCreate({
      success: false,
      error: viDictionary.telegram.bot.createTokenVerificationError,
    })
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        viDictionary.telegram.bot.createTokenVerificationError
      )
    )
    expect(token).toHaveValue("fake-token")
    await waitFor(() => expect(token).toBeEnabled())
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: viDictionary.telegram.bot.connectBot,
        })
      ).toBeEnabled()
    )

    await user.click(
      screen.getByRole("button", {
        name: viDictionary.telegram.bot.connectBot,
      })
    )
    await waitFor(() =>
      expect(createTelegramBotConnection).toHaveBeenCalledTimes(2)
    )
    expect(token).toHaveValue("fake-token")
  })

  it("announces a create error, preserves the token, and restores dialog focus", async () => {
    const user = userEvent.setup()
    vi.mocked(createTelegramBotConnection).mockResolvedValue({
      success: false,
      error: viDictionary.telegram.bot.createTokenVerificationError,
    })
    renderBotConnectionsCard({ canCreate: true })

    const trigger = screen.getByRole("button", {
      name: viDictionary.telegram.bot.connect,
    })
    trigger.focus()
    await user.keyboard("{Enter}")

    const dialog = await screen.findByRole("dialog")
    const token = screen.getByLabelText(viDictionary.telegram.bot.tokenLabel)
    const closeButtons = within(dialog).getAllByRole("button", {
      name: viDictionary.common.close,
    })
    expect(closeButtons).toHaveLength(2)
    await waitFor(() => expect(token).toHaveFocus())
    expect(token).toHaveAttribute("type", "password")

    await user.type(token, "fake-token")
    await user.keyboard("{Enter}")

    await waitFor(() =>
      expect(createTelegramBotConnection).toHaveBeenCalledWith({
        botToken: "fake-token",
      })
    )
    expect(screen.getByRole("alert")).toHaveTextContent(
      viDictionary.telegram.bot.createTokenVerificationError
    )
    expect(token).toHaveValue("fake-token")
    expect(token).toHaveAttribute("aria-invalid", "true")
    expect(token.getAttribute("aria-describedby")).toContain(
      "telegram-bot-token-error"
    )
    await waitFor(() => expect(token).toHaveFocus())

    await user.click(closeButtons[1])
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    )
    expect(trigger).toHaveFocus()
    expect(dialog).not.toBeInTheDocument()
  })

  it.each([
    {
      outcome: "a created connection has no saved status",
      created: true,
      expected: viDictionary.telegram.bot.createStatusUnverifiedWithoutRead,
    },
    {
      outcome: "a caller-owned duplicate has no saved status",
      created: false,
      expected:
        viDictionary.telegram.bot.alreadyConnectedStatusUnverifiedWithoutRead,
    },
    {
      outcome: "the create result is unknown",
      created: null,
      expected: viDictionary.telegram.bot.createOutcomeUnverifiedWithoutRead,
    },
  ])(
    "guides a create-only caller when $outcome",
    async ({ created, expected }) => {
      const user = userEvent.setup()
      vi.mocked(createTelegramBotConnection).mockResolvedValue({
        success: true,
        data: { connection: { id: 13 }, created },
      })
      renderBotConnectionsCard({ canCreate: true, canRead: false })

      await user.click(
        screen.getByRole("button", {
          name: viDictionary.telegram.bot.connect,
        })
      )
      await user.type(
        screen.getByLabelText(viDictionary.telegram.bot.tokenLabel),
        "fake-token"
      )
      await user.click(
        screen.getByRole("button", {
          name: viDictionary.telegram.bot.connectBot,
        })
      )

      await waitFor(() => expect(toast.warning).toHaveBeenCalledWith(expected))
      expect(toast.warning).toHaveBeenCalledTimes(1)
      expect(toast.error).not.toHaveBeenCalled()
      expect(toast.success).not.toHaveBeenCalled()
      expect(routerRefresh).toHaveBeenCalledTimes(1)
    }
  )

  it("marks partial saved data unverified and keeps state-dependent actions safe", async () => {
    renderBotConnectionsCard({
      botConnections: [
        {
          id: 13,
          displayLabel: "Status not returned",
        },
      ],
      canRead: true,
      canDelete: true,
    })

    const row = screen.getByRole("listitem")
    expect(row).toHaveTextContent("Status not returned")
    expect(row).toHaveTextContent(viDictionary.telegram.bot.statusUnverified)
    expect(row).toHaveTextContent(
      viDictionary.telegram.bot.connectionDetailsUnverified
    )
    expect(
      within(row).getByRole("button", { name: "Gỡ bot Status not returned" })
    ).toBeVisible()
    expect(
      within(row).queryByText(viDictionary.telegram.common.disable)
    ).not.toBeInTheDocument()
  })

  it.each([
    {
      created: true,
      status: "ACTIVE",
      toastKind: "success",
      expected: viDictionary.telegram.bot.createSuccess,
    },
    {
      created: true,
      status: "INVALID",
      toastKind: "warning",
      expected: viDictionary.telegram.bot.createIncomplete.replace(
        "{status}",
        viDictionary.telegram.statuses.INVALID
      ),
    },
    {
      created: false,
      status: "ACTIVE",
      toastKind: "info",
      expected: viDictionary.telegram.bot.alreadyConnected.replace(
        "{status}",
        viDictionary.telegram.statuses.ACTIVE
      ),
    },
    {
      created: false,
      status: "INVALID",
      toastKind: "warning",
      expected:
        viDictionary.telegram.bot.alreadyConnectedIncomplete.replace(
          "{status}",
          viDictionary.telegram.statuses.INVALID
        ) +
        " " +
        viDictionary.telegram.bot.webhookRegistrationFailed,
    },
    {
      created: false,
      status: "DISABLED",
      toastKind: "info",
      expected: viDictionary.telegram.bot.alreadyConnected.replace(
        "{status}",
        viDictionary.telegram.statuses.DISABLED
      ),
    },
  ] as const)(
    "reports created=$created status=$status without claiming duplicate success",
    async ({ created, status, toastKind, expected }) => {
      const user = userEvent.setup()
      vi.mocked(createTelegramBotConnection).mockResolvedValue({
        success: true,
        data: {
          connection: {
            ...botConnection,
            status,
            ...(status === "INVALID"
              ? {
                  failureReason:
                    "Webhook registration failed: upstream returned 502.",
                }
              : {}),
          },
          created,
        },
      })
      renderBotConnectionsCard({ canCreate: true })

      await user.click(
        screen.getByRole("button", {
          name: viDictionary.telegram.bot.connect,
        })
      )
      await user.type(
        screen.getByLabelText(viDictionary.telegram.bot.tokenLabel),
        "fake-token"
      )
      await user.click(
        screen.getByRole("button", {
          name: viDictionary.telegram.bot.connectBot,
        })
      )

      await waitFor(() =>
        expect(createTelegramBotConnection).toHaveBeenCalledWith({
          botToken: "fake-token",
        })
      )
      if (toastKind === "success") {
        expect(toast.success).toHaveBeenCalledWith(expected)
        expect(toast.info).not.toHaveBeenCalled()
        expect(toast.warning).not.toHaveBeenCalled()
      } else if (toastKind === "warning") {
        expect(toast.warning).toHaveBeenCalledWith(expected)
        expect(toast.success).not.toHaveBeenCalled()
      } else {
        expect(toast.info).toHaveBeenCalledWith(expected)
        expect(toast.success).not.toHaveBeenCalled()
      }
      await waitFor(() => expect(routerRefresh).toHaveBeenCalledTimes(1))
    }
  )

  it("keeps reconnect guidance hidden until the row action is available", () => {
    const invalidConnection = {
      ...botConnection,
      status: "INVALID" as const,
      failureReason: "Webhook registration failed: upstream returned 502.",
    }
    renderBotConnectionsCard({
      botConnections: [invalidConnection],
      canRead: true,
    })

    expect(
      screen.getByText(viDictionary.telegram.statuses.INVALID)
    ).toBeVisible()
    expect(
      screen.getByText(viDictionary.telegram.bot.webhookRegistrationFailed)
    ).toBeVisible()
    expect(
      screen.queryByText(/Webhook registration failed: upstream returned 502\./)
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(viDictionary.telegram.bot.setupIncomplete)
    ).toBeVisible()
    expect(
      screen.queryByText(viDictionary.telegram.bot.reconnectGuidance)
    ).not.toBeInTheDocument()
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
      botConnections: [botConnection],
      canRead: true,
      canCreate: true,
    })

    expect(
      screen.getByRole("button", {
        name: viDictionary.telegram.bot.connect,
      })
    ).toBeVisible()
    expect(
      screen.queryByRole("button", { name: "Gỡ bot New fixture bot" })
    ).not.toBeInTheDocument()

    rerender(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <BotConnectionsCard
          botConnections={[botConnection]}
          canRead
          canUpdate={false}
          canCreate={false}
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
      screen.getByRole("button", { name: "Gỡ bot New fixture bot" })
    ).toBeVisible()
    expect(
      screen.queryByText(viDictionary.telegram.common.disable)
    ).not.toBeInTheDocument()
  })

  it("does not expose Remove without read access, even when delete is granted", () => {
    renderBotConnectionsCard({ canRead: false, canDelete: true })

    expect(
      screen.getByText(viDictionary.telegram.bot.accessLimited)
    ).toBeVisible()
    expect(
      screen.queryByRole("button", { name: "Gỡ bot New fixture bot" })
    ).not.toBeInTheDocument()
  })

  it("supports keyboard cancel, blocked retry, pending feedback and success focus", async () => {
    const user = userEvent.setup()
    const { rerender } = renderBotConnectionsCard({
      botConnections: [botConnection],
      canRead: true,
      canDelete: true,
    })
    const removeTrigger = screen.getByRole("button", {
      name: "Gỡ bot New fixture bot",
    })

    removeTrigger.focus()
    await user.keyboard("{Enter}")
    const dialog = screen.getByRole("alertdialog")
    expect(dialog).toHaveTextContent("Gỡ kết nối bot “New fixture bot”?")
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
      expect(deleteTelegramBotConnection).toHaveBeenLastCalledWith(12)
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
          canUpdate={false}
          canCreate={false}
          canDelete
          loadError={false}
        />
      </LocalizationProvider>
    )
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Gỡ bot New fixture bot" })
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
    await user.click(
      await screen.findByRole("option", { name: "Operations bot" })
    )
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

describe("Telegram destination removal", () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.mocked(deleteTelegramDestination).mockReset()
    routerRefresh.mockReset()
    vi.mocked(toast.error).mockReset()
    vi.mocked(toast.success).mockReset()
  })

  function manageableData(
    destinations: TelegramConfigurationData["destinations"] = [destination]
  ): TelegramConfigurationData {
    return {
      ...data,
      destinations,
      sectionAccess: { ...data.sectionAccess, destinations: true },
      manageAccess: { ...data.manageAccess, destinations: true },
    }
  }

  it("shows direct Remove to managers, including for disabled destinations", () => {
    const disabledDestination = { ...destination, status: "DISABLED" as const }
    renderConfiguration(manageableData([disabledDestination]))

    const removeButton = screen.getByRole("button", {
      name: viDictionary.telegram.destination.removeTrigger.replace(
        "{destination}",
        "Operations"
      ),
    })
    expect(removeButton).toBeVisible()

    const row = removeButton.closest('[role="listitem"]')
    expect(row).not.toBeNull()
    expect(
      within(row as HTMLElement).queryByRole("button", {
        name: /Vô hiệu hóa/,
      })
    ).toBeNull()
  })

  it.each([
    { locale: "vi" as const, dictionary: viDictionary },
    { locale: "en" as const, dictionary: enDictionary },
  ])(
    "shows the localized Remove tooltip on hover and focus ($locale)",
    async ({ locale, dictionary }) => {
      const user = userEvent.setup()
      const triggerLabel =
        dictionary.telegram.destination.removeTrigger.replace(
          "{destination}",
          "Operations"
        )
      render(
        <TooltipProvider delay={0}>
          <LocalizationProvider locale={locale} dictionary={dictionary}>
            <TelegramConfigurationPage data={manageableData()} />
          </LocalizationProvider>
        </TooltipProvider>
      )

      const trigger = screen.getByRole("button", { name: triggerLabel })
      expect(trigger).toHaveAccessibleName(triggerLabel)

      await user.hover(trigger)
      expect(
        await screen.findByText(dictionary.telegram.destination.removeAction, {
          exact: true,
        })
      ).toBeInTheDocument()
      await user.unhover(trigger)
      await waitFor(() =>
        expect(
          screen.queryByText(dictionary.telegram.destination.removeAction, {
            exact: true,
          })
        ).not.toBeInTheDocument()
      )

      trigger.focus()
      expect(
        await screen.findByText(dictionary.telegram.destination.removeAction, {
          exact: true,
        })
      ).toHaveTextContent(dictionary.telegram.destination.removeAction)
    }
  )

  it("does not show Remove to read-only users", () => {
    renderConfiguration({
      ...data,
      sectionAccess: { ...data.sectionAccess, destinations: true },
      manageAccess: { ...data.manageAccess, destinations: false },
    })

    expect(
      screen.queryByRole("button", {
        name: viDictionary.telegram.destination.removeTrigger.replace(
          "{destination}",
          "Operations"
        ),
      })
    ).toBeNull()
    expect(
      screen.getByText(viDictionary.telegram.destination.readOnlyDescription)
    ).toBeVisible()
  })

  it("shows a localized destination read error with retry instead of empty state", async () => {
    const user = userEvent.setup()
    renderConfiguration({
      ...manageableData([]),
      destinationsLoadError: true,
    })
    const card = screen
      .getByRole("heading", {
        name: viDictionary.telegram.destination.sectionTitle,
      })
      .closest('[data-slot="card"]') as HTMLElement

    expect(within(card).getByRole("alert")).toHaveTextContent(
      viDictionary.telegram.destination.loadError
    )
    expect(
      screen.queryByText(viDictionary.telegram.destination.emptyTitle)
    ).not.toBeInTheDocument()

    await user.click(
      within(card).getByRole("button", { name: viDictionary.common.retry })
    )
    expect(routerRefresh).toHaveBeenCalledOnce()
  })

  it("cancels without a mutation and restores focus to the row action", async () => {
    const user = userEvent.setup()
    const { container } = renderConfiguration(manageableData())
    const trigger = screen.getByRole("button", {
      name: viDictionary.telegram.destination.removeTrigger.replace(
        "{destination}",
        "Operations"
      ),
    })

    await user.click(trigger)
    const dialog = screen.getByRole("alertdialog")
    expect(dialog).toHaveTextContent(
      viDictionary.telegram.destination.removeTitle.replace(
        "{destination}",
        "Operations"
      )
    )
    await user.keyboard("{Escape}")

    expect(deleteTelegramDestination).not.toHaveBeenCalled()
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(container.querySelector('[role="alertdialog"]')).toBeNull()
  })

  it("keeps the blocked context for retry and refreshes only after success", async () => {
    const user = userEvent.setup()
    vi.mocked(deleteTelegramDestination)
      .mockResolvedValueOnce({
        success: false,
        error: viDictionary.telegram.destination.removeInUseError,
      })
      .mockResolvedValueOnce({ success: true, data: undefined })
    renderConfiguration(manageableData())

    await user.click(
      screen.getByRole("button", {
        name: viDictionary.telegram.destination.removeTrigger.replace(
          "{destination}",
          "Operations"
        ),
      })
    )
    const dialog = screen.getByRole("alertdialog")
    const confirm = within(dialog).getByRole("button", {
      name: viDictionary.telegram.destination.removeAction,
    })
    await user.click(confirm)

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      viDictionary.telegram.destination.removeInUseError
    )
    await waitFor(() => expect(confirm).toHaveFocus())
    expect(dialog).toBeVisible()
    expect(routerRefresh).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()

    await user.click(confirm)
    await waitFor(() => expect(dialog).not.toBeVisible())
    expect(deleteTelegramDestination).toHaveBeenCalledTimes(2)
    expect(routerRefresh).toHaveBeenCalledTimes(1)
    expect(toast.success).toHaveBeenCalledWith(
      viDictionary.telegram.destination.removeSuccess
    )
    await waitFor(() =>
      expect(
        screen.getByRole("heading", {
          name: viDictionary.telegram.destination.sectionTitle,
        })
      ).toHaveFocus()
    )
  })

  it("announces pending removal and keeps the dialog busy until the API settles", async () => {
    const user = userEvent.setup()
    let resolveRemoval: (result: { success: true; data: undefined }) => void =
      () => undefined
    const pendingRemoval = new Promise<{ success: true; data: undefined }>(
      (resolve) => {
        resolveRemoval = resolve
      }
    )
    vi.mocked(deleteTelegramDestination).mockReturnValueOnce(pendingRemoval)
    renderConfiguration(manageableData())

    await user.click(
      screen.getByRole("button", {
        name: viDictionary.telegram.destination.removeTrigger.replace(
          "{destination}",
          "Operations"
        ),
      })
    )
    const dialog = screen.getByRole("alertdialog")
    const confirm = within(dialog).getByRole("button", {
      name: viDictionary.telegram.destination.removeAction,
    })
    await user.click(confirm)

    const pending = within(dialog).getByRole("status")
    expect(pending).toHaveTextContent(viDictionary.common.pending)
    expect(pending).toHaveFocus()
    expect(confirm).toBeDisabled()
    expect(routerRefresh).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()

    resolveRemoval({ success: true, data: undefined })
    await waitFor(() => expect(dialog).not.toBeVisible())
    expect(routerRefresh).toHaveBeenCalledTimes(1)
  })

  it("keeps Removed destinations out of the list and send choices after readback", async () => {
    const user = userEvent.setup()
    const currentData: TelegramConfigurationData = {
      ...manageableData(),
      schedules: [],
      featureSettings: [],
      economicCalendarSettings: [economicCalendarSetting],
      sectionAccess: {
        ...data.sectionAccess,
        destinations: true,
        featureSettings: true,
        economicCalendarRouting: true,
      },
      manageAccess: {
        ...data.manageAccess,
        destinations: true,
        featureSettings: true,
        economicCalendarRouting: true,
      },
    }
    const { rerender } = renderConfiguration(currentData)
    const routeLabel =
      viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
    const routeDestination = screen.getByRole("combobox", {
      name: destinationSelectorName(routeLabel),
    })

    await user.click(routeDestination)
    expect(
      await screen.findByRole("option", { name: destination.displayLabel })
    ).toBeVisible()
    await user.keyboard("{Escape}")

    rerender(
      <LocalizationProvider locale="vi" dictionary={viDictionary}>
        <TelegramConfigurationPage
          data={{
            ...currentData,
            destinations: [{ ...destination, status: "REMOVED" }],
          }}
        />
      </LocalizationProvider>
    )

    expect(
      screen.queryByRole("button", {
        name: viDictionary.telegram.destination.removeTrigger.replace(
          "{destination}",
          destination.displayLabel
        ),
      })
    ).toBeNull()
    await user.click(routeDestination)
    expect(
      screen.queryByRole("option", { name: destination.displayLabel })
    ).toBeNull()
  })
})
