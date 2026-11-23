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
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
}))

import {
  createTelegramBotConnection,
  deleteTelegramMarketAnalysisSchedule,
  disableTelegramMarketAnalysisSchedule,
  updateTelegramFeatureSetting,
} from "@/app/api/telegram/action"
import { toast } from "sonner"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import type {
  TelegramBotConnectionResponse,
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
    destinations: false,
    featureSettings: true,
    schedules: true,
    watchlistAssets: true,
  },
  manageAccess: {
    botConnections: false,
    destinations: false,
    featureSettings: false,
    schedules: true,
  },
}

const selectControlledWarning =
  "Base UI: A component is changing the uncontrolled value state of Select to be controlled."

function renderConfiguration(
  configurationData: TelegramConfigurationData = data,
  access: {
    canCreateBotConnections?: boolean
    canReconnectBotConnections?: boolean
  } = {}
) {
  return render(
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
      <TelegramConfigurationPage data={configurationData} {...access} />
    </LocalizationProvider>
  )
}

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
  canReconnect = false,
}: {
  botConnections?: TelegramBotConnectionResponse[]
  canRead?: boolean
  canManage?: boolean
  canCreate?: boolean
  canReconnect?: boolean
} = {}) {
  return render(
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
      <BotConnectionsCard
        botConnections={botConnections}
        canRead={canRead}
        canManage={canManage}
        canCreate={canCreate}
        canReconnect={canReconnect}
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
    expect(
      screen.queryByRole("button", {
        name: viDictionary.telegram.bot.actionMenu,
      })
    ).not.toBeInTheDocument()
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
      screen.queryByRole("button", {
        name: viDictionary.telegram.bot.actionMenu,
      })
    ).not.toBeInTheDocument()

    cleanup()
    renderBotConnectionsCard({
      botConnections: [botConnection],
      canManage: true,
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

  it("announces a create error, preserves the token, and restores dialog focus", async () => {
    const user = userEvent.setup()
    vi.mocked(createTelegramBotConnection).mockResolvedValue({
      success: false,
      error: "Token verification failed.",
    })
    renderBotConnectionsCard({ canCreate: true })

    const trigger = screen.getByRole("button", {
      name: viDictionary.telegram.bot.connect,
    })
    trigger.focus()
    await user.keyboard("{Enter}")

    const dialog = await screen.findByRole("dialog")
    const token = screen.getByLabelText(viDictionary.telegram.bot.tokenLabel)
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
      "Token verification failed."
    )
    expect(token).toHaveValue("fake-token")
    expect(token).toHaveAttribute("aria-invalid", "true")
    expect(token.getAttribute("aria-describedby")).toContain(
      "telegram-bot-token-error"
    )
    await waitFor(() => expect(token).toHaveFocus())

    await user.keyboard("{Escape}")
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    )
    expect(trigger).toHaveFocus()
    expect(dialog).not.toBeInTheDocument()
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

  it("shows localized incomplete-setup guidance only to users with reconnect access", () => {
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

    cleanup()
    renderBotConnectionsCard({
      botConnections: [invalidConnection],
      canRead: true,
      canReconnect: true,
    })
    expect(
      screen.getByText(viDictionary.telegram.bot.reconnectGuidance)
    ).toBeVisible()
  })
})
