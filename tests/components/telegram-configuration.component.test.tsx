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
  disableTelegramBotConnection: vi.fn(),
  disableTelegramDestination: vi.fn(),
  disableTelegramMarketAnalysisSchedule: vi.fn(),
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
  deleteTelegramMarketAnalysisSchedule,
  disableTelegramMarketAnalysisSchedule,
  updateTelegramFeatureSetting,
} from "@/app/api/telegram/action"
import { en as enDictionary } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import type { TelegramConfigurationData } from "@/app/lib/telegram/definitions"
import { TelegramConfigurationPage } from "@/app/[lang]/(main)/telegram/telegram-configuration"

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

const allFeatureAccess = {
  ECONOMIC_CALENDAR_ALERT: true,
  MARKET_NEWS_ALERT: true,
  SCHEDULED_MARKET_ANALYSIS: true,
}
const noFeatureAccess = {
  ECONOMIC_CALENDAR_ALERT: false,
  MARKET_NEWS_ALERT: false,
  SCHEDULED_MARKET_ANALYSIS: false,
}

const data: TelegramConfigurationData = {
  botConnections: [],
  destinations: [destination],
  destinationsLoadError: false,
  featureSettings: [],
  featureSettingsLoadError: false,
  schedules: [schedule],
  currentWorkspace: {
    id: 7,
    name: "Workspace",
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
    destinations: false,
    featureSettings: allFeatureAccess,
    schedules: true,
    watchlistAssets: true,
  },
  manageAccess: {
    botConnections: false,
    destinations: false,
    featureSettings: noFeatureAccess,
    schedules: true,
  },
}

const selectControlledWarning =
  "Base UI: A component is changing the uncontrolled value state of Select to be controlled."

