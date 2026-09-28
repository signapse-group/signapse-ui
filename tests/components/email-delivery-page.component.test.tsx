import { describe, expect, it, vi } from "vitest"

vi.mock("@/app/api/smtp-configuration/action", () => ({
  getSmtpConfiguration: vi.fn(),
}))

vi.mock("@/app/lib/permissions-server", () => ({
  getCurrentPermissions: vi.fn(),
}))

vi.mock("@/app/lib/i18n/server", () => ({
  getServerDictionary: vi.fn(),
}))

import { getSmtpConfiguration } from "@/app/api/smtp-configuration/action"
import { getServerDictionary } from "@/app/lib/i18n/server"
import { getCurrentPermissions } from "@/app/lib/permissions-server"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"
import EmailDeliveryPage from "@/app/[lang]/(main)/email-delivery/page"

describe("EmailDeliveryPage access gate", () => {
  it("renders shared AccessDenied and does not load configuration without read permission", async () => {
    vi.mocked(getCurrentPermissions).mockResolvedValue([])
    vi.mocked(getServerDictionary).mockResolvedValue(viDictionary)

    const page = await EmailDeliveryPage()

    expect(page).toMatchObject({ type: expect.any(Function) })
    expect(getSmtpConfiguration).not.toHaveBeenCalled()
  })
})
