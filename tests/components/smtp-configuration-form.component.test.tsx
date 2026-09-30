// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { routerRefresh } = vi.hoisted(() => ({
  routerRefresh: vi.fn(),
}))

vi.mock("@/app/api/smtp-configuration/action", () => ({
  deleteSmtpConfiguration: vi.fn(),
  disableSmtpConfiguration: vi.fn(),
  enableSmtpConfiguration: vi.fn(),
  saveSmtpConfiguration: vi.fn(),
  testSmtpConfiguration: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}))

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

import {
  deleteSmtpConfiguration,
  disableSmtpConfiguration,
  enableSmtpConfiguration,
  saveSmtpConfiguration,
  testSmtpConfiguration,
} from "@/app/api/smtp-configuration/action"
import { en as enDictionary } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import {
  SMTP_CONFIGURATION_VERSION_CONFLICT,
  type SmtpConfigurationResponse,
} from "@/app/lib/smtp-configuration/definitions"
import { SmtpConfigurationForm } from "@/app/[lang]/(main)/email-delivery/smtp-configuration-form"
import { toast } from "sonner"

const configuredOff: SmtpConfigurationResponse = {
  configured: true,
  enabled: false,
  passwordConfigured: true,
  version: 7,
  host: "smtp.example.net",
  port: 587,
  username: "notifications@example.net",
  securityMode: "STARTTLS",
  fromAddress: "alerts@example.net",
  fromName: "Signapse",
}

const unconfigured: SmtpConfigurationResponse = {
  configured: false,
  enabled: false,
  passwordConfigured: false,
  version: null,
}

function renderForm(
  configuration = configuredOff,
  canManage = true,
  locale: "en" | "vi" = "vi",
  dictionary: Dictionary = viDictionary
) {
  return render(
    <LocalizationProvider locale={locale} dictionary={dictionary}>
      <SmtpConfigurationForm
        configuration={configuration}
        canManage={canManage}
      />
    </LocalizationProvider>
  )
}

function labelPattern(label: string) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`^${escaped}`)
}

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

const placeholderLocalizations = [
  {
    locale: "en" as const,
    dictionary: enDictionary,
    newPassword: "Enter SMTP password",
    savedPassword: "Leave blank to keep the saved password",
  },
  {
    locale: "vi" as const,
    dictionary: viDictionary,
    newPassword: "Nhập mật khẩu SMTP",
    savedPassword: "Để trống để giữ mật khẩu đã lưu",
  },
]

