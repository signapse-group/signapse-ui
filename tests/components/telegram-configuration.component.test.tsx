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
  createTelegramLinkToken,
  deleteTelegramBotConnection,
  deleteTelegramMarketAnalysisSchedule,
  disableTelegramMarketAnalysisSchedule,
  updateTelegramFeatureSetting,
} from "@/app/api/telegram/action"
import { toast } from "sonner"
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

  it("reports a successful create with no saved status as unverified", async () => {
    const user = userEvent.setup()
    vi.mocked(createTelegramBotConnection).mockResolvedValue({
      success: true,
      data: {
        connection: {
          id: 13,
          displayLabel: "Status not returned",
        },
        created: true,
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
      expect(toast.warning).toHaveBeenCalledWith(
        viDictionary.telegram.bot.createStatusUnverified
      )
    )
    expect(toast.error).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
    expect(routerRefresh).toHaveBeenCalledTimes(1)
  })

  it("reports an unknown create outcome without claiming failure", async () => {
    const user = userEvent.setup()
    vi.mocked(createTelegramBotConnection).mockResolvedValue({
      success: true,
      data: { connection: {}, created: null },
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
      expect(toast.warning).toHaveBeenCalledWith(
        viDictionary.telegram.bot.createOutcomeUnverified
      )
    )
    expect(toast.error).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
    expect(routerRefresh).toHaveBeenCalledTimes(1)
  })

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
