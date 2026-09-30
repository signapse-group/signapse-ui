import { expect, test, waitForClientHandler } from "./fixtures"

const configuredSmtp = (enabled = false) => ({
  configured: true,
  enabled,
  passwordConfigured: true,
  version: 7,
  host: "smtp.example.net",
  port: 587,
  username: "notifications@example.net",
  securityMode: "STARTTLS",
  fromAddress: "alerts@example.net",
  fromName: "Signapse",
  createdDate: "2026-09-28T15:00:00Z",
  lastModifiedDate: "2026-09-28T15:00:00Z",
})

test.describe("P0 email delivery HTTP integration", () => {
  test("renders a null-timestamp unconfigured response read-only", async ({
    page,
    fixture,
  }) => {
    await fixture.setSmtpConfiguration(null)
    await fixture.setPermissions(["smtp-configuration:read"])

    await page.goto("/vi/email-delivery")

    await expect(page.locator("h1")).toHaveText("Gửi email hệ thống")
    await expect(page.getByText("Chưa cấu hình", { exact: true })).toBeVisible()
    await expect(page.getByLabel("Máy chủ SMTP")).toHaveValue("")
    await expect(page.getByLabel("Máy chủ SMTP")).toBeDisabled()
    await expect(page.getByLabel("Mật khẩu mới")).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Lưu cấu hình" })
    ).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Gửi email thử" })
    ).toHaveCount(0)

    const state = await fixture.state()
    expect(
      state.requests.filter((request) => request.path === "/smtp-configuration")
    ).toHaveLength(1)
    expect(state.smtpConfiguration).toMatchObject({
      configured: false,
      createdDate: null,
      lastModifiedDate: null,
    })
  })

  test("renders an empty editable form for a user with manage permission", async ({
    page,
    fixture,
  }) => {
    await fixture.setSmtpConfiguration(null)
    await fixture.setPermissions([
      "smtp-configuration:read",
      "smtp-configuration:manage",
    ])

    await page.goto("/en/email-delivery")

    await expect(page.locator("h1")).toHaveText("Email delivery")
    await expect(
      page.getByText("Not configured", { exact: true })
    ).toBeVisible()
    await expect(page.getByLabel("SMTP host")).toHaveValue("")
    await expect(page.getByLabel("SMTP host")).toBeEnabled()
    await expect(page.getByLabel("Port")).toHaveValue("")
    await expect(page.getByLabel("Username")).toHaveValue("")
    await expect(page.getByLabel("New password")).toHaveValue("")
    await expect(page.getByLabel("New password")).toHaveAttribute(
      "required",
      ""
    )
    await expect(page.getByLabel("From email")).toHaveValue("")
    await expect(page.getByLabel("From name (optional)")).toHaveValue("")
    await expect(
      page.getByRole("button", { name: "Save configuration" })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Send test email" })
    ).toBeVisible()
    await expect(
      page.getByText("Email delivery is unavailable", { exact: true })
    ).toHaveCount(0)

    const state = await fixture.state()
    const smtpRequests = state.requests.filter(
      (request) => request.path === "/smtp-configuration"
    )
    expect(smtpRequests).toHaveLength(1)
    expect(smtpRequests[0]).toMatchObject({ method: "GET" })
  })

  test("keeps configured SMTP reads safe for read-only users", async ({
    page,
    fixture,
  }) => {
    const passwordSecret = "must-not-reach-the-client"
    const encryptedSecret = "encrypted-secret-must-not-reach-the-client"
    await fixture.setSmtpConfiguration({
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
      createdDate: "2026-09-28T15:00:00Z",
      lastModifiedDate: "2026-09-28T15:00:00Z",
      password: passwordSecret,
      encryptedPassword: encryptedSecret,
    })
    await fixture.setPermissions(["smtp-configuration:read"])

    await page.goto("/en/email-delivery")

    await expect(page.locator("h1")).toHaveText("Email delivery")
    await expect(page.getByLabel("SMTP host")).toHaveValue("smtp.example.net")
    await expect(page.getByLabel("SMTP host")).toBeDisabled()
    await expect(
      page.getByText("Password saved", { exact: true })
    ).toBeVisible()
    await expect(page.getByLabel("New password")).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Save configuration" })
    ).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Send test email" })
    ).toHaveCount(0)
    await expect(
      page.getByRole("button", { name: "Delete configuration" })
    ).toHaveCount(0)

    const document = await page.content()
    expect(document).not.toContain(passwordSecret)
    expect(document).not.toContain(encryptedSecret)

    const state = await fixture.state()
    const smtpRequests = state.requests.filter(
      (request) => request.path === "/smtp-configuration"
    )
    expect(smtpRequests).toHaveLength(1)
    expect(smtpRequests[0]).toMatchObject({ method: "GET" })
  })

  test("keeps email controls reachable across viewport widths and sidebar states", async ({
    page,
    fixture,
  }, testInfo) => {
    await fixture.setSmtpConfiguration(configuredSmtp())
    await fixture.setPermissions([
      "smtp-configuration:read",
      "smtp-configuration:manage",
    ])
    await page.context().clearCookies({ name: "sidebar_state" })
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.emulateMedia({ colorScheme: "dark" })
    await page.goto("/en/email-delivery")

    const sidebar = page.locator('[data-slot="sidebar"]').first()
    await expect(sidebar).toHaveAttribute("data-state", "expanded")
    await expect(page.locator("html")).toHaveClass(/\bdark\b/)
    const configurationDetails = page.locator("form dl")
    await expect(configurationDetails.locator("dt")).toHaveText([
      "Configured",
      "Password",
      "Version",
    ])
    await expect(configurationDetails.locator("dd")).toHaveText([
      "Configured",
      "Password saved",
      "7",
    ])

    const desktopReference = await page.screenshot({ fullPage: false })
    await testInfo.attach("email-delivery-dark-en-configured-off.png", {
      body: desktopReference,
      contentType: "image/png",
    })

    for (const width of [390, 775, 1024, 1520]) {
      await page.setViewportSize({ width, height: 1024 })
      const sidebarStates: Array<boolean | null> =
        width >= 768 ? [true, false] : [null]

      for (const expanded of sidebarStates) {
        if (expanded !== null) {
          const expectedState = expanded ? "expanded" : "collapsed"
          if ((await sidebar.getAttribute("data-state")) !== expectedState) {
            await page.locator('[data-slot="sidebar-trigger"]').first().click()
          }
          await expect(sidebar).toHaveAttribute("data-state", expectedState)
          await expect(sidebar.locator('[data-slot="sidebar-gap"]')).toHaveCSS(
            "width",
            expanded ? "256px" : "48px"
          )
        }

        const dimensions = await page.evaluate(() => ({
          viewport: window.innerWidth,
          document: document.documentElement.scrollWidth,
          body: document.body.scrollWidth,
        }))
        const stateLabel = expanded === null ? "mobile" : String(expanded)
        expect(
          dimensions.document,
          `Horizontal page overflow at ${width}px (sidebar ${stateLabel}): ${JSON.stringify(dimensions)}`
        ).toBeLessThanOrEqual(dimensions.viewport)
        expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport)

        const outOfBoundsControls = await page
          .locator(
            "form input, form button, form [role='switch'], section button"
          )
          .evaluateAll((elements) =>
            elements
              .filter((element) => element.getClientRects().length > 0)
              .map((element) => {
                const rect = element.getBoundingClientRect()
                return {
                  name:
                    element.getAttribute("aria-label") ||
                    element.textContent?.trim() ||
                    element.tagName,
                  left: rect.left,
                  right: rect.right,
                }
              })
              .filter(
                (control) =>
                  control.left < -1 || control.right > window.innerWidth + 1
              )
          )
        expect(
          outOfBoundsControls,
          `Controls outside the ${width}px viewport (sidebar ${stateLabel})`
        ).toEqual([])

        const cards = await page
          .locator("form [data-slot='card']")
          .evaluateAll((elements) =>
            elements.map((element) => {
              const rect = element.getBoundingClientRect()
              return {
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
              }
            })
          )
        expect(cards).toHaveLength(3)
        if (width < 1280) {
          expect(cards[0].y).toBeLessThan(cards[1].y)
          expect(cards[1].y).toBeLessThan(cards[2].y)
        } else {
          expect(cards[1].x).toBeGreaterThan(cards[0].x)
          expect(cards[2].x).toBe(cards[1].x)
          const rightColumnHeight = cards[2].y + cards[2].height - cards[1].y
          expect(cards[0].height).toBeLessThan(rightColumnHeight)
        }

        await expect(
          page.getByRole("button", { name: "Delete configuration" })
        ).toBeVisible()
      }
    }
  })

  test("renders one delivery heading beside its switch and status", async ({
    page,
    fixture,
  }) => {
    await fixture.setSmtpConfiguration(configuredSmtp())
    await fixture.setPermissions([
      "smtp-configuration:read",
      "smtp-configuration:manage",
    ])
    await page.goto("/en/email-delivery")

    await expect(
      page.getByText("System email delivery", { exact: true })
    ).toHaveCount(1)
    await expect(
      page.getByRole("switch", { name: "Enable system email delivery" })
    ).toBeVisible()
    await expect(page.getByText("Off", { exact: true })).toBeVisible()
  })

  test("explains the disabled Delete action in English and Vietnamese", async ({
    page,
    fixture,
  }) => {
    await fixture.setPermissions([
      "smtp-configuration:read",
      "smtp-configuration:manage",
    ])

    for (const locale of [
      {
        path: "/en/email-delivery",
        colorScheme: "dark" as const,
        heading: "System email delivery",
        enabledStatus: "On",
        disabledStatus: "Off",
        switchLabel: "Enable system email delivery",
        deleteButton: "Delete configuration",
        guidance:
          "Turn system email delivery off before deleting the configuration.",
      },
      {
        path: "/vi/email-delivery",
        colorScheme: "light" as const,
        heading: "Gửi email hệ thống",
        enabledStatus: "Bật",
        disabledStatus: "Tắt",
        switchLabel: "Bật gửi email hệ thống",
        deleteButton: "Xóa cấu hình",
        guidance: "Tắt gửi email hệ thống trước khi xóa cấu hình.",
      },
    ]) {
      await fixture.setSmtpConfiguration(configuredSmtp(true))
      await page.emulateMedia({ colorScheme: locale.colorScheme })
      await page.goto(locale.path)
      if (locale.colorScheme === "dark") {
        await expect(page.locator("html")).toHaveClass(/\bdark\b/)
      } else {
        await expect(page.locator("html")).not.toHaveClass(/\bdark\b/)
      }
      await expect(
        page
          .locator("form [data-slot='card']")
          .nth(1)
          .getByText(locale.heading, { exact: true })
      ).toHaveCount(1)
      await expect(
        page.getByRole("switch", { name: locale.switchLabel })
      ).toBeChecked()
      await expect(
        page.getByText(locale.enabledStatus, { exact: true })
      ).toBeVisible()

      const deleteButton = page.getByRole("button", {
        name: locale.deleteButton,
      })
      await expect(deleteButton).toBeDisabled()
      await expect(
        page.getByText(locale.guidance, { exact: true })
      ).toBeVisible()

      await fixture.setSmtpConfiguration(configuredSmtp(false))
      await page.reload()
      await expect(
        page.getByText(locale.disabledStatus, { exact: true })
      ).toBeVisible()
      await expect(deleteButton).toBeEnabled()
      await expect(
        page.getByText(locale.guidance, { exact: true })
      ).toHaveCount(0)
      await deleteButton.click()
      await expect(page.getByRole("alertdialog")).toBeVisible()
    }
  })

  test("tests, saves, toggles, and deletes SMTP configuration safely", async ({
    page,
    fixture,
  }, testInfo) => {
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.goto("/vi/email-delivery")

    await expect(page.locator("h1")).toHaveText("Gửi email hệ thống")
    const breadcrumb = page.getByRole("navigation", {
      name: "Đường dẫn điều hướng",
    })
    await expect(breadcrumb).toContainText("Cấu hình hệ thống")
    await expect(breadcrumb).toContainText("Gửi email hệ thống")
    await expect(breadcrumb).not.toContainText("Tổng quan")
    await expect(page.getByLabel("Máy chủ SMTP")).toHaveValue(
      "smtp.example.com"
    )
    await expect(page.getByLabel("Mật khẩu mới")).toHaveValue("")
    await expect(page.getByText("Đã lưu mật khẩu")).toBeVisible()
    await expect(page.getByRole("switch")).not.toBeChecked()

    const rendered = await page.screenshot({ fullPage: false })
    await testInfo.attach("email-delivery-configured-off.png", {
      body: rendered,
      contentType: "image/png",
    })

    await page.getByLabel("Máy chủ SMTP").fill("draft.smtp.example.com")
    const testButton = page.getByRole("button", { name: "Gửi email thử" })
    await waitForClientHandler(testButton)
    await testButton.click()
    await expect(
      page.getByText("Đã gửi email thử đến tài khoản bạn đang đăng nhập.")
    ).toBeVisible()
    await expect(page.getByLabel("Máy chủ SMTP")).toHaveValue(
      "draft.smtp.example.com"
    )

    const afterTest = await fixture.state()
    expect(
      afterTest.requests.filter(
        (request) => request.path === "/smtp-configuration/test"
      )
    ).toHaveLength(1)
    expect(afterTest.smtpConfiguration?.host).toBe("smtp.example.com")

    await page.getByRole("button", { name: "Lưu cấu hình" }).click()
    await expect(page.getByText("Đã lưu cấu hình SMTP.")).toBeVisible()
    const afterSave = await fixture.state()
    expect(
      afterSave.requests.filter(
        (request) => request.path === "/smtp-configuration/test"
      )
    ).toHaveLength(1)
    expect(afterSave.smtpConfiguration?.host).toBe("draft.smtp.example.com")

    const deliverySwitch = page.getByRole("switch")
    await deliverySwitch.click()
    await expect(deliverySwitch).toBeChecked()
    await expect(page.getByText("Bật", { exact: true })).toBeVisible()
    const deleteButton = page.getByRole("button", { name: "Xóa cấu hình" })
    await expect(deleteButton).toBeDisabled()
    await expect(
      page.getByText("Tắt gửi email hệ thống trước khi xóa cấu hình.", {
        exact: true,
      })
    ).toBeVisible()
    await deliverySwitch.click()
    await expect(deliverySwitch).not.toBeChecked()
    await expect(page.getByText("Tắt", { exact: true })).toBeVisible()
    await expect(deleteButton).toBeEnabled()

    await page.getByRole("button", { name: "Xóa cấu hình" }).click()
    const confirmation = page.getByRole("alertdialog")
    await expect(confirmation).toBeVisible()
    await confirmation.getByRole("button", { name: "Xóa cấu hình" }).click()
    await expect(page.getByText("Đã xóa cấu hình SMTP.")).toBeVisible()
    await expect(page.getByText("Chưa cấu hình")).toBeVisible()
    await expect(page.getByLabel("Máy chủ SMTP")).toHaveValue("")

    const finalState = await fixture.state()
    expect(finalState.smtpConfiguration?.configured).toBe(false)
    expect(finalState.violations).toEqual([])
  })
})
