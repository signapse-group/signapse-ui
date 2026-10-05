import { expect, test } from "./fixtures"

test("entry redirects retain the negotiated locale", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveURL(/\/vi\/dashboard$/)

  const englishEntry = await page.request.get("/", {
    headers: { "Accept-Language": "en-US" },
    maxRedirects: 0,
  })
  expect(englishEntry.status()).toBe(307)
  expect(englishEntry.headers().location).toBe("/en")
  await page.goto(englishEntry.headers().location)
  await expect(page).toHaveURL(/\/en\/dashboard$/)

  await page.goto("/vi")
  await expect(page).toHaveURL(/\/vi\/dashboard$/)

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow"
  )
})

test("retired public and sample pages no longer exist", async ({ page }) => {
  for (const locale of ["vi", "en"]) {
    for (const path of [
      "articles",
      "articles/published-post",
      "editor",
      "dashboard-prototype",
    ]) {
      const response = await page.goto(`/${locale}/${path}`)
      expect(response?.status(), `/${locale}/${path}`).toBe(404)
    }
  }
})