describe("SmtpConfigurationForm", () => {
  const t = viDictionary.smtpConfiguration

  beforeEach(() => {
    if (!window.PointerEvent) {
      Object.defineProperty(window, "PointerEvent", { value: MouseEvent })
    }
    routerRefresh.mockReset()
    vi.mocked(saveSmtpConfiguration).mockReset().mockResolvedValue({
      success: true,
      data: configuredOff,
    })
    vi.mocked(testSmtpConfiguration).mockReset().mockResolvedValue({
      success: true,
      data: undefined,
    })
    vi.mocked(enableSmtpConfiguration)
      .mockReset()
      .mockResolvedValue({
        success: true,
        data: { ...configuredOff, enabled: true, version: 8 },
      })
    vi.mocked(disableSmtpConfiguration)
      .mockReset()
      .mockResolvedValue({
        success: true,
        data: { ...configuredOff, version: 9 },
      })
    vi.mocked(deleteSmtpConfiguration).mockReset().mockResolvedValue({
      success: true,
      data: undefined,
    })
    vi.mocked(toast.error).mockReset()
    vi.mocked(toast.success).mockReset()
  })

  afterEach(() => cleanup())

  it.each(placeholderLocalizations)(
    "shows $locale placeholders as empty values for a new configuration",
    ({ locale, dictionary, newPassword }) => {
      const localizedText = dictionary.smtpConfiguration
      renderForm(unconfigured, true, locale, dictionary)

      const fields: Array<[string, string]> = [
        [localizedText.host, "smtp.example.net"],
        [localizedText.port, "587"],
        [localizedText.username, "notifications@example.net"],
        [localizedText.fromAddress, "alerts@example.net"],
        [localizedText.fromName, "Signapse"],
      ]

      for (const [label, placeholder] of fields) {
        const input = screen.getByLabelText(labelPattern(label))
        expect(input).toHaveProperty("value", "")
        expect(input).toHaveAttribute("placeholder", placeholder)
      }

      const port = screen.getByLabelText(labelPattern(localizedText.port))
      expect(port).toHaveAttribute("type", "text")
      expect(port).toHaveAttribute("inputmode", "numeric")

      const password = screen.getByLabelText(
        labelPattern(localizedText.password)
      )
      expect(password).toHaveValue("")
      expect(password).toHaveAttribute("required")
      expect(password).toHaveAttribute("placeholder", newPassword)
    }
  )

  it.each(placeholderLocalizations)(
    "keeps populated $locale settings while showing the saved-password instruction",
    ({ locale, dictionary, savedPassword }) => {
      const localizedText = dictionary.smtpConfiguration
      renderForm(configuredOff, true, locale, dictionary)

      const fields: Array<[string, string | number, string]> = [
        [localizedText.host, "smtp.example.net", "smtp.example.net"],
        [localizedText.port, "587", "587"],
        [
          localizedText.username,
          "notifications@example.net",
          "notifications@example.net",
        ],
        [localizedText.fromAddress, "alerts@example.net", "alerts@example.net"],
        [localizedText.fromName, "Signapse", "Signapse"],
      ]

      for (const [label, value, placeholder] of fields) {
        const input = screen.getByLabelText(labelPattern(label))
        expect(input).toHaveValue(value)
        expect(input).toHaveAttribute("placeholder", placeholder)
      }

      const password = screen.getByLabelText(
        labelPattern(localizedText.password)
      )
      expect(password).toHaveValue("")
      expect(password).toHaveAttribute("placeholder", savedPassword)
    }
  )

  it("renders saved settings without ever placing a saved password in the form", () => {
    renderForm(configuredOff)

    expect(screen.getByLabelText(labelPattern(t.host))).toHaveValue(
      "smtp.example.net"
    )
    expect(screen.getByLabelText(labelPattern(t.port))).toHaveValue("587")
    expect(screen.getByLabelText(labelPattern(t.username))).toHaveValue(
      "notifications@example.net"
    )
    expect(screen.getByLabelText(labelPattern(t.password))).toHaveValue("")
    expect(screen.getByLabelText(labelPattern(t.password))).toHaveAttribute(
      "placeholder",
      t.passwordPlaceholder
    )
    expect(screen.getByText(t.passwordConfigured)).toBeInTheDocument()
    expect(screen.getByText("7")).toBeInTheDocument()
    expect(screen.queryByText(/encrypted|secret/i)).not.toBeInTheDocument()
  })

  it("validates a new configuration and saves without a preliminary test", async () => {
    const user = userEvent.setup()
    vi.mocked(saveSmtpConfiguration).mockResolvedValue({
      success: true,
      data: { ...configuredOff, host: "smtp.new.example.net", version: 1 },
    })
    renderForm(unconfigured)
    expect(screen.getByLabelText(labelPattern(t.password))).toHaveAttribute(
      "placeholder",
      t.passwordRequiredPlaceholder
    )

    await user.type(
      screen.getByLabelText(labelPattern(t.host)),
      "smtp.new.example.net"
    )
    await user.type(screen.getByLabelText(labelPattern(t.port)), "587")
    await user.type(
      screen.getByLabelText(labelPattern(t.username)),
      "admin@example.net"
    )
    await user.type(
      screen.getByLabelText(labelPattern(t.password)),
      "new-password"
    )
    await user.type(
      screen.getByLabelText(labelPattern(t.fromAddress)),
      "alerts@example.net"
    )
    await user.click(screen.getByRole("button", { name: t.save }))

    await vi.waitFor(() => {
      expect(saveSmtpConfiguration).toHaveBeenCalledWith({
        host: "smtp.new.example.net",
        port: 587,
        username: "admin@example.net",
        securityMode: "STARTTLS",
        fromAddress: "alerts@example.net",
        fromName: "",
        password: "new-password",
      })
    })
    expect(testSmtpConfiguration).not.toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith(t.saveSuccess)
    expect(screen.getByLabelText(labelPattern(t.password))).toHaveValue("")
  })

  it("validates the required password, email, and port before Test", async () => {
    const user = userEvent.setup()
    renderForm(unconfigured)

    await user.type(
      screen.getByLabelText(labelPattern(t.host)),
      "smtp.example.net"
    )
    await user.type(screen.getByLabelText(labelPattern(t.port)), "65536")
    await user.type(screen.getByLabelText(labelPattern(t.username)), "admin")
    await user.type(
      screen.getByLabelText(labelPattern(t.fromAddress)),
      "bad-address"
    )
    await user.click(screen.getByRole("button", { name: t.test }))

    expect(await screen.findByText(t.validation.portRange)).toBeInTheDocument()
    expect(
      screen.getByText(t.validation.fromAddressInvalid)
    ).toBeInTheDocument()
    expect(screen.getByText(t.validation.passwordRequired)).toBeInTheDocument()
    expect(testSmtpConfiguration).not.toHaveBeenCalled()

    await user.clear(screen.getByLabelText(labelPattern(t.port)))
    await user.type(screen.getByLabelText(labelPattern(t.port)), "587.5")
    await user.click(screen.getByRole("button", { name: t.test }))

    expect(
      await screen.findByText(t.validation.portInteger)
    ).toBeInTheDocument()
    expect(testSmtpConfiguration).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: t.save }))
    expect(saveSmtpConfiguration).not.toHaveBeenCalled()
    expect(testSmtpConfiguration).not.toHaveBeenCalled()
  })

  it("tests an update draft without saving and locks related actions while pending", async () => {
    const user = userEvent.setup()
    const testResult =
      deferred<Awaited<ReturnType<typeof testSmtpConfiguration>>>()
    vi.mocked(testSmtpConfiguration).mockReturnValue(testResult.promise)
    renderForm(configuredOff)
    await user.clear(screen.getByLabelText(labelPattern(t.host)))
    await user.type(
      screen.getByLabelText(labelPattern(t.host)),
      "smtp.draft.example.net"
    )
    await user.click(screen.getByRole("button", { name: t.test }))

    expect(testSmtpConfiguration).toHaveBeenCalledWith({
      host: "smtp.draft.example.net",
      port: 587,
      username: "notifications@example.net",
      securityMode: "STARTTLS",
      fromAddress: "alerts@example.net",
      fromName: "Signapse",
      version: 7,
    })
    expect(screen.getByRole("button", { name: t.save })).toBeDisabled()
    expect(screen.getByRole("button", { name: t.testPending })).toBeDisabled()

    testResult.resolve({ success: true, data: undefined })
    await vi.waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(t.testSuccess)
    )
    expect(saveSmtpConfiguration).not.toHaveBeenCalled()
    expect(screen.getByLabelText(labelPattern(t.host))).toHaveValue(
      "smtp.draft.example.net"
    )
  })

  it("omits the password when saving an unchanged password for an existing configuration", async () => {
    const user = userEvent.setup()
    renderForm(configuredOff)

    await user.click(screen.getByRole("button", { name: t.save }))

    await vi.waitFor(() => {
      expect(saveSmtpConfiguration).toHaveBeenCalledWith({
        host: "smtp.example.net",
        port: 587,
        username: "notifications@example.net",
        securityMode: "STARTTLS",
        fromAddress: "alerts@example.net",
        fromName: "Signapse",
        version: 7,
      })
    })
  })

  it("keeps the entered draft after a failed Save", async () => {
    const user = userEvent.setup()
    vi.mocked(saveSmtpConfiguration).mockResolvedValue({
      success: false,
      error: "SMTP connection rejected",
    })
    renderForm(configuredOff)
    await user.clear(screen.getByLabelText(labelPattern(t.host)))
    await user.type(
      screen.getByLabelText(labelPattern(t.host)),
      "smtp.failed.example.net"
    )
    await user.click(screen.getByRole("button", { name: t.save }))

    await vi.waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("SMTP connection rejected")
    })
    expect(screen.getByLabelText(labelPattern(t.host))).toHaveValue(
      "smtp.failed.example.net"
    )
    expect(testSmtpConfiguration).not.toHaveBeenCalled()
  })

  it("keeps the draft and refreshes canonical state on a version conflict", async () => {
    const user = userEvent.setup()
    vi.mocked(saveSmtpConfiguration).mockResolvedValue({
      success: false,
      error: "Configuration version is stale",
      code: SMTP_CONFIGURATION_VERSION_CONFLICT,
    })
    renderForm(configuredOff)
    await user.clear(screen.getByLabelText(labelPattern(t.host)))
    await user.type(
      screen.getByLabelText(labelPattern(t.host)),
      "smtp.draft.example.net"
    )
    await user.click(screen.getByRole("button", { name: t.save }))

    await vi.waitFor(() => {
      expect(routerRefresh).toHaveBeenCalledTimes(1)
      expect(toast.error).toHaveBeenCalledWith(
        "Configuration version is stale",
        {
          description: `${SMTP_CONFIGURATION_VERSION_CONFLICT}. ${t.conflictRecovery}`,
        }
      )
    })
    expect(screen.getByLabelText(labelPattern(t.host))).toHaveValue(
      "smtp.draft.example.net"
    )
  })

  it("changes delivery only after the versioned response succeeds", async () => {
    const user = userEvent.setup()
    const enableResult =
      deferred<Awaited<ReturnType<typeof enableSmtpConfiguration>>>()
    vi.mocked(enableSmtpConfiguration).mockReturnValue(enableResult.promise)
    renderForm(configuredOff)
    const deliverySwitch = screen.getByRole("switch", {
      name: t.deliveryToggleLabel,
    })

    await user.click(deliverySwitch)
    expect(enableSmtpConfiguration).toHaveBeenCalledWith({ version: 7 })
    expect(deliverySwitch).toHaveAttribute("aria-checked", "false")
    expect(deliverySwitch).toHaveAttribute("aria-disabled", "true")

    enableResult.resolve({
      success: true,
      data: { ...configuredOff, enabled: true, version: 8 },
    })
    await vi.waitFor(() =>
      expect(deliverySwitch).toHaveAttribute("aria-checked", "true")
    )

    await user.click(deliverySwitch)
    expect(disableSmtpConfiguration).toHaveBeenCalledWith({ version: 8 })
    await vi.waitFor(() =>
      expect(deliverySwitch).toHaveAttribute("aria-checked", "false")
    )
  })

  it("uses the shared destructive confirmation and versions Delete", async () => {
    const user = userEvent.setup()
    renderForm(configuredOff)

    await user.click(screen.getByRole("button", { name: t.delete }))
    const dialog = await screen.findByRole("alertdialog")
    expect(dialog).toHaveTextContent(t.deleteDescription)
    await user.click(within(dialog).getByRole("button", { name: t.delete }))

    await vi.waitFor(() => {
      expect(deleteSmtpConfiguration).toHaveBeenCalledWith({ version: 7 })
      expect(toast.success).toHaveBeenCalledWith(t.deleteSuccess)
    })
    expect(screen.getByLabelText(labelPattern(t.host))).toHaveValue("")
  })

  it("renders data read-only without exposing management controls or a password input", () => {
    renderForm(configuredOff, false)

    expect(screen.getByLabelText(labelPattern(t.host))).toBeDisabled()
    expect(
      screen.queryByLabelText(labelPattern(t.password))
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: t.save })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: t.test })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole("switch", { name: t.deliveryToggleLabel })
    ).toHaveAttribute("aria-disabled", "true")
    expect(screen.getByText(t.readOnly)).toBeInTheDocument()
    expect(saveSmtpConfiguration).not.toHaveBeenCalled()
    expect(enableSmtpConfiguration).not.toHaveBeenCalled()
  })
})
