// @vitest-environment jsdom

import {
  cleanup,
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
  createTelegramMarketAnalysisSchedule: vi.fn(),
  updateTelegramMarketAnalysisSchedule: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}))

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

import {
  createTelegramMarketAnalysisSchedule,
  updateTelegramMarketAnalysisSchedule,
} from "@/app/api/telegram/action"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import type { TelegramMarketAnalysisScheduleResponse } from "@/app/lib/telegram/definitions"
import {
  CreateTelegramScheduleDialog,
  UpdateTelegramScheduleDialog,
} from "@/app/[lang]/(main)/telegram/telegram-schedule-form"

const props = {
  activeDestinations: [
    {
      id: 8,
      botConnectionId: 1,
      chatType: "PRIVATE" as const,
      displayLabel: "Operations",
      status: "ACTIVE" as const,
    },
  ],
  currentWorkspace: { id: 7, name: "Workspace" },
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
  canCreate: true,
}

const response: TelegramMarketAnalysisScheduleResponse = {
  id: 11,
  name: "Morning analysis",
  workspaceId: 7,
  workspaceName: "Workspace",
  timezone: "Asia/Bangkok",
  localTimes: ["09:00"],
  status: "ACTIVE",
  destination: props.activeDestinations[0],
  asset: {
    assetId: 9,
    assetName: "Gold",
    assetSymbol: "GOLD",
  },
  outputLanguage: null,
}

const selectControlledWarning =
  "Base UI: A component is changing the uncontrolled value state of Select to be controlled."

function renderWithLocalization(children: React.ReactNode) {
  return render(
    <LocalizationProvider locale="vi" dictionary={viDictionary}>
      {children}
    </LocalizationProvider>
  )
}

async function openCreateDialog() {
  renderWithLocalization(<CreateTelegramScheduleDialog {...props} />)
  const user = userEvent.setup()
  await user.click(
    screen.getByRole("button", {
      name: viDictionary.telegram.schedule.createSchedule,
    })
  )
  return { dialog: screen.getByRole("dialog"), user }
}

async function fillValidSchedule(
  dialog: HTMLElement,
  user: ReturnType<typeof userEvent.setup>
) {
  await user.type(
    within(dialog).getByLabelText(viDictionary.telegram.schedule.nameLabel),
    "Morning analysis"
  )
  await user.click(
    within(dialog).getByRole("combobox", {
      name: viDictionary.telegram.schedule.assetLabel,
    })
  )
  await user.click(await screen.findByRole("option", { name: /GOLD/ }))
  await user.type(
    within(dialog).getByLabelText(
      viDictionary.telegram.schedule.localTimeRowLabel.replace("{index}", "1")
    ),
    "09:00"
  )
}

