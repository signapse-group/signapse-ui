import AxeBuilder from "@axe-core/playwright"

import { expect, test } from "./fixtures"

test.describe("P0 feedback HTTP integration", () => {
  test.setTimeout(90_000)

  test("opens compose, validates content, and keeps a dirty draft", async ({
    page,
  }) => {
    await page.goto("/vi/feedback")
    await page.getByRole("button", { name: /Signapse Developer/i }).click()
    await page.getByRole("menuitem", { name: "Gửi phản hồi", exact: true }).click()

    const dialog = page.getByRole("dialog").first()
    await expect(dialog).toBeVisible()
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze()
    expect(axe.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([])

    await dialog.getByRole("button", { name: "Gửi phản hồi", exact: true }).click()
    await expect(dialog.getByText("Vui lòng nhập nội dung phản hồi.")).toBeVisible()
    await expect(dialog.locator("#feedback-content")).toBeFocused()

    await expect(dialog.locator("#feedback-type")).toHaveCount(0)
    await expect(dialog.locator("#feedback-title")).toHaveCount(0)
    await expect(dialog.locator("#feedback-description")).toHaveCount(0)
    await expect(dialog.locator("#feedback-expected-outcome")).toHaveCount(0)
    await expect(dialog.locator("#feedback-reproduction-steps")).toHaveCount(0)
    await dialog.locator("#feedback-content").fill("Ý tưởng đủ dài để kiểm tra biểu mẫu.")

    await dialog.locator("#feedback-screenshot").setInputFiles({
      name: "invalid.webp",
      mimeType: "image/webp",
      buffer: Buffer.from("fixture"),
    })
    await expect(dialog.getByText("Không thể xem trước tệp này")).toBeVisible()
    await dialog.getByRole("button", { name: "Đóng biểu mẫu phản hồi" }).click()
    const discardDialog = page.getByRole("dialog").filter({ hasText: "Bỏ bản nháp này?" })
    await expect(discardDialog).toBeVisible()
    await discardDialog.getByRole("button", { name: "Tiếp tục chỉnh sửa" }).click()
    await expect(dialog).toBeVisible()
    await dialog.getByRole("button", { name: "Đóng biểu mẫu phản hồi" }).click()
    await page.getByRole("dialog").filter({ hasText: "Bỏ bản nháp này?" }).getByRole("button", { name: "Bỏ bản nháp" }).click()
    await expect(dialog).toBeHidden()
  })

  test("submits through multipart HTTP and recovers a failed mutation", async ({
    page,
    fixture,
  }) => {
    await page.goto("/vi/feedback")
    await page.getByRole("button", { name: "Gửi phản hồi", exact: true }).last().click()
    const dialog = page.getByRole("dialog").first()
    await dialog.locator("#feedback-content").fill("Nội dung phản hồi mới đủ dài để kiểm tra multipart.")
    await fixture.setFeedbackScenario("mutation-failure", "compose")
    await dialog.getByRole("button", { name: "Gửi phản hồi", exact: true }).click()
    await expect(page.getByText("Không thể gửi phản hồi. Bản nháp vẫn được giữ lại.")).toBeVisible()
    await expect(dialog.locator("#feedback-content")).toHaveValue("Nội dung phản hồi mới đủ dài để kiểm tra multipart.")
    await fixture.setFeedbackScenario("success", "compose")
    await dialog.getByRole("button", { name: "Gửi phản hồi", exact: true }).click()
    await expect(page.getByText("Đã gửi phản hồi.")).toBeVisible()
    await expect(page.getByRole("link", { name: "Nội dung phản hồi mới đủ dài để kiểm tra multipart.", exact: true }).first()).toBeVisible()
  })

  test("loads personal detail and withdraws a pending submission", async ({ page }) => {
    await page.goto("/vi/feedback/1")
    await expect(page.locator("h1")).toHaveText("Chi tiết phản hồi")
    await expect(page.getByRole("complementary").getByText("Đã tiếp nhận", { exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Rút phản hồi", exact: true }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Rút phản hồi", exact: true }).click()
    await expect(page).toHaveURL(/\/vi\/feedback$/)
    await expect(page.getByRole("link", { name: /Biểu đồ không giữ bộ lọc/ })).toHaveCount(0)
  })

  test("distinguishes missing and load failures in feedback details", async ({ page, fixture }) => {
    await fixture.setFeedbackScenario("not-found")
    await page.goto("/vi/feedback/1")
    await expect(page.locator("h1")).toHaveText("Không tìm thấy phản hồi")
    await expect(page.getByText("Phản hồi có thể đã được rút hoặc xóa.")).toBeVisible()

    await fixture.setFeedbackScenario("server-failure")
    await page.goto("/vi/feedback-submissions/1")
    await expect(page.locator("h1")).toHaveText("Không thể tải phản hồi")
    await expect(page.getByText("Hãy thử lại để tải thông tin mới nhất của phản hồi.")).toBeVisible()
  })

  test("uses server permissions, content filters, and one review message", async ({
    page,
    fixture,
  }) => {
    await fixture.setPermissions([])
    await page.goto("/vi/feedback-submissions")
    await expect(page.getByText("Bạn không có quyền xem phản hồi người dùng.")).toBeVisible()

    await fixture.setPermissions(["feedback:read", "feedback:review", "feedback:delete"])
    await page.goto("/vi/feedback-submissions?status=PENDING_REVIEW&sort=createdDate_desc&page=1&size=10")
    await expect(page.locator("h1")).toHaveText("Phản hồi người dùng")
    await page.getByRole("searchbox", { name: "Tìm trong nội dung phản hồi" }).fill("Biểu đồ")
    await page.getByRole("button", { name: "Tìm trong nội dung phản hồi", exact: true }).click()
    await expect(page).toHaveURL(/search=Bi%E1%BB%83u(?:%20|\+)%C4%91%E1%BB%93/)
    await expect(page.getByRole("link", { name: /Biểu đồ không giữ bộ lọc/ })).toHaveAttribute(
      "href",
      /feedback-submissions\/1.*search=/
    )
    await page.goto(
      "/vi/feedback-submissions/1?status=PENDING_REVIEW&sort=createdDate_desc&page=1&size=10&search=Bi%E1%BB%83u+%C4%91%E1%BB%93"
    )

    await page.goto("/vi/feedback-submissions/1")
    await page.getByRole("button", { name: "Xem xét phản hồi", exact: true }).click()
    const reviewDialog = page.getByRole("dialog").filter({ hasText: "Xem xét phản hồi này?" })
    await reviewDialog.getByRole("button", { name: "Xác nhận xem xét", exact: true }).click()
    await expect(reviewDialog.getByText("Vui lòng nhập nội dung xem xét.")).toBeVisible()
    await reviewDialog.locator("textarea").fill("Đã xem xét phản hồi của bạn.")
    await fixture.setFeedbackScenario("server-failure", "review")
    await reviewDialog.getByRole("button", { name: "Xác nhận xem xét", exact: true }).click()
    await expect(reviewDialog.getByText("Không thể lưu kết quả xem xét. Hãy thử lại.")).toBeVisible()
    await fixture.setFeedbackScenario("success", "review")
    await reviewDialog.getByRole("button", { name: "Xác nhận xem xét", exact: true }).click()
    await expect(page.getByRole("complementary").getByText("Đã xem xét", { exact: true })).toBeVisible()
  })

  test("deletes any moderation status and isolates empty/error reads", async ({ page, fixture }) => {
    await page.goto("/vi/feedback-submissions/2")
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()
    expect(axe.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([])
    await page.getByRole("button", { name: "Xóa phản hồi", exact: true }).click()
    const dialog = page.getByRole("alertdialog")
    await fixture.setFeedbackScenario("mutation-failure", "erase")
    await dialog.getByRole("button", { name: "Xóa phản hồi", exact: true }).click()
    await expect(dialog.getByText("Không thể xóa phản hồi. Hãy thử lại.")).toBeVisible()
    await fixture.setFeedbackScenario("success", "erase")
    await dialog.getByRole("button", { name: "Xóa phản hồi", exact: true }).click()
    await expect(page).toHaveURL(/\/vi\/feedback-submissions$/)

    await fixture.setScenario("/me/feedback-submissions", "empty", "GET")
    await page.goto("/vi/feedback")
    await expect(page.getByText("Chưa có phản hồi")).toBeVisible()
    await fixture.setScenario("/me/feedback-submissions", "outage", "GET")
    await page.goto("/vi/feedback")
    await expect(page.getByText("Không thể tải phản hồi của bạn")).toBeVisible()
  })
})
