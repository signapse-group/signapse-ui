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
  deleteTelegramMarketAnalysisSchedule,
  disableTelegramMarketAnalysisSchedule,
  updateTelegramFeatureSetting,
} from "@/app/api/telegram/action"
import { toast } from "sonner"
import { en as enDictionary } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import type {
  TelegramBotConnectionResponse,
  TelegramBotConnectionReadback,
  TelegramConfigurationData,
} from "@/app/lib/telegram/definitions"
import { BotConnectionsCard } from "@/app/[lang]/(main)/telegram/telegram-bot-connections"
import { TelegramConfigurationPage } from "@/app/[lang]/(main)/telegram/telegram-configuration"

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
  sectionAccess: {
    botConnections: false,
    destinations: true,
    featureSettings: true,
    marketNewsRouting: true,
    schedules: true,
    watchlistAssets: true,
  },
  manageAccess: {
    botConnections: false,
    botConnectionsDelete: false,
    destinations: false,
    featureSettings: false,
    marketNewsRouting: false,
    schedules: true,
  },
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
  canManage = false,
  canCreate = false,
  canDelete = false,
}: {
  botConnections?: TelegramBotConnectionReadback[]
  canRead?: boolean
  canManage?: boolean
  canCreate?: boolean
  canDelete?: boolean
} = {}) {
  return render(
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
      <BotConnectionsCard
        botConnections={botConnections}
        canRead={canRead}
        canManage={canManage}
        canCreate={canCreate}
        canDelete={canDelete}
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
    vi.mocked(disableTelegramMarketAnalysisSchedule).mockReset()
    vi.mocked(updateTelegramFeatureSetting).mockReset()
    vi.mocked(toast.error).mockReset()
    vi.mocked(toast.success).mockReset()
    routerRefresh.mockReset()
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
        schedules: false,
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
    renderConfiguration(marketData)

    const marketRow = getFeatureRouteContainer(
      viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
    )
    const destinationSelect = within(marketRow).getByRole("combobox", {
      name: destinationSelectorName(
        viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
      ),
    })
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
    expect(destinationSelect).toHaveFocus()

    cleanup()
    renderConfiguration({ ...marketData, featureSettings: [clearedSetting] })
    const reloadedMarketRow = getFeatureRouteContainer(
      viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
    )
    expect(
      within(reloadedMarketRow).getByRole("combobox", {
        name: destinationSelectorName(
          viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
        ),
      })
    ).toHaveTextContent(viDictionary.telegram.destination.placeholder)
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

    const trigger = screen.getByRole("button", {
      name: viDictionary.telegram.schedule.deleteTrigger,
    })
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
    expect(trigger).toHaveFocus()
  })

  it("confirms disable through the accessible action label and refreshes on success", async () => {
    const user = userEvent.setup()
    renderConfiguration()
    vi.mocked(disableTelegramMarketAnalysisSchedule).mockResolvedValue({
      success: true,
      data: schedule,
    })

    await user.click(
      screen.getByRole("button", {
        name: viDictionary.telegram.schedule.disableTrigger,
      })
    )
    const dialog = screen.getByRole("alertdialog")
    await user.click(
      within(dialog).getByRole("button", {
        name: viDictionary.telegram.common.disable,
      })
    )

    await waitFor(() =>
      expect(disableTelegramMarketAnalysisSchedule).toHaveBeenCalledWith(11)
    )
    await waitFor(() => expect(routerRefresh).toHaveBeenCalledTimes(1))
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
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
      renderConfiguration({
        ...data,
        manageAccess: {
          ...data.manageAccess,
          featureSettings: true,
        },
      })

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
        marketNewsRouting: true,
      },
    })

    const calendarRow = screen
      .getByText(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )
      .closest("[data-feature-key]") as HTMLElement
    const newsRow = getFeatureRouteContainer(
      viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
    )
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
          destination: null,
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
      .closest("[data-feature-key]") as HTMLElement
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

  it("keeps read-only and manage-only permissions from creating a bot", () => {
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

    cleanup()
    renderBotConnectionsCard({
      botConnections: [botConnection],
      canManage: true,
      canCreate: false,
    })
    expect(
      screen.queryByRole("button", {
        name: viDictionary.telegram.bot.connect,
      })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(botConnection.displayLabel as string)
    ).not.toBeInTheDocument()
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
      canManage: true,
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
          canManage={false}
          canCreate={false}
          canDelete
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
          canManage={false}
          canCreate={false}
          canDelete
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
      featureSettings: [featureSettings[0]],
      sectionAccess: {
        ...data.sectionAccess,
        destinations: true,
        featureSettings: true,
      },
      manageAccess: {
        ...data.manageAccess,
        destinations: true,
        featureSettings: true,
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

    expect(screen.queryByText(destination.displayLabel)).toBeNull()
    await user.click(routeDestination)
    expect(
      screen.queryByRole("option", { name: destination.displayLabel })
    ).toBeNull()
  })
})
