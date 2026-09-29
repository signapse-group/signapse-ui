import { beforeEach, describe, expect, it, vi } from "vitest"

const { testDictionary } = vi.hoisted(() => ({
  testDictionary: {
    smtpConfiguration: {
      responseInvalid: "SMTP response invalid",
      saveError: "Save failed",
      testError: "Test failed",
      enableError: "Enable failed",
      disableError: "Disable failed",
      deleteError: "Delete failed",
      validation: {
        hostRequired: "Host required",
        portRequired: "Port required",
        portInteger: "Port must be an integer",
        portRange: "Port must be from 1 to 65535",
        usernameRequired: "Username required",
        fromAddressRequired: "Sender email required",
        fromAddressInvalid: "Sender email invalid",
        passwordRequired: "Password required",
        passwordBlank: "Leave the saved password blank",
        versionRequired: "Version required",
        invalidRequest: "Request invalid",
      },
    },
  },
}))

vi.mock("@/app/api/auth/action", () => ({
  fetchAuthenticated: vi.fn(),
}))

vi.mock("@/app/lib/i18n/dictionaries", () => ({
  getDictionary: vi.fn(async () => testDictionary),
}))

vi.mock("@/app/lib/i18n/server", () => ({
  getRequestLocale: vi.fn(async () => "en"),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { fetchAuthenticated } from "@/app/api/auth/action"
import {
  deleteSmtpConfiguration,
  disableSmtpConfiguration,
  enableSmtpConfiguration,
  getSmtpConfiguration,
  saveSmtpConfiguration,
  testSmtpConfiguration,
} from "@/app/api/smtp-configuration/action"
import { SMTP_CONFIGURATION_VERSION_CONFLICT } from "@/app/lib/smtp-configuration/definitions"
import { revalidatePath } from "next/cache"

const configuration = {
  configured: true,
  enabled: false,
  passwordConfigured: true,
  version: 7,
  host: "smtp.example.net",
  port: 587,
  username: "notifications@example.net",
  securityMode: "STARTTLS" as const,
  fromAddress: "alerts@example.net",
  fromName: "Signapse",
}

const draft = {
  host: "smtp.example.net",
  port: 587,
  username: "notifications@example.net",
  securityMode: "STARTTLS" as const,
  fromAddress: "alerts@example.net",
  fromName: "Signapse",
}

describe("SMTP configuration authenticated actions", () => {
  beforeEach(() => {
    vi.mocked(fetchAuthenticated).mockReset()
    vi.mocked(revalidatePath).mockReset()
  })

  it("loads typed status and strips any returned credential fields", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue({
      ...configuration,
      password: "must-not-reach-the-client",
      encryptedPassword: "encrypted-secret",
    })

    await expect(getSmtpConfiguration()).resolves.toEqual(configuration)
    expect(fetchAuthenticated).toHaveBeenCalledWith("/smtp-configuration")
  })

  it("loads an unconfigured status when the backend returns null audit timestamps", async () => {
    const unconfigured = {
      configured: false,
      enabled: false,
      passwordConfigured: false,
      version: null,
      host: null,
      port: null,
      username: null,
      securityMode: null,
      fromAddress: null,
      fromName: null,
      createdDate: null,
      lastModifiedDate: null,
    }
    vi.mocked(fetchAuthenticated).mockResolvedValue(unconfigured)

    await expect(getSmtpConfiguration()).resolves.toEqual(unconfigured)
  })

  it("saves the update draft with its version and omits an empty password", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue(configuration)

    await expect(
      saveSmtpConfiguration({ ...draft, version: 7 })
    ).resolves.toEqual({ success: true, data: configuration })

    expect(fetchAuthenticated).toHaveBeenCalledWith("/smtp-configuration", {
      method: "PUT",
      body: JSON.stringify({ ...draft, version: 7 }),
    })
    expect(revalidatePath).toHaveBeenCalledWith("/email-delivery")
  })

  it("tests the current draft without saving or adding a recipient", async () => {
    vi.mocked(fetchAuthenticated).mockResolvedValue(undefined)

    await expect(
      testSmtpConfiguration({ ...draft, password: "new-password", version: 7 })
    ).resolves.toEqual({ success: true, data: undefined })

    expect(fetchAuthenticated).toHaveBeenCalledWith(
      "/smtp-configuration/test",
      expect.objectContaining({ method: "POST" })
    )
    const [, options] = vi.mocked(fetchAuthenticated).mock.calls[0] as [
      string,
      RequestInit,
    ]
    expect(JSON.parse(options.body as string)).toEqual({
      ...draft,
      password: "new-password",
      version: 7,
    })
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it("sends the current version for enable, disable, and delete", async () => {
    vi.mocked(fetchAuthenticated)
      .mockResolvedValueOnce({ ...configuration, enabled: true, version: 8 })
      .mockResolvedValueOnce({ ...configuration, version: 9 })
      .mockResolvedValueOnce(undefined)

    await expect(
      enableSmtpConfiguration({ version: 7 })
    ).resolves.toMatchObject({
      success: true,
      data: { enabled: true, version: 8 },
    })
    await expect(
      disableSmtpConfiguration({ version: 8 })
    ).resolves.toMatchObject({
      success: true,
      data: { enabled: false, version: 9 },
    })
    await expect(deleteSmtpConfiguration({ version: 9 })).resolves.toEqual({
      success: true,
      data: undefined,
    })

    expect(fetchAuthenticated).toHaveBeenNthCalledWith(
      1,
      "/smtp-configuration/enable",
      { method: "POST", body: JSON.stringify({ version: 7 }) }
    )
    expect(fetchAuthenticated).toHaveBeenNthCalledWith(
      2,
      "/smtp-configuration/disable",
      { method: "POST", body: JSON.stringify({ version: 8 }) }
    )
    expect(fetchAuthenticated).toHaveBeenNthCalledWith(
      3,
      "/smtp-configuration",
      { method: "DELETE", body: JSON.stringify({ version: 9 }) }
    )
  })

  it("rejects an invalid port before sending any request", async () => {
    await expect(
      saveSmtpConfiguration({
        ...draft,
        port: 65536,
        password: "new-password",
      })
    ).resolves.toEqual({
      success: false,
      error: "Port must be from 1 to 65535",
    })
    expect(fetchAuthenticated).not.toHaveBeenCalled()
  })

  it("preserves the backend conflict code for draft recovery", async () => {
    vi.mocked(fetchAuthenticated).mockRejectedValue(
      Object.assign(new Error("Configuration changed elsewhere"), {
        code: SMTP_CONFIGURATION_VERSION_CONFLICT,
      })
    )

    await expect(
      saveSmtpConfiguration({ ...draft, version: 7 })
    ).resolves.toEqual({
      success: false,
      error: "Configuration changed elsewhere",
      code: SMTP_CONFIGURATION_VERSION_CONFLICT,
    })
  })
})