function renderConfiguration(
  configurationData: TelegramConfigurationData = data
) {
  return render(
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
      <TelegramConfigurationPage data={configurationData} />
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
    vi.mocked(deleteTelegramMarketAnalysisSchedule).mockReset()
    vi.mocked(disableTelegramMarketAnalysisSchedule).mockReset()
    vi.mocked(updateTelegramFeatureSetting).mockReset()
    routerRefresh.mockReset()
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
          featureSettings: allFeatureAccess,
        },
        sectionAccess: { ...data.sectionAccess, destinations: true },
      })

      const routeRow = screen
        .getByText(
          viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
        )
        .closest("tr")
      expect(routeRow).not.toBeNull()

      await user.click(
        within(routeRow as HTMLElement).getByRole("combobox", {
          name:
            viDictionary.telegram.routing.destinationColumn +
            ": " +
            viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT
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
        })
      })
      await waitFor(() => expect(routerRefresh).toHaveBeenCalledTimes(1))
      expect(
        within(routeRow as HTMLElement).getByRole("switch")
      ).not.toBeChecked()
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
      sectionAccess: {
        ...data.sectionAccess,
        featureSettings: allFeatureAccess,
      },
      manageAccess: {
        ...data.manageAccess,
        featureSettings: allFeatureAccess,
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
    const scheduledRow = screen
      .getByText(
        viDictionary.telegram.routeDefinitions.SCHEDULED_MARKET_ANALYSIS.label
      )
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
      within(scheduledRow).queryByRole("combobox", {
        name: viDictionary.telegram.routing.languageAria.replace(
          "{route}",
          viDictionary.telegram.routeDefinitions.SCHEDULED_MARKET_ANALYSIS.label
        ),
      })
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
        enabled: true,
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
      sectionAccess: { ...data.sectionAccess, destinations: true },
      manageAccess: {
        ...data.manageAccess,
        featureSettings: allFeatureAccess,
      },
    })

    const calendarRow = screen
      .getByText(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )
      .closest("tr") as HTMLElement

    await user.click(
      within(calendarRow).getByRole("combobox", {
        name:
          viDictionary.telegram.routing.destinationColumn +
          ": " +
          viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label,
      })
    )
    await user.click(await screen.findByRole("option", { name: "Backup" }))

    await waitFor(() =>
      expect(updateTelegramFeatureSetting).toHaveBeenCalledWith(
        expect.objectContaining({
          featureKey: "ECONOMIC_CALENDAR_ALERT",
          workspaceId: 7,
          destinationId: 9,
          enabled: true,
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
          workspaceId: 7,
          enabled: false,
        })
      )
    )

    vi.mocked(updateTelegramFeatureSetting).mockClear()
    const scheduledRow = screen
      .getByText(
        viDictionary.telegram.routeDefinitions.SCHEDULED_MARKET_ANALYSIS.label
      )
      .closest("tr") as HTMLElement
    fireEvent.click(
      within(scheduledRow).getByRole("switch", {
        name: viDictionary.telegram.routing.switchAria.replace(
          "{route}",
          viDictionary.telegram.routeDefinitions.SCHEDULED_MARKET_ANALYSIS.label
        ),
      })
    )

    await waitFor(() =>
      expect(updateTelegramFeatureSetting).toHaveBeenCalledWith(
        expect.objectContaining({
          featureKey: "SCHEDULED_MARKET_ANALYSIS",
          destinationId: 8,
          enabled: false,
          outputLanguageIsoCode: "en",
        })
      )
    )
  })

  it("clears the Economic calendar language override in the shared route list", async () => {
    const user = userEvent.setup()
    vi.mocked(updateTelegramFeatureSetting).mockResolvedValue({
      success: true,
      data: featureSettings[0],
    })

    renderConfiguration({
      ...data,
      featureSettings,
      sectionAccess: {
        ...data.sectionAccess,
        featureSettings: allFeatureAccess,
      },
      manageAccess: {
        ...data.manageAccess,
        featureSettings: allFeatureAccess,
      },
    })

    const calendarRow = screen
      .getByText(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )
      .closest("tr") as HTMLElement
    await user.click(
      within(calendarRow).getByRole("combobox", {
        name: viDictionary.telegram.routing.languageAria.replace(
          "{route}",
          viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
        ),
      })
    )
    await user.click(
      await screen.findByRole("option", {
        name: viDictionary.telegram.routing.defaultLanguage,
      })
    )

    await waitFor(() =>
      expect(updateTelegramFeatureSetting).toHaveBeenCalledWith(
        expect.objectContaining({
          featureKey: "ECONOMIC_CALENDAR_ALERT",
          workspaceId: 7,
          enabled: true,
          outputLanguageIsoCode: null,
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
        featureSettings: allFeatureAccess,
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
        featureSettings: allFeatureAccess,
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

  it("allows language configuration without a route destination but disables it without update access", () => {
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
          outputLanguage: null,
        },
      ],
      manageAccess: {
        ...data.manageAccess,
        featureSettings: allFeatureAccess,
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
    ).toBeEnabled()

    cleanup()
    renderConfiguration({
      ...data,
      featureSettings,
      manageAccess: {
        ...data.manageAccess,
        featureSettings: noFeatureAccess,
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

describe("Economic calendar route permissions and persistence", () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    vi.mocked(updateTelegramFeatureSetting).mockReset()
    vi.mocked(toast.error).mockReset()
    vi.mocked(toast.success).mockReset()
    routerRefresh.mockReset()
  })

  it("shows only rows granted by their route-specific read permission", () => {
    renderConfiguration({
      ...data,
      featureSettings,
      sectionAccess: {
        ...data.sectionAccess,
        featureSettings: {
          ECONOMIC_CALENDAR_ALERT: true,
          MARKET_NEWS_ALERT: false,
          SCHEDULED_MARKET_ANALYSIS: false,
        },
      },
    })

    expect(
      screen.getByText(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )
    ).toBeVisible()
    expect(
      screen.queryByText(
        viDictionary.telegram.routeDefinitions.MARKET_NEWS_ALERT.label
      )
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(
        viDictionary.telegram.routeDefinitions.SCHEDULED_MARKET_ANALYSIS.label
      )
    ).not.toBeInTheDocument()
  })

  it("uses English copy for the clear action and confirmed update", async () => {
    const user = userEvent.setup()
    vi.mocked(updateTelegramFeatureSetting).mockResolvedValue({
      success: true,
      data: featureSettings[0],
    })

    render(
      <LocalizationProvider locale="en" dictionary={enDictionary}>
        <TelegramConfigurationPage
          data={{
            ...data,
            featureSettings: [featureSettings[0]],
            sectionAccess: {
              ...data.sectionAccess,
              destinations: true,
              featureSettings: {
                ECONOMIC_CALENDAR_ALERT: true,
                MARKET_NEWS_ALERT: false,
                SCHEDULED_MARKET_ANALYSIS: false,
              },
            },
            manageAccess: {
              ...data.manageAccess,
              featureSettings: {
                ECONOMIC_CALENDAR_ALERT: true,
                MARKET_NEWS_ALERT: false,
                SCHEDULED_MARKET_ANALYSIS: false,
              },
            },
          }}
        />
      </LocalizationProvider>
    )

    expect(
      screen.getByRole("combobox", {
        name:
          enDictionary.telegram.routing.destinationColumn +
          ": " +
          enDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label,
      })
    ).toBeVisible()

    const clearButton = screen.getByRole("button", {
      name: "Clear destination for Economic calendar alerts",
    })
    await user.click(clearButton)

    await waitFor(() =>
      expect(updateTelegramFeatureSetting).toHaveBeenCalledWith({
        featureKey: "ECONOMIC_CALENDAR_ALERT",
        workspaceId: 7,
        destinationId: null,
        enabled: false,
      })
    )
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        enDictionary.telegram.routing.destinationClearSuccess
      )
    )
  })

  it("does not represent a missing current workspace as an Off route", () => {
    renderConfiguration({
      ...data,
      currentWorkspace: null,
      featureSettings,
      sectionAccess: {
        ...data.sectionAccess,
        featureSettings: {
          ECONOMIC_CALENDAR_ALERT: true,
          MARKET_NEWS_ALERT: false,
          SCHEDULED_MARKET_ANALYSIS: false,
        },
        schedules: false,
      },
    })

    expect(
      screen.queryByText(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )
    ).not.toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent(
      viDictionary.telegram.routing.noWorkspaceSelected
    )
    expect(
      screen.getByText(viDictionary.telegram.readiness.noWorkspace)
    ).toBeVisible()
    expect(screen.queryByRole("switch")).not.toBeInTheDocument()
  })

  it("shows a route load error without presenting stale settings as saved", async () => {
    const user = userEvent.setup()
    renderConfiguration({
      ...data,
      featureSettings,
      featureSettingsLoadError: true,
      sectionAccess: {
        ...data.sectionAccess,
        featureSettings: {
          ECONOMIC_CALENDAR_ALERT: true,
          MARKET_NEWS_ALERT: false,
          SCHEDULED_MARKET_ANALYSIS: false,
        },
        schedules: false,
      },
    })

    expect(screen.getByRole("alert")).toHaveTextContent(
      viDictionary.telegram.routing.settingsLoadError
    )
    expect(
      screen.queryByText(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(viDictionary.telegram.readiness.routingLoadError)
    ).toBeVisible()

    await user.click(
      screen.getByRole("button", {
        name: viDictionary.telegram.routing.retry,
      })
    )
    expect(routerRefresh).toHaveBeenCalledTimes(1)
  })

  it("keeps destination read errors visible and leaves clear available", () => {
    renderConfiguration({
      ...data,
      destinations: [],
      destinationsLoadError: true,
      featureSettings: [featureSettings[0]],
      sectionAccess: {
        ...data.sectionAccess,
        destinations: true,
        featureSettings: {
          ECONOMIC_CALENDAR_ALERT: true,
          MARKET_NEWS_ALERT: false,
          SCHEDULED_MARKET_ANALYSIS: false,
        },
        schedules: false,
      },
      manageAccess: {
        ...data.manageAccess,
        featureSettings: {
          ECONOMIC_CALENDAR_ALERT: true,
          MARKET_NEWS_ALERT: false,
          SCHEDULED_MARKET_ANALYSIS: false,
        },
      },
    })

    expect(screen.getAllByRole("alert")).toHaveLength(2)
    expect(
      screen.queryByText(viDictionary.telegram.destination.emptyTitle)
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("button", {
        name: "Xóa điểm nhận cho Cảnh báo lịch kinh tế",
      })
    ).toBeEnabled()
  })

  it("keeps Off when enabling without an eligible destination is rejected", async () => {
    const user = userEvent.setup()
    vi.mocked(updateTelegramFeatureSetting).mockResolvedValue({
      success: false,
      error: "Choose an eligible destination.",
    })

    renderConfiguration({
      ...data,
      featureSettings: [
        {
          ...featureSettings[0],
          enabled: false,
          destination: null,
          outputLanguage: null,
        },
      ],
      manageAccess: {
        ...data.manageAccess,
        featureSettings: {
          ECONOMIC_CALENDAR_ALERT: true,
          MARKET_NEWS_ALERT: false,
          SCHEDULED_MARKET_ANALYSIS: false,
        },
      },
    })

    const routeSwitch = screen.getByRole("switch", {
      name: viDictionary.telegram.routing.switchAria.replace(
        "{route}",
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      ),
    })
    expect(routeSwitch).toBeEnabled()

    Object.defineProperty(window, "PointerEvent", {
      configurable: true,
      value: MouseEvent,
    })

    await user.click(routeSwitch)

    await waitFor(() =>
      expect(updateTelegramFeatureSetting).toHaveBeenCalledWith({
        featureKey: "ECONOMIC_CALENDAR_ALERT",
        workspaceId: 7,
        enabled: true,
      })
    )
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Choose an eligible destination."
      )
    )
    expect(routeSwitch).not.toBeChecked()
    expect(routerRefresh).not.toHaveBeenCalled()
  })

  it("allows disabling when the assigned destination is inactive and bot state is unreadable", async () => {
    const inactiveDestination = {
      ...destination,
      status: "DISABLED" as const,
    }
    const setting = {
      ...featureSettings[0],
      enabled: true,
      destination: inactiveDestination,
    }
    const user = userEvent.setup()
    vi.mocked(updateTelegramFeatureSetting).mockResolvedValue({
      success: true,
      data: { ...setting, enabled: false },
    })

    renderConfiguration({
      ...data,
      destinations: [],
      featureSettings: [setting],
      sectionAccess: {
        ...data.sectionAccess,
        featureSettings: {
          ECONOMIC_CALENDAR_ALERT: true,
          MARKET_NEWS_ALERT: false,
          SCHEDULED_MARKET_ANALYSIS: false,
        },
      },
      manageAccess: {
        ...data.manageAccess,
        featureSettings: {
          ECONOMIC_CALENDAR_ALERT: true,
          MARKET_NEWS_ALERT: false,
          SCHEDULED_MARKET_ANALYSIS: false,
        },
      },
    })

    const routeSwitch = screen.getByRole("switch", {
      name: viDictionary.telegram.routing.switchAria.replace(
        "{route}",
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      ),
    })
    expect(routeSwitch).toBeChecked()
    expect(routeSwitch).toBeEnabled()

    Object.defineProperty(window, "PointerEvent", {
      configurable: true,
      value: MouseEvent,
    })
    await user.click(routeSwitch)

    await waitFor(() =>
      expect(updateTelegramFeatureSetting).toHaveBeenCalledWith({
        featureKey: "ECONOMIC_CALENDAR_ALERT",
        workspaceId: 7,
        enabled: false,
      })
    )
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        viDictionary.telegram.routing.disabledSuccess
      )
    )
    expect(routerRefresh).toHaveBeenCalledTimes(1)
  })

  it("clears an assigned destination with a confirmed atomic disable and keeps the saved language on failure", async () => {
    const user = userEvent.setup()
    vi.mocked(updateTelegramFeatureSetting).mockResolvedValue({
      success: false,
      error: "Could not clear the route.",
    })

    renderConfiguration({
      ...data,
      destinations: [],
      featureSettings: [{ ...featureSettings[0], enabled: true }],
      sectionAccess: {
        ...data.sectionAccess,
        destinations: false,
      },
      manageAccess: {
        ...data.manageAccess,
        featureSettings: {
          ECONOMIC_CALENDAR_ALERT: true,
          MARKET_NEWS_ALERT: false,
          SCHEDULED_MARKET_ANALYSIS: false,
        },
      },
    })

    const clearButton = screen.getByRole("button", {
      name: "Xóa điểm nhận cho Cảnh báo lịch kinh tế",
    })
    await user.click(clearButton)

    await waitFor(() =>
      expect(updateTelegramFeatureSetting).toHaveBeenCalledWith({
        featureKey: "ECONOMIC_CALENDAR_ALERT",
        workspaceId: 7,
        destinationId: null,
        enabled: false,
      })
    )
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Could not clear the route.")
    )
    const economicCalendarRow = screen
      .getByText(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )
      .closest("tr") as HTMLElement
    expect(
      within(economicCalendarRow).getByText(destination.displayLabel)
    ).toBeVisible()
    expect(
      screen.getByRole("switch", {
        name: viDictionary.telegram.routing.switchAria.replace(
          "{route}",
          viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
        ),
      })
    ).toBeChecked()
    expect(routerRefresh).not.toHaveBeenCalled()
  })

  it("does not show an unconfirmed destination as saved after a failed assignment", async () => {
    const user = userEvent.setup()
    vi.mocked(updateTelegramFeatureSetting).mockResolvedValue({
      success: false,
      error: "Destination is no longer eligible.",
    })

    renderConfiguration({
      ...data,
      featureSettings: [{ ...featureSettings[0], enabled: false }],
      destinations: [
        destination,
        { ...destination, id: 9, displayLabel: "Backup" },
      ],
      sectionAccess: { ...data.sectionAccess, destinations: true },
      manageAccess: {
        ...data.manageAccess,
        featureSettings: {
          ECONOMIC_CALENDAR_ALERT: true,
          MARKET_NEWS_ALERT: false,
          SCHEDULED_MARKET_ANALYSIS: false,
        },
      },
    })

    const destinationSelect = screen.getByRole("combobox", {
      name:
        viDictionary.telegram.routing.destinationColumn +
        ": " +
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label,
    })
    await user.click(destinationSelect)
    await user.click(await screen.findByRole("option", { name: "Backup" }))

    await waitFor(() =>
      expect(updateTelegramFeatureSetting).toHaveBeenCalledWith({
        featureKey: "ECONOMIC_CALENDAR_ALERT",
        workspaceId: 7,
        destinationId: 9,
        enabled: false,
      })
    )
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Destination is no longer eligible."
      )
    )
    expect(destinationSelect).toHaveTextContent("Operations")
    expect(destinationSelect).not.toHaveTextContent("Backup")
    expect(routerRefresh).not.toHaveBeenCalled()
  })

  it("keeps the Economic destination unchanged after a failed shared-row save", async () => {
    const user = userEvent.setup()
    vi.mocked(updateTelegramFeatureSetting).mockResolvedValue({
      success: false,
      error: "Destination is no longer eligible.",
    })

    renderConfiguration({
      ...data,
      featureSettings: [{ ...featureSettings[0], enabled: false }],
      destinations: [
        destination,
        { ...destination, id: 9, displayLabel: "Backup" },
      ],
      sectionAccess: {
        ...data.sectionAccess,
        destinations: true,
        featureSettings: allFeatureAccess,
      },
      manageAccess: {
        ...data.manageAccess,
        featureSettings: allFeatureAccess,
      },
    })

    const calendarRow = screen
      .getByText(
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label
      )
      .closest("tr") as HTMLElement
    const destinationSelect = within(calendarRow).getByRole("combobox", {
      name:
        viDictionary.telegram.routing.destinationColumn +
        ": " +
        viDictionary.telegram.routeDefinitions.ECONOMIC_CALENDAR_ALERT.label,
    })

    await user.click(destinationSelect)
    await user.click(await screen.findByRole("option", { name: "Backup" }))

    await waitFor(() =>
      expect(updateTelegramFeatureSetting).toHaveBeenCalledWith({
        featureKey: "ECONOMIC_CALENDAR_ALERT",
        workspaceId: 7,
        destinationId: 9,
        enabled: false,
      })
    )
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Destination is no longer eligible."
      )
    )
    expect(destinationSelect).toHaveTextContent("Operations")
    expect(destinationSelect).not.toHaveTextContent("Backup")
    expect(routerRefresh).not.toHaveBeenCalled()
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
