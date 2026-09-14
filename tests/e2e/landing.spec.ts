import AxeBuilder from "@axe-core/playwright"

import { expect, test } from "./fixtures"

const sectionOrder = [
  "hero-product-proof",
  "capability-strip",
  "product-story",
  "audiences",
  "analysis-flow",
  "showcase",
  "trust-boundary",
  "final-access-cta",
]

test.describe("P0 public landing", () => {
  for (const locale of ["vi", "en"] as const) {
    test(`${locale} renders the five-capability story and authenticated access paths`, async ({
      page,
    }) => {
      await page.goto(`/${locale}`)

      await expect(page.locator("h1")).toHaveCount(1)
      await expect(page.locator("[data-landing-section]")).toHaveCount(8)
      await expect(
        page
          .locator("[data-landing-section]")
          .evaluateAll((sections) =>
            sections.map((section) =>
              section.getAttribute("data-landing-section")
            )
          )
      ).resolves.toEqual(sectionOrder)

      await expect(page.locator("[data-product-card]")).toHaveCount(5)
      await expect(page.locator("[data-landing-media-slot]")).toHaveCount(2)
      await expect(page.locator("[data-landing-media-slot] img")).toHaveCount(2)
      await expect(
        page.locator("[data-landing-media-slot] button")
      ).toHaveCount(0)
      await expect(page.locator("[data-product-card] h3")).toHaveCount(5)
      await expect(
        page.locator("[data-product-card] h3").first()
      ).toContainText(
        locale === "vi"
          ? "Nắm trọn bức tranh thị trường."
          : "See the complete market picture."
      )

      await expect(page.locator("#how-it-works")).toContainText(
        locale === "vi" ? "Theo dõi thị trường" : "Monitor the market"
      )
      await expect(page.locator("#how-it-works")).toContainText(
        locale === "vi"
          ? "Gửi cảnh báo hoặc chạy bot"
          : "Send alerts or run a bot"
      )
      await expect(page.locator("#workspace-ai")).toHaveCount(0)
      await expect(page.locator("#product")).not.toContainText("Market Query")

      await expect(page.locator("[data-feature-links]")).toHaveCount(0)
      const heroDecoration = page.locator(
        '[data-landing-decoration="ohlcv-depth-field"]'
      )
      await expect(heroDecoration).toHaveCount(1)
      await expect(heroDecoration).toHaveAttribute("aria-hidden", "true")
      await expect(
        heroDecoration.locator("a, button, input, select, textarea, [tabindex]")
      ).toHaveCount(0)
      await expect(
        page.locator('[data-landing-section="hero-product-proof"]')
      ).toContainText(
        locale === "vi" ? "Trợ lý AI chuyên biệt" : "Specialized AI Assistant"
      )
      await expect(
        page.locator('[data-landing-section="hero-product-proof"]')
      ).toContainText(
        locale === "vi"
          ? "Đọc bối cảnh, không chỉ nhìn nến"
          : "Read the context, not just the candles"
      )

      const dashboardLabel =
        locale === "vi"
          ? "Mở bảng điều khiển Signapse"
          : "Open the Signapse dashboard"
      await expect(
        page.getByRole("link", { name: dashboardLabel }).first()
      ).toHaveAttribute("href", `/${locale}/dashboard`)
      await expect(
        page
          .locator('[data-landing-section="hero-product-proof"]')
          .locator('a[href="#product"]')
      ).toBeVisible()
      await expect(page.getByText("request-access@signapse.ai")).toBeVisible()
      await expect(page.locator('a[href^="mailto:"]').first()).toHaveAttribute(
        "href",
        "mailto:request-access@signapse.ai?subject=Signapse%20access%20request"
      )

      const figure = page.locator('[data-landing-visual="context-figure"]')
      await expect(figure.locator("figcaption")).toHaveClass(/sr-only/)
      await expect(figure.locator("[data-context-stage] button")).toHaveCount(0)
      await expect(
        page.locator('[data-landing-section="hero-product-proof"]')
      ).toContainText(
        locale === "vi"
          ? "Hiểu nhanh hơn. Hành động chủ động hơn."
          : "Understand faster. Act proactively."
      )
    })
  }

  test("switches locale while preserving query and supported feature hash", async ({
    page,
  }) => {
    await page.goto("/vi?source=hero#knowledge-graph")
    await page
      .getByRole("link", { name: "English", exact: true })
      .first()
      .click()
    await expect(page).toHaveURL(/\/en\?source=hero#knowledge-graph$/)
    await expect(page.locator("html")).toHaveAttribute("lang", "en")

    await page.goto("/en?source=footer#workspace-ai")
    await page
      .getByRole("link", { name: "Tiếng Việt", exact: true })
      .first()
      .click()
    await expect(page).toHaveURL(/\/vi\?source=footer$/)
  })

  test("keeps a fixed landing palette across global themes", async ({
    page,
  }) => {
    const palettes = []

    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme })
      await page.goto("/en")
      palettes.push(
        await page
          .locator('[data-landing-theme="fixed-signapse"]')
          .evaluate((root) => {
            const read = (selector: string, property: string) => {
              const element = root.querySelector(selector)
              if (!(element instanceof HTMLElement)) {
                throw new Error(`Missing landing surface: ${selector}`)
              }
              return getComputedStyle(element).getPropertyValue(property).trim()
            }

            return {
              navy: getComputedStyle(root)
                .getPropertyValue("--landing-navy")
                .trim(),
              mint: getComputedStyle(root)
                .getPropertyValue("--landing-mint")
                .trim(),
              darkBackground: read(
                '[data-landing-surface="dark"]',
                "--background"
              ),
              darkForeground: read(
                '[data-landing-surface="dark"]',
                "--foreground"
              ),
              lightBackground: read(
                '[data-landing-surface="light"]',
                "--background"
              ),
              lightForeground: read(
                '[data-landing-surface="light"]',
                "--foreground"
              ),
              figureBackground: read(
                '[data-context-stage="interactive"]',
                "--background"
              ),
            }
          })
      )
    }

    expect(palettes[0]).toEqual(palettes[1])
    expect(palettes[0]).toMatchObject({
      navy: "#03141d",
      mint: "#12d6b1",
      darkBackground: "#03141d",
      lightBackground: "#eafdf8",
      figureBackground: "#03141d",
    })
    await expect(
      page.locator(
        '[data-landing-part="header"] img[src*="signapse_logo_dark.svg"]'
      )
    ).toBeVisible()
  })

  test("preserves the dashboard theme preference after viewing landing", async ({
    page,
  }) => {
    await page.goto("/en")
    await page.evaluate(() => localStorage.setItem("theme", "dark"))
    await page.reload()

    await expect(page.locator("html")).toHaveClass(/dark/)
    await expect(
      page.locator('[data-landing-theme="fixed-signapse"]')
    ).toBeVisible()
    await expect(
      page.evaluate(() => localStorage.getItem("theme"))
    ).resolves.toBe("dark")
  })

  test("uses a dark liquid-glass header after scrolling", async ({ page }) => {
    await page.goto("/vi")
    await page.evaluate(() => window.scrollTo(0, 720))

    const header = page.locator('[data-landing-part="header"]')
    await expect(header).toHaveAttribute("data-scrolled", "true")
    await expect
      .poll(() =>
        header.evaluate((element) => getComputedStyle(element).backgroundColor)
      )
      .toMatch(/\/ 0\.28\)/)

    const glassStyle = await header.evaluate((element) => {
      const computed = getComputedStyle(element)

      return {
        backdropFilter: computed.backdropFilter,
        backgroundImage: computed.backgroundImage,
        boxShadow: computed.boxShadow,
      }
    })

    expect(glassStyle.backdropFilter).toContain("blur(16px)")
    expect(glassStyle.backdropFilter).toContain("saturate(")
    expect(glassStyle.backgroundImage).toBe("none")
    expect(glassStyle.boxShadow).toContain("inset")
  })

  test("keeps approved product captures native inside landing frames", async ({
    page,
  }) => {
    await page.goto("/en")

    const images = page.locator("[data-landing-media-slot] img")
    await expect(images).toHaveCount(2)
    const imageStyles = await images.evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element)
        return {
          src: element.getAttribute("src"),
          filter: style.filter,
          mixBlendMode: style.mixBlendMode,
          opacity: style.opacity,
        }
      })
    )

    expect(imageStyles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: expect.stringContaining("knowledge-graph.webp"),
          filter: "none",
          mixBlendMode: "normal",
          opacity: "1",
        }),
        expect.objectContaining({
          src: expect.stringContaining("live-market-chart.webp"),
          filter: "none",
          mixBlendMode: "normal",
          opacity: "1",
        }),
      ])
    )
  })

  test("reflows the five capability cards without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/en")

    const desktopCards = page.locator("[data-product-card]")
    const desktopBoxes = await desktopCards.evaluateAll((cards) =>
      cards.map((card) => {
        const rect = card.getBoundingClientRect()
        return { height: rect.height, width: rect.width, x: rect.x, y: rect.y }
      })
    )
    expect(desktopBoxes).toHaveLength(5)
    expect(new Set(desktopBoxes.map((box) => Math.round(box.y))).size).toBe(1)
    expect(
      new Set(desktopBoxes.map((box) => Math.round(box.height))).size
    ).toBe(1)
    expect(desktopBoxes.every((box) => box.width > 0)).toBe(true)

    await page.setViewportSize({ width: 375, height: 900 })
    const mobileBoxes = await page
      .locator("[data-product-card]")
      .evaluateAll((cards) =>
        cards.map((card) => {
          const rect = card.getBoundingClientRect()
          return {
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right,
            y: rect.y,
          }
        })
      )
    expect(mobileBoxes).toHaveLength(5)
    expect(
      mobileBoxes.every(
        (box, index) => index === 0 || box.y > mobileBoxes[index - 1].y
      )
    ).toBe(true)
    expect(mobileBoxes.every((box) => box.left >= 0 && box.right <= 375)).toBe(
      true
    )
  })

  test("keeps the native mobile disclosure keyboard-operable", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto("/vi")

    await expect(
      page.getByRole("link", { name: "Signapse", exact: true }).first()
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Mở bảng điều khiển Signapse" }).first()
    ).toBeVisible()

    const summary = page.locator("[data-mobile-menu] summary")
    await summary.focus()
    await expect(summary).toBeFocused()
    await summary.press("Enter")
    await expect(page.locator("[data-mobile-menu]")).toHaveAttribute("open", "")
    await expect(
      page.getByRole("link", { name: "Tổng quan", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: "English", exact: true }).last()
    ).toBeVisible()
    const box = await summary.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(44)
    expect(box?.height).toBeGreaterThanOrEqual(44)
  })

  test("has no serious landing axe violations or page overflow at target widths", async ({
    page,
  }) => {
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto("/en")
      await page.emulateMedia({
        reducedMotion: "reduce",
        colorScheme: width % 2 ? "light" : "dark",
      })
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
          )
        )
        .toBe(true)
    }

    await page.setViewportSize({ width: 375, height: 900 })
    await page.goto("/en")
    await page.evaluate(() => {
      document.documentElement.style.zoom = "2"
    })
    await expect(page.locator("h1")).toBeVisible()
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth * 2
        )
      )
      .toBe(true)

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze()
    expect(
      results.violations.filter(
        (violation) =>
          violation.impact === "serious" || violation.impact === "critical"
      )
    ).toEqual([])
  })

  for (const locale of ["vi", "en"] as const) {
    test(`${locale} exposes the figure interaction contract without application semantics`, async ({
      page,
    }) => {
      await page.goto(`/${locale}`)

      const stage = page.locator('[data-context-stage="interactive"]')
      await expect(stage).toHaveAttribute("data-context-mode", "graph")
      await expect(stage).not.toHaveAttribute("role", "application")
      await expect(page.locator("[data-context-status]")).toHaveAttribute(
        "aria-live",
        "polite"
      )
      await expect
        .poll(() => stage.getAttribute("data-renderer-state"), {
          timeout: 8000,
        })
        .not.toBe("loading")

      if ((await stage.getAttribute("data-enhanced")) === "true") {
        await expect(stage).toHaveAttribute("role", "group")
        const box = await stage.boundingBox()
        expect(box).not.toBeNull()
        if (!box) return
        await page.mouse.move(Math.max(0, box.x - 8), Math.max(0, box.y - 8))
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await expect(stage).toHaveAttribute("data-context-mode", "price")
        await page.mouse.move(Math.max(0, box.x - 8), Math.max(0, box.y - 8))
        await expect(stage).toHaveAttribute("data-context-mode", "graph")
        await stage.focus()
        await expect(stage).toBeFocused()
        await stage.press("Enter")
        await expect(stage).toHaveAttribute("data-context-mode", "price")
      } else {
        await expect(page.locator("[data-figure-fallback]")).toHaveCount(0)
        await expect(page.locator("[data-context-status]")).toContainText(
          locale === "vi"
            ? "Hình tương tác hiện không khả dụng"
            : "The interactive figure is unavailable"
        )
      }
    })
  }

  test("coarse pointers do not get a hidden tap-to-switch mode", async ({
    browser,
  }) => {
    const context = await browser.newContext({
      hasTouch: true,
      viewport: { width: 375, height: 800 },
    })
    const coarsePage = await context.newPage()

    try {
      await coarsePage.goto("http://127.0.0.1:3100/en")
      const stage = coarsePage.locator('[data-context-stage="interactive"]')
      await expect
        .poll(() => stage.getAttribute("data-renderer-state"), {
          timeout: 8000,
        })
        .not.toBe("loading")
      await coarsePage.waitForTimeout(1000)
      await expect(stage).toHaveAttribute("data-context-mode", "graph")
      await stage.tap()
      await expect(stage).toHaveAttribute("data-context-mode", "graph")
    } finally {
      await context.close()
    }
  })

  for (const locale of ["vi", "en"] as const) {
    test(`${locale} renders preview metadata and localized social image references`, async ({
      page,
    }) => {
      await page.goto(`/${locale}`)

      await expect(page).toHaveTitle("Signapse | Market Intelligence Platform")
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        "content",
        locale === "vi"
          ? "Signapse kết nối giá, sự kiện, phản ứng và nguồn tin liên quan để hỗ trợ phân tích thị trường bằng AI với bối cảnh có thể kiểm tra."
          : "Signapse connects price, events, market reactions, and related sources to support AI-assisted market analysis with context you can verify."
      )
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/
      )
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        `https://dev.signapse.cloud/${locale}`
      )
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        "content",
        `https://dev.signapse.cloud/${locale}/opengraph-image`
      )
    })
  }
})