async function selectUtcTimezone(
  dialog: HTMLElement,
  user: ReturnType<typeof userEvent.setup>
) {
  const timezone = within(dialog).getByRole("combobox", {
    name: viDictionary.telegram.schedule.timezoneLabel,
  })

  await user.click(timezone)
  await user.click(await screen.findByRole("option", { name: /UTC — UTC$/ }))
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

describe("Telegram schedule form behavior", () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.mocked(createTelegramMarketAnalysisSchedule).mockReset()
    vi.mocked(updateTelegramMarketAnalysisSchedule).mockReset()
    routerRefresh.mockReset()
  })

  it("prevents create when no active destination can be selected", () => {
    renderWithLocalization(
      <CreateTelegramScheduleDialog
        {...props}
        activeDestinations={[]}
        canCreate
      />
    )

    expect(
      screen.getByRole("button", {
        name: viDictionary.telegram.schedule.createSchedule,
      })
    ).toBeDisabled()
    expect(
      screen.getByText(
        viDictionary.telegram.schedule.createDisabledNoDestination
      )
    ).toBeVisible()
  })

  it("shows accessible validation errors and submits normalized values", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined)

    try {
      const { dialog, user } = await openCreateDialog()
      const submit = within(dialog).getByRole("button", {
        name: viDictionary.telegram.schedule.createSchedule,
      })

      await user.click(submit)
      expect(
        screen.getByText(viDictionary.telegram.assetRequired)
      ).toBeVisible()
      expect(
        screen.getByText(viDictionary.telegram.localTimeInvalid)
      ).toBeVisible()

      await fillValidSchedule(dialog, user)
      await selectUtcTimezone(dialog, user)
      vi.mocked(createTelegramMarketAnalysisSchedule).mockResolvedValue({
        success: true,
        data: response,
      })
      await user.click(submit)

      await waitFor(() => {
        expect(createTelegramMarketAnalysisSchedule).toHaveBeenCalledWith({
          name: "Morning analysis",
          workspaceId: 7,
          destinationId: 8,
          assetId: 9,
          timezone: "UTC",
          localTimes: ["09:00"],
          outputLanguageIsoCode: undefined,
        })
      })
      await waitFor(() => expect(routerRefresh).toHaveBeenCalledTimes(1))
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      expectNoSelectControlledWarning(consoleError.mock.calls)
    } finally {
      consoleError.mockRestore()
    }
  }, 10_000)

  it("keeps input and exposes retryable backend errors", async () => {
    const { dialog, user } = await openCreateDialog()
    expect(
      within(dialog).getByRole("combobox", {
        name: viDictionary.telegram.schedule.destinationLabel,
      })
    ).toHaveAttribute("aria-required", "true")
    await fillValidSchedule(dialog, user)
    vi.mocked(createTelegramMarketAnalysisSchedule).mockResolvedValue({
      success: false,
      error: "Backend refused the schedule",
    })

    await user.click(
      within(dialog).getByRole("button", {
        name: viDictionary.telegram.schedule.createSchedule,
      })
    )

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Backend refused the schedule"
      )
    )
    expect(
      within(screen.getByRole("dialog")).getByDisplayValue("Morning analysis")
    ).toBeInTheDocument()
    expect(routerRefresh).not.toHaveBeenCalled()
  })

  it("asks before closing a dirty schedule draft from the dialog close button", async () => {
    const { dialog, user } = await openCreateDialog()
    await user.type(
      within(dialog).getByLabelText(viDictionary.telegram.schedule.nameLabel),
      "Draft schedule"
    )
    await user.click(
      within(dialog).getAllByRole("button", {
        name: viDictionary.common.close,
      })[0]
    )

    const discardDialog = screen.getByRole("alertdialog")
    expect(dialog).toBeVisible()
    await user.click(
      within(discardDialog).getByRole("button", {
        name: viDictionary.telegram.schedule.discardAction,
      })
    )
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(routerRefresh).not.toHaveBeenCalled()
  })

  it("renders an accessible edit trigger and saves the active schedule", async () => {
    const user = userEvent.setup()
    renderWithLocalization(
      <UpdateTelegramScheduleDialog
        schedule={response}
        activeDestinations={props.activeDestinations}
        watchlistAssets={props.watchlistAssets}
        languages={props.languages}
        languageCatalogError={false}
        canUpdate
        assetEditable
      />
    )

    await user.click(
      screen.getByRole("button", {
        name: viDictionary.telegram.schedule.editTrigger,
      })
    )
    const dialog = screen.getByRole("dialog")
    expect(
      within(dialog).getByDisplayValue("Morning analysis")
    ).toBeInTheDocument()
    await selectUtcTimezone(dialog, user)

    vi.mocked(updateTelegramMarketAnalysisSchedule).mockResolvedValue({
      success: true,
      data: response,
    })
    await user.click(
      within(dialog).getByRole("button", {
        name: viDictionary.telegram.schedule.saveSchedule,
      })
    )

    await waitFor(() =>
      expect(updateTelegramMarketAnalysisSchedule).toHaveBeenCalledWith(11, {
        name: "Morning analysis",
        workspaceId: 7,
        destinationId: 8,
        assetId: 9,
        timezone: "UTC",
        localTimes: ["09:00"],
        outputLanguageIsoCode: undefined,
      })
    )
    await waitFor(() => expect(routerRefresh).toHaveBeenCalledTimes(1))
  })

  it("keeps an edit draft and does not report success when update is rejected", async () => {
    const user = userEvent.setup()
    renderWithLocalization(
      <UpdateTelegramScheduleDialog
        schedule={{ ...response, workspaceId: 12, workspaceName: "Research" }}
        activeDestinations={props.activeDestinations}
        watchlistAssets={props.watchlistAssets}
        languages={props.languages}
        languageCatalogError={false}
        canUpdate
        assetEditable={false}
      />
    )

    await user.click(
      screen.getByRole("button", {
        name: viDictionary.telegram.schedule.editTrigger,
      })
    )
    const dialog = screen.getByRole("dialog")
    const nameField = within(dialog).getByLabelText(
      viDictionary.telegram.schedule.nameLabel
    )
    await user.clear(nameField)
    await user.type(nameField, "Revised research schedule")
    vi.mocked(updateTelegramMarketAnalysisSchedule).mockResolvedValue({
      success: false,
      error: "Update rejected",
    })

    await user.click(
      within(dialog).getByRole("button", {
        name: viDictionary.telegram.schedule.saveSchedule,
      })
    )

    await waitFor(() =>
      expect(updateTelegramMarketAnalysisSchedule).toHaveBeenCalledWith(11, {
        name: "Revised research schedule",
        workspaceId: 12,
        destinationId: 8,
        assetId: 9,
        timezone: "Asia/Bangkok",
        localTimes: ["09:00"],
        outputLanguageIsoCode: undefined,
      })
    )
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Update rejected"
    )
    expect(
      within(screen.getByRole("dialog")).getByDisplayValue(
        "Revised research schedule"
      )
    ).toBeInTheDocument()
    expect(routerRefresh).not.toHaveBeenCalled()
  })
})
