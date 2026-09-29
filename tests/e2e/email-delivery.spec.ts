import { expect, test, waitForClientHandler } from "./fixtures"

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
    await deliverySwitch.click()
    await expect(deliverySwitch).not.toBeChecked()
    await expect(page.getByText("Tắt", { exact: true })).toBeVisible()

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
