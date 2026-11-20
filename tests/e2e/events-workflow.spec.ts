import type { Page } from "@playwright/test"

import { expect, test, waitForClientHandler } from "./fixtures"

import { en as enDictionary } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"

const searchFilter =
  "title[containsIgnoreCase],description[containsIgnoreCase],canonicalKey[containsIgnoreCase]"

async function navigateToEventWithClientRouter(page: Page, id: number) {
  await page.evaluate((eventId) => {
    // Next exposes this router on window.next in development for debugging.
    const router = (
      window as Window & {
        next?: { router?: { push: (href: string) => void } }
      }
    ).next?.router

    if (!router) {
      throw new Error("The Next.js App Router debug interface is unavailable")
    }

    router.push(`/vi/events/${eventId}`)
  }, id)
}

test.describe("Events workflow", () => {
  test("keeps search and sort results with URL state when changing from later pages", async ({
    page,
    fixture,
  }, testInfo) => {
    await page.setViewportSize({ width: 1520, height: 1024 })

    const params = new URLSearchParams({
      page: "1",
      size: "10",
      sort: "occurredAt_desc",
    })
    params.set(searchFilter, "Fixture")
    await page.goto(`/vi/events?${params.toString()}`)

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: viDictionary.navigation.events,
        exact: true,
      })
    ).toHaveCount(1)
    const search = page.getByRole("searchbox", {
      name: viDictionary.events.searchLabel,
    })
    const nextPage = page.getByRole("button", {
      name: viDictionary.pagination.goToNext,
    })
    await expect(search).toHaveValue("Fixture")
    await testInfo.attach("events-list-wide-1520.png", {
      body: await page.screenshot({
        fullPage: true,
        style: "nextjs-portal { display: none !important; }",
      }),
      contentType: "image/png",
    })
    await waitForClientHandler(nextPage)
    await nextPage.click({ timeout: 10_000 })
    await expect(page).toHaveURL(/page=2/)

    await waitForClientHandler(search, "onChange")
    await search.fill("Macro")
    await expect
      .poll(() => {
        const query = new URLSearchParams(new URL(page.url()).search)
        return {
          page: query.get("page"),
          search: query.get(searchFilter),
          sort: query.get("sort"),
        }
      })
      .toEqual({ page: "1", search: "Macro", sort: "occurredAt_desc" })
    await expect(
      page.getByRole("link", {
        name: "Macro liquidity conditions stabilize",
        exact: true,
      })
    ).toBeVisible()
    await expect(
      page.getByRole("link", {
        name: "Central bank signals a slower easing path",
        exact: true,
      })
    ).toHaveCount(0)

    await search.fill("Fixture")
    await expect
      .poll(() => {
        const query = new URLSearchParams(new URL(page.url()).search)
        return {
          page: query.get("page"),
          search: query.get(searchFilter),
        }
      })
      .toEqual({ page: "1", search: "Fixture" })
    await waitForClientHandler(nextPage)
    await expect(nextPage).toBeEnabled()
    await nextPage.focus()
    await nextPage.press("Enter")
    await expect(page).toHaveURL(/page=2/)

    const sort = page.getByRole("combobox", {
      name: viDictionary.lists.sortLabel,
    })
    await waitForClientHandler(sort)
    await sort.click()
    await page
      .getByRole("option", { name: viDictionary.events.confidenceHigh })
      .click()
    await expect
      .poll(() => {
        const query = new URLSearchParams(new URL(page.url()).search)
        return {
          page: query.get("page"),
          search: query.get(searchFilter),
          sort: query.get("sort"),
        }
      })
      .toEqual({ page: "1", search: "Fixture", sort: "confidence_desc" })
    await expect(
      page.getByRole("link", {
        name: "Central bank signals a slower easing path",
        exact: true,
      })
    ).toBeVisible()

    await waitForClientHandler(nextPage)
    await expect(nextPage).toBeEnabled()
    await nextPage.focus()
    await nextPage.press("Enter")
    await expect(page).toHaveURL(/page=2/)
    await expect(
      page.getByRole("link", {
        name: "Central bank signals a slower easing path",
        exact: true,
      })
    ).toHaveCount(0)

    const eventRequests = (await fixture.state()).requests.filter(
      (request) => request.method === "GET" && request.path === "/events"
    )
    const lastRequest = eventRequests.at(-1)
    const apiQuery = new URLSearchParams(String(lastRequest?.query ?? ""))
    expect(lastRequest?.locale).toBe("vi")
    expect(apiQuery.get("page")).toBe("1")
    expect(apiQuery.get("sort")).toBe("confidence,desc")
    expect(apiQuery.get("$filter")).toContain("Fixture")
    expect(apiQuery.get("$filter")).not.toContain("workspace")
  })

  test("renders an untitled partial Event and gates Article and source actions independently", async ({
    page,
    fixture,
  }, testInfo) => {
    await fixture.setScenario("/events", "event-partial", "GET")
    await fixture.setPermissions(["event:read"])
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/vi/events?page=1&size=20")

    const untitled = page.getByRole("link", {
      name: "Chưa có tiêu đề",
      exact: true,
    })
    const untitledCard = page
      .getByRole("list", { name: viDictionary.events.eventColumn })
      .getByRole("listitem")
      .filter({ hasText: "Chưa có tiêu đề" })
    await expect(untitled).toHaveAttribute("href", "/vi/events/62")
    await expect(
      untitledCard.getByText(viDictionary.events.timeColumn, { exact: true })
    ).toBeVisible()
    await expect(
      untitledCard.getByText(viDictionary.events.confidenceColumn, {
        exact: true,
      })
    ).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(390)
    await testInfo.attach("events-list-mobile-390.png", {
      body: await page.screenshot({
        fullPage: true,
        style: "nextjs-portal { display: none !important; }",
      }),
      contentType: "image/png",
    })
    const mobileEvents = page.getByRole("list", {
      name: viDictionary.events.eventColumn,
    })
    await page.setViewportSize({ width: 360, height: 800 })
    await expect(mobileEvents).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(360)
    await page.setViewportSize({ width: 767, height: 800 })
    await expect(mobileEvents).toBeVisible()
    await expect(page.getByRole("table")).toBeHidden()
    await page.setViewportSize({ width: 768, height: 800 })
    await expect(mobileEvents).toBeHidden()
    await expect(page.getByRole("table")).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(768)
    await page.setViewportSize({ width: 760, height: 512 })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(760)
    await page.setViewportSize({ width: 390, height: 844 })

    await waitForClientHandler(untitled)
    await untitled.click()
    await expect(page).toHaveURL(/\/vi\/events\/62$/)
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Chưa có tiêu đề",
        exact: true,
      })
    ).toBeVisible()
    await expect(
      page.getByText(viDictionary.events.detailNoDescription, { exact: true })
    ).toBeVisible()
    await expect(
      page.getByText(viDictionary.events.technicalInfo, { exact: true })
    ).toHaveCount(0)
    const sourceLink = page.getByRole("link", {
      name: viDictionary.events.openOriginalLink,
      exact: true,
    })
    await expect(sourceLink).toHaveAttribute(
      "href",
      "https://fixture.invalid/news/62"
    )
    await expect(
      page.getByRole("link", {
        name: viDictionary.events.viewArticle,
        exact: true,
      })
    ).toHaveCount(0)
    await sourceLink.focus()
    await expect(sourceLink).toBeFocused()
    await testInfo.attach("event-detail-mobile-event-read-only.png", {
      body: await page.screenshot({
        fullPage: true,
        style: "nextjs-portal { display: none !important; }",
      }),
      contentType: "image/png",
    })
    await page.setViewportSize({ width: 360, height: 800 })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(360)
    await expect(sourceLink).toBeVisible()
    await page.setViewportSize({ width: 760, height: 512 })
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(760)
    await expect(sourceLink).toBeVisible()
    await page.setViewportSize({ width: 390, height: 844 })

    const eventRequest = (await fixture.state()).requests.find(
      (request) => request.method === "GET" && request.path === "/events/62"
    )
    expect(eventRequest?.locale).toBe("vi")

    await fixture.setPermissions(["event:read", "news-article:read"])
    await page.goto("/vi/events/62")
    await expect(
      page.getByRole("link", {
        name: viDictionary.events.viewArticle,
        exact: true,
      })
    ).toHaveAttribute("href", "/vi/news-articles/71")
    await page.setViewportSize({ width: 1520, height: 1024 })
    await page.goto("/vi/events/62")
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Chưa có tiêu đề",
        exact: true,
      })
    ).toBeVisible()
    await testInfo.attach("event-detail-wide-article-read-1520.png", {
      body: await page.screenshot({
        fullPage: true,
        style: "nextjs-portal { display: none !important; }",
      }),
      contentType: "image/png",
    })
    await expect(
      page.getByRole("link", {
        name: viDictionary.events.openOriginalLink,
        exact: true,
      })
    ).toBeVisible()

    await fixture.setScenario("/events", "event-partial-no-source", "GET")
    await page.goto("/vi/events/62")
    await expect(
      page.getByRole("link", {
        name: viDictionary.events.viewArticle,
        exact: true,
      })
    ).toHaveAttribute("href", "/vi/news-articles/71")
    await expect(
      page.getByRole("link", {
        name: viDictionary.events.openOriginalLink,
        exact: true,
      })
    ).toHaveCount(0)
  })

  test("does not show a previous Event during a delayed in-app detail navigation", async ({
    page,
    fixture,
  }) => {
    await fixture.setPermissions(["event:read"])
    await fixture.setScenario("/events/62", "delayed", "GET")
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto("/vi/events/61")

    const firstEventHeading = page.getByRole("heading", {
      level: 1,
      name: "Central bank signals a slower easing path",
      exact: true,
    })
    await expect(firstEventHeading).toBeVisible()
    await navigateToEventWithClientRouter(page, 62)
    await expect(page).toHaveURL(/\/vi\/events\/62$/)
    await expect
      .poll(async () => (await fixture.state()).pendingRequests)
      .toBeGreaterThan(0)
    await expect(firstEventHeading).toHaveCount(0)

    await fixture.setScenario("/events", "event-detail-denied", "GET")
    await fixture.setScenario("/events/62", "success", "GET")

    await expect(
      page.getByRole("alert").filter({
        hasText: viDictionary.events.detailDenied,
      })
    ).toContainText(viDictionary.events.detailDenied)
    await expect(firstEventHeading).toHaveCount(0)
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Energy demand outlook revised higher",
        exact: true,
      })
    ).toHaveCount(0)

    await fixture.setScenario("/events/999", "delayed", "GET")
    await navigateToEventWithClientRouter(page, 999)
    await expect(page).toHaveURL(/\/vi\/events\/999$/)
    await expect
      .poll(async () => (await fixture.state()).pendingRequests)
      .toBeGreaterThan(0)
    await expect(firstEventHeading).toHaveCount(0)

    await fixture.setScenario("/events/999", "success", "GET")
    await expect(page.getByRole("status")).toContainText(
      viDictionary.events.eventUnavailableTitle
    )
    await expect(firstEventHeading).toHaveCount(0)
  })

  test("separates no-results, permission, unavailable, and load-error states", async ({
    page,
    fixture,
  }) => {
    const params = new URLSearchParams({ page: "1", size: "10" })
    params.set(searchFilter, "no-matching-event")
    await page.goto(`/vi/events?${params.toString()}`)
    await expect(
      page.getByRole("status").getByText("Không tìm thấy sự kiện", {
        exact: true,
      })
    ).toBeVisible()
    await fixture.setScenario("/events", "event-list-error", "GET")
    await page.goto("/vi/events")
    await expect(
      page.getByRole("alert").filter({
        hasText: viDictionary.events.errorTitle,
      })
    ).toContainText(viDictionary.events.errorTitle)
    await expect(
      page.getByRole("alert").filter({
        hasText: viDictionary.events.errorTitle,
      })
    ).not.toContainText(viDictionary.events.searchEmptyTitle)

    await fixture.setScenario("/events", "success", "GET")
    await fixture.setPermissions([])
    await page.goto("/vi/events")
    await expect(
      page.getByRole("alert").filter({
        hasText: viDictionary.events.readDenied,
      })
    ).toContainText(viDictionary.events.readDenied)

    await fixture.setPermissions(["event:read"])
    await page.goto("/vi/events/61")
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Central bank signals a slower easing path",
        exact: true,
      })
    ).toBeVisible()

    await page.goto("/vi/events/999")
    await expect(page.getByRole("status")).toContainText(
      viDictionary.events.eventUnavailableTitle
    )
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Central bank signals a slower easing path",
        exact: true,
      })
    ).toHaveCount(0)

    await fixture.setScenario("/events", "event-detail-denied", "GET")
    await page.goto("/vi/events/61")
    await expect(
      page.getByRole("alert").filter({
        hasText: viDictionary.events.detailDenied,
      })
    ).toContainText(viDictionary.events.detailDenied)
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Central bank signals a slower easing path",
        exact: true,
      })
    ).toHaveCount(0)

    await fixture.setScenario("/events", "event-detail-error", "GET")
    await page.goto("/en/events/61")
    await expect(
      page.getByRole("alert").filter({
        hasText: enDictionary.events.errorDescription,
      })
    ).toContainText(enDictionary.events.errorDescription)
    await expect(
      page.getByRole("alert").filter({
        hasText: enDictionary.events.errorDescription,
      })
    ).not.toContainText("Event data unavailable")
  })
})
