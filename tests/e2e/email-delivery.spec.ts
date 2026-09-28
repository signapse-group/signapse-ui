import { expect, test, waitForClientHandler } from "./fixtures"

test.describe("P0 email delivery HTTP integration", () => {
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
