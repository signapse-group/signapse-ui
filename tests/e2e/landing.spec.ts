import AxeBuilder from "@axe-core/playwright"

import { expect, test, waitForClientHandler } from "./fixtures"

const sectionOrder = [
  "hero-product-proof",
  "capability-strip",
  "showcase",
  "audiences",
  "ai-providers",
  "final-access-cta",
]

test.describe("P0 public landing", () => {
  for (const locale of ["vi", "en"] as const) {
    test(`${locale} renders the five-capability story and authenticated access paths`, async ({
      page,
    }) => {
      await page.goto(`/${locale}`)

      await expect(page.locator("h1")).toHaveCount(1)
      await expect(page.locator("[data-landing-section]")).toHaveCount(6)
      await expect(
        page
          .locator("[data-landing-section]")
          .evaluateAll((sections) =>
            sections.map((section) =>
              section.getAttribute("data-landing-section")
            )
          )
      ).resolves.toEqual(sectionOrder)

      await expect(page.locator("[data-product-card]")).toHaveCount(0)
      await expect(page.locator("[data-capability-trigger]")).toHaveCount(5)
      await expect(page.locator("[data-landing-media-slot]")).toHaveCount(0)
      await expect(page.locator("#how-it-works")).toHaveCount(0)
      await expect(page.locator("#workspace-ai")).toHaveCount(0)
      await expect(page.locator("#product")).toHaveCount(0)

      const providerSection = page.locator(
        '[data-landing-section="ai-providers"]'
      )
      await expect(providerSection.locator("[data-provider-item]")).toHaveCount(
        6
      )
      await expect(providerSection.locator("[data-provider-logo]")).toHaveCount(
        12
      )
      await expect(providerSection).toContainText("Anthropic")

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
      ).not.toContainText(
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
          .getByRole("link", {
            name: locale === "vi" ? "Liên Hệ với Signapse" : "Contact Signapse",
            exact: true,
          })
      ).toBeVisible()
      const heroLinks = page
        .locator('[data-landing-section="hero-product-proof"]')
        .getByRole("link")
      await expect(heroLinks).toHaveCount(1)
      await expect(heroLinks).toHaveAttribute("href", "#access")
      await expect(page.getByText("access@signapse.cloud")).toBeVisible()
      await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0)

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
    await page.locator("[data-locale-menu-trigger]").click()
    await page.getByRole("link", { name: "English", exact: true }).click()
    await expect(page).toHaveURL(/\/en\?source=hero#knowledge-graph$/)
    await expect(page.locator("html")).toHaveAttribute("lang", "en")

    await page.goto("/en?source=footer#workspace-ai")
    await page.locator("[data-locale-menu-trigger]").click()
    await page.getByRole("link", { name: "Tiếng Việt", exact: true }).click()
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
      lightBackground: "#fff",
      figureBackground: "#03141d",
    })
    await expect(
      page.locator(
        '[data-landing-part="header"] img[src*="signapse_logo_dark.svg"]:visible'
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
    expect(glassStyle.boxShadow).toBe("none")
  })

  test("renders every landing demo from code without requesting product screenshots", async ({
    page,
  }) => {
    const screenshots: string[] = []
    page.on("request", (request) => {
      if (
        /images(?:%2F|\/)landing|knowledge-graph\.webp|live-market-chart\.webp/.test(
          request.url()
        )
      )
        screenshots.push(request.url())
    })
    for (const locale of ["vi", "en"] as const) {
      const response = await page.request.get(`/${locale}`)
      const html = await response.text()
      expect(html).not.toContain("/images/landing/")
      expect(html).toContain("data-graph-demo-state")
      expect(html).toContain("data-market-demo-state")
      await page.goto(`/${locale}`)
      for (const feature of [
        "knowledge-graph",
        "market-chart",
        "ai-conversation",
        "scheduled-telegram",
      ]) {
        await page.locator(`[data-feature-selector="${feature}"]`).click()
        await expect(
          page.locator(`[data-feature-stage="${feature}"]`)
        ).toBeVisible()
      }
    }
    expect(screenshots).toEqual([])
  })

  test("plays the Telegram showcase automatically and restarts after returning", async ({
    page,
  }) => {
    await page.goto("/en")
    const showcase = page.locator('[data-landing-section="showcase"]')
    await showcase.scrollIntoViewIfNeeded()
    await expect(showcase.locator("[data-feature-selector]")).toHaveCount(4)

    const telegramTab = showcase.getByRole("button", {
      name: /Scheduled Telegram/,
    })
    await telegramTab.click()
    const telegramDemo = showcase.locator("[data-telegram-demo-playback]")
    await expect(telegramDemo).toBeVisible({ timeout: 8000 })
    await expect(telegramDemo).toHaveAttribute("data-demo-mode", "automatic")
    await expect(telegramDemo.locator("[inert]")).toHaveCount(1)
    await expect(telegramDemo.getByRole("button")).toHaveCount(0)
    await expect(telegramDemo.getByRole("combobox")).toHaveCount(0)
    await expect(telegramTab.locator("svg")).toBeVisible()
    await expect(telegramDemo).toHaveAttribute(
      "data-telegram-demo-playback",
      "autoplay"
    )
    const input = telegramDemo.locator('[data-slot="input"]').first()
    await expect(input).toBeVisible()
    await expect(input).toHaveCSS("height", "28px")
    await expect(input).toHaveCSS("font-size", "12px")
    const select = telegramDemo.locator('[data-slot="select-trigger"]').first()
    await expect(select).toHaveCSS("height", "28px")
    await expect(select).toHaveCSS("font-size", "12px")
    await expect(telegramDemo).toHaveAttribute(
      "data-telegram-demo-state",
      "assetSelected"
    )
    const cursorHitsOption = await telegramDemo.evaluate((demo) => {
      const cursor = demo
        .querySelector("[data-telegram-demo-cursor]")!
        .getBoundingClientRect()
      const option = demo
        .querySelector('[data-cursor-target="asset-option"]')!
        .getBoundingClientRect()
      return (
        cursor.x >= option.left &&
        cursor.x <= option.right &&
        cursor.y >= option.top &&
        cursor.y <= option.bottom
      )
    })
    expect(cursorHitsOption).toBe(true)
    await expect(telegramDemo).toHaveAttribute(
      "data-telegram-demo-state",
      "delivered",
      { timeout: 20_000 }
    )

    await showcase
      .getByRole("button", { name: "Knowledge Graph", exact: true })
      .click()
    await expect(telegramDemo).toHaveAttribute(
      "data-telegram-demo-playback",
      "paused"
    )
    await expect(
      showcase.locator('[data-feature-stage][data-active="true"]')
    ).toHaveAttribute("data-feature-stage", "knowledge-graph")
    await telegramTab.click()
    await expect(telegramDemo).toHaveAttribute(
      "data-telegram-demo-state",
      "start"
    )
    await expect(telegramDemo).toHaveAttribute(
      "data-telegram-demo-playback",
      "autoplay"
    )
    await expect(telegramDemo).toHaveAttribute(
      "data-telegram-demo-state",
      "assetOpen",
      { timeout: 5_000 }
    )
    await telegramTab.press("ArrowUp")
    await expect(
      showcase.getByRole("button", { name: "AI Conversation", exact: true })
    ).toHaveAttribute("aria-current", "step")
    await showcase
      .getByRole("button", { name: "AI Conversation", exact: true })
      .press("End")
    await expect(telegramTab).toHaveAttribute("aria-current", "step")

    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(telegramDemo).toHaveAttribute(
      "data-telegram-demo-playback",
      "paused"
    )
    const pausedPhase = await telegramDemo.getAttribute(
      "data-telegram-demo-state"
    )
    await page.waitForTimeout(400)
    await expect(telegramDemo).toHaveAttribute(
      "data-telegram-demo-state",
      pausedPhase!
    )
    await telegramTab.scrollIntoViewIfNeeded()
    await expect(telegramDemo).toHaveAttribute(
      "data-telegram-demo-state",
      "start"
    )
    await expect(showcase).not.toContainText(/delivered|read receipt/i)
  })

  test("changes the showcase demo while scrolling through its four steps", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/en")
    const showcase = page.locator('[data-landing-section="showcase"]')
    await expect(showcase.locator("[data-feature-showcase]")).toHaveAttribute(
      "data-scroll-enhanced",
      "true"
    )
    const stage = showcase.locator('[data-feature-stage][data-active="true"]')
    const steps = [
      [
        "knowledge-graph",
        "Knowledge Graph",
        "Follow the relationships across the market.",
        "Explore how events, assets, and news connect",
      ],
      [
        "market-chart",
        "Market Chart",
        "Put price action in context.",
        "Follow prices alongside event markers",
      ],
      [
        "ai-conversation",
        "AI Conversation",
        "Ask questions with Knowledge Graph context.",
        "Analyze relationships between events, assets, and news",
      ],
      [
        "scheduled-telegram",
        "Scheduled Telegram",
        "From scheduled analysis to your Telegram destination.",
        "Watch an asset, local send time, and output language",
      ],
    ] as const

    for (const [feature, label, title, body] of [
      ...steps,
      ...[...steps].reverse(),
    ]) {
      const step = showcase.locator(`[data-story-copy="${feature}"]`)
      await step.evaluate((element) =>
        element.scrollIntoView({ block: "center", behavior: "instant" })
      )
      await expect(
        showcase.getByRole("button", { name: label, exact: true })
      ).toHaveAttribute("aria-current", "step")
      await expect(step).toContainText(title)
      await expect(step).toContainText(body)
      await expect(stage).toHaveAttribute("data-feature-stage", feature)
      const box = await stage.boundingBox()
      expect(box!.y).toBeGreaterThanOrEqual(72)
      expect(box!.y + box!.height).toBeLessThanOrEqual(900)
      await expect(stage).toHaveCSS("position", "sticky")
      await expect(
        showcase.locator(`[data-demo-progress="${feature}"]`)
      ).toBeVisible()
    }
    await page.screenshot({
      path: "test-results/hero-preview/story-desktop.png",
    })
  })

  test("starts Graph playback at the first frame after its code preview", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/vi")
    await page.locator('[data-feature-selector="market-chart"]').click()
    await page.locator('[data-feature-selector="knowledge-graph"]').click()
    const graph = page.locator("[data-graph-demo-state]")
    await expect(graph).toHaveAttribute("data-graph-demo-state", "start")
    await expect(graph).toHaveAttribute("data-demo-renderer", "motion")
    await expect(graph).toHaveAttribute("data-graph-demo-state", "incoming", {
      timeout: 8000,
    })
  })

  test("plays each scroll-selected demo and keeps its progress ring moving", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/vi")
    for (const feature of [
      "knowledge-graph",
      "market-chart",
      "ai-conversation",
      "scheduled-telegram",
    ]) {
      await page
        .locator(`[data-story-copy="${feature}"]`)
        .evaluate((element) =>
          element.scrollIntoView({ block: "center", behavior: "instant" })
        )
      const stage = page.locator(`[data-feature-stage="${feature}"]`)
      await expect(stage).toHaveAttribute("data-active", "true")
      const ring = page.locator(`[data-demo-progress="${feature}"] rect`).last()
      await expect
        .poll(() =>
          ring.evaluate((element) =>
            Number.parseFloat(
              (element as SVGRectElement).style.strokeDashoffset
            )
          )
        )
        .toBeGreaterThan(0)
      const before = await ring.evaluate(
        (element) => (element as SVGRectElement).style.strokeDashoffset
      )
      await expect
        .poll(() =>
          ring.evaluate(
            (element) => (element as SVGRectElement).style.strokeDashoffset
          )
        )
        .not.toBe(before)
      expect((await stage.boundingBox())!.y).toBeGreaterThanOrEqual(72)
    }
  })

  test("keeps all four story copies and static proofs available without JavaScript", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      javaScriptEnabled: false,
      viewport: { width: 1440, height: 900 },
    })
    try {
      const page = await context.newPage()
      await page.goto("/vi")
      await expect(
        page.locator(
          'img[src*="knowledge-graph"], img[src*="live-market-chart"]'
        )
      ).toHaveCount(0)
      await expect(
        page.locator("[data-graph-demo-state] svg").first()
      ).toBeVisible()
      await expect(
        page.locator("[data-graph-demo-state] aside").last()
      ).toBeVisible()
      await expect(
        page.locator("[data-market-demo-state] svg").first()
      ).toBeVisible()
      for (const feature of [
        "knowledge-graph",
        "market-chart",
        "ai-conversation",
        "scheduled-telegram",
      ]) {
        await expect(
          page.locator(`[data-story-copy="${feature}"]`)
        ).toBeVisible()
        await expect(
          page.locator(`[data-feature-stage="${feature}"]`)
        ).toBeVisible()
      }
      await expect(page.locator("[data-feature-showcase]")).toHaveAttribute(
        "data-scroll-enhanced",
        "false"
      )
    } finally {
      await context.close()
    }
  })

  test("navigates story steps from the focused button and keeps focus when scrolling", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/en")
    const graph = page.getByRole("button", {
      name: "Knowledge Graph",
      exact: true,
    })
    const market = page.getByRole("button", {
      name: "Market Chart",
      exact: true,
    })
    const ai = page.getByRole("button", {
      name: "AI Conversation",
      exact: true,
    })
    await graph.click()
    await market.evaluate((button) =>
      (button as HTMLButtonElement).focus({ preventScroll: true })
    )
    await market.press("ArrowDown")
    await expect(ai).toBeFocused()
    await expect(ai).toHaveAttribute("aria-current", "step")
    await ai.press("Home")
    await expect(graph).toBeFocused()
    await page
      .locator('[data-story-copy="scheduled-telegram"]')
      .evaluate((element) =>
        element.scrollIntoView({ block: "center", behavior: "instant" })
      )
    await expect(graph).toBeFocused()
    await expect(
      page.locator('[data-feature-selector="scheduled-telegram"]')
    ).toHaveAttribute("aria-current", "step")
    await graph.press("Space")
    await expect(graph).toHaveAttribute("aria-current", "step")
    await graph.press("End")
    await expect(
      page.locator('[data-feature-selector="scheduled-telegram"]')
    ).toBeFocused()
  })

  test("keeps sticky demos on wide screens regardless of viewport height, with progress around each number", async ({
    page,
  }) => {
    for (const viewport of [
      { width: 1440, height: 720 },
      { width: 1100, height: 700 },
      { width: 1024, height: 768 },
      { width: 1440, height: 600 },
    ]) {
      await page.setViewportSize(viewport)
      await page.emulateMedia({ reducedMotion: "reduce" })
      await page.goto("/vi")
      await expect(page.locator("[data-feature-showcase]")).toHaveAttribute(
        "data-scroll-enhanced",
        "true"
      )
      for (const feature of [
        "knowledge-graph",
        "market-chart",
        "ai-conversation",
        "scheduled-telegram",
      ]) {
        const copy = page.locator(`[data-story-copy="${feature}"]`)
        await copy.evaluate((element) =>
          element.scrollIntoView({ block: "center", behavior: "instant" })
        )
        const stage = page.locator(`[data-feature-stage="${feature}"]`)
        await expect(stage).toHaveAttribute("data-active", "true")
        await expect(stage).toHaveCSS("position", "sticky")
        await expect(page.locator("[data-feature-stage]:visible")).toHaveCount(
          1
        )
        const copyBox = await copy.boundingBox()
        const stageBox = await stage.boundingBox()
        expect(stageBox!.x).toBeGreaterThanOrEqual(copyBox!.x + copyBox!.width)
        expect(stageBox!.y).toBeGreaterThanOrEqual(72)
        expect(stageBox!.y + stageBox!.height).toBeLessThanOrEqual(
          viewport.height
        )
        const progress = copy.locator("[data-demo-progress]")
        await expect(progress).toBeVisible()
        const ringBox = await progress.boundingBox()
        const numberBox = await progress
          .locator("..")
          .locator("span")
          .boundingBox()
        expect(ringBox!.x).toBeLessThan(numberBox!.x)
        expect(ringBox!.y).toBeLessThan(numberBox!.y)
        expect(ringBox!.x + ringBox!.width).toBeGreaterThan(
          numberBox!.x + numberBox!.width
        )
        expect(ringBox!.y + ringBox!.height).toBeGreaterThan(
          numberBox!.y + numberBox!.height
        )
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
    }
  })

  test("keeps each story demo after its own copy on narrow screens", async ({
    page,
  }) => {
    for (const viewport of [
      { width: 375, height: 800 },
      { width: 768, height: 900 },
      { width: 1023, height: 768 },
    ]) {
      await page.setViewportSize(viewport)
      await page.emulateMedia({ reducedMotion: "reduce" })
      await page.goto("/vi")
      for (const feature of [
        "knowledge-graph",
        "market-chart",
        "ai-conversation",
        "scheduled-telegram",
      ]) {
        const copy = page.locator(`[data-story-copy="${feature}"]`)
        await copy.evaluate((element) =>
          element.scrollIntoView({ block: "center", behavior: "instant" })
        )
        await expect(
          page.locator(`[data-feature-selector="${feature}"]`)
        ).toHaveAttribute("aria-current", "step")
        const stage = page.locator(`[data-feature-stage="${feature}"]`)
        await expect(stage).toHaveCSS("position", "relative")
        const copyBox = await copy.boundingBox()
        const stageBox = await stage.boundingBox()
        expect(stageBox!.y).toBeGreaterThan(copyBox!.y + copyBox!.height)
        expect(stageBox!.x).toBeGreaterThanOrEqual(0)
        expect(stageBox!.x + stageBox!.width).toBeLessThanOrEqual(
          viewport.width
        )
        await stage.scrollIntoViewIfNeeded()
        await expect(
          page.locator(`[data-feature-selector="${feature}"]`)
        ).toHaveAttribute("aria-current", "step")
        if (viewport.width === 375 && feature === "ai-conversation") {
          await copy.evaluate((element) =>
            window.scrollTo({
              top: window.scrollY + element.getBoundingClientRect().top - 88,
              behavior: "instant",
            })
          )
          await page.screenshot({
            path: "test-results/hero-preview/story-mobile.png",
          })
        }
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
    }
  })

  test("keeps the AI conversation prompt and submitted message visible across loops", async ({
    page,
  }) => {
    await page.clock.install({ time: new Date("2026-09-30T12:00:00Z") })
    await page.goto("/en")
    const showcase = page.locator('[data-landing-section="showcase"]')
    await showcase.scrollIntoViewIfNeeded()
    await showcase
      .getByRole("button", { name: "Knowledge Graph", exact: true })
      .click()
    await expect(showcase.locator("[data-ai-conversation-demo]")).toBeAttached()
    await page.clock.pauseAt(
      new Date((await page.evaluate(() => Date.now())) + 1_000)
    )
    await showcase
      .getByRole("button", { name: "AI Conversation", exact: true })
      .click()

    const demo = showcase.locator("[data-ai-conversation-demo]")
    const composer = demo.locator("textarea")
    await expect(composer).toBeVisible()
    const composerMetrics = await composer.evaluate((textarea) => {
      const style = getComputedStyle(textarea)
      const fourTextLines = Number.parseFloat(style.lineHeight) * 4
      return {
        clientHeight: textarea.clientHeight,
        fourTextLines,
        scrollHeight: textarea.scrollHeight,
      }
    })
    expect(
      composerMetrics.scrollHeight <= composerMetrics.clientHeight &&
        composerMetrics.clientHeight >= composerMetrics.fourTextLines
    ).toBe(true)

    await expect(demo).toHaveAttribute(
      "data-ai-conversation-playback",
      "autoplay"
    )
    await page.clock.runFor(7_400)
    await expect(demo).toHaveAttribute(
      "data-ai-conversation-state",
      "crossCheck"
    )
    await expect(demo.locator("[data-ai-thinking]")).toHaveAttribute(
      "data-visible",
      "true"
    )
    await expect(demo.locator("[data-ai-response]")).toHaveAttribute(
      "data-visible",
      "false"
    )
    await page.clock.runFor(2_800)
    await expect(demo).toHaveAttribute("data-ai-conversation-state", "answer")
    await expect(demo.locator("[data-ai-thinking]")).toHaveAttribute(
      "data-visible",
      "false"
    )
    await expect(demo.locator("[data-ai-response]")).toHaveAttribute(
      "data-streaming",
      "true"
    )
    await page.clock.runFor(6_500)
    await expect(demo.locator("[data-ai-follow-up-thinking]")).toHaveAttribute(
      "data-visible",
      "true"
    )
    await expect(demo.locator("[data-ai-follow-up-user]")).toHaveAttribute(
      "data-visible",
      "true"
    )
    await page.clock.runFor(2_600)
    await expect(demo).toHaveAttribute(
      "data-ai-conversation-state",
      "followUpAnswer"
    )
    await expect(demo.locator("[data-ai-follow-up-thinking]")).toHaveAttribute(
      "data-visible",
      "false"
    )
    await expect(demo.locator("[data-ai-follow-up-response]")).toHaveAttribute(
      "data-streaming",
      "true"
    )

    await page.clock.runFor(5_700)
    await expect(demo).toHaveAttribute("data-ai-conversation-state", "complete")
    await page.clock.runFor(2_600)
    await expect(demo).toHaveAttribute("data-ai-conversation-state", "welcome")
    await page.clock.runFor(3_600)
    await expect(demo).toHaveAttribute(
      "data-ai-conversation-state",
      "submitted"
    )

    const submittedMessageIsVisible = await demo
      .locator("[data-ai-user-message]")
      .evaluate((message) => {
        const viewport = message.parentElement
        if (!viewport) return false
        const messageRect = message.getBoundingClientRect()
        const viewportRect = viewport.getBoundingClientRect()
        return (
          messageRect.top >= viewportRect.top &&
          messageRect.bottom <= viewportRect.bottom
        )
      })
    expect(submittedMessageIsVisible).toBe(true)
  })

  test("keeps the second AI conversation question fully visible", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/en")
    const showcase = page.locator('[data-landing-section="showcase"]')
    await showcase.scrollIntoViewIfNeeded()
    await showcase
      .getByRole("button", { name: "AI Conversation", exact: true })
      .click()

    const followUp = showcase.locator("[data-ai-follow-up-user]")
    await expect(followUp).toBeVisible()
    const metrics = await followUp.evaluate((message) => {
      const style = getComputedStyle(message)
      return {
        clientHeight: message.clientHeight,
        paddingBottom: Number.parseFloat(style.paddingBottom),
        paddingTop: Number.parseFloat(style.paddingTop),
        scrollHeight: message.scrollHeight,
      }
    })

    expect(metrics.clientHeight).toBeGreaterThanOrEqual(metrics.scrollHeight)
    expect(metrics.paddingTop).toBeGreaterThan(0)
    expect(metrics.paddingBottom).toBeGreaterThan(0)
  })

  for (const locale of ["vi", "en"] as const) {
    test(`${locale} keeps both Telegram panels inside one browser at desktop and mobile sizes`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" })
      for (const viewport of [
        { width: 1440, height: 500 },
        { width: 1024, height: 500 },
        { width: 1440, height: 600 },
        { width: 1024, height: 768 },
        { width: 768, height: 900 },
        { width: 375, height: 800 },
      ]) {
        await page.setViewportSize(viewport)
        await page.goto(`/${locale}`)
        await expect(page.locator("[data-feature-showcase]")).toHaveAttribute(
          "data-scroll-enhanced",
          viewport.width >= 1024 ? "true" : "false"
        )
        await page
          .locator('[data-feature-selector="scheduled-telegram"]')
          .click()
        const stage = page.locator('[data-feature-stage="scheduled-telegram"]')
        const browser = stage.locator("[data-telegram-browser]")
        await expect(browser).toHaveCount(1)
        await expect(browser.locator("header").first()).toContainText(
          locale === "vi"
            ? "Phân tích thị trường theo lịch"
            : "Scheduled Market Analysis"
        )
        await expect(browser.locator("header").first()).toContainText(
          "https://www.signapse.cloud/"
        )
        const panels = browser.locator("[data-telegram-canvas] > section")
        await expect(panels).toHaveCount(2)
        const browserBox = (await browser.boundingBox())!
        const left = (await panels.nth(0).boundingBox())!
        const right = (await panels.nth(1).boundingBox())!
        for (const panel of [left, right]) {
          expect(panel.x).toBeGreaterThan(browserBox.x)
          expect(panel.x + panel.width).toBeLessThan(
            browserBox.x + browserBox.width
          )
          expect(panel.y).toBeGreaterThan(browserBox.y)
          expect(panel.y + panel.height).toBeLessThan(
            browserBox.y + browserBox.height
          )
        }
        if (viewport.width >= 768)
          expect(right.x).toBeGreaterThan(left.x + left.width)
        else expect(right.y).toBeGreaterThan(left.y + left.height)
        if (viewport.width >= 1024 && viewport.height >= 600) {
          expect(browserBox.y).toBeGreaterThanOrEqual(72)
          expect(browserBox.y + browserBox.height).toBeLessThanOrEqual(
            viewport.height
          )
        }
        const messageFits = await browser
          .locator('[data-slot="bubble-content"]')
          .evaluate((bubble) => {
            const panel = bubble.closest("section")!
            const message = bubble.getBoundingClientRect()
            const bounds = panel.getBoundingClientRect()
            return (
              bubble.scrollHeight <= bubble.clientHeight &&
              message.top >= bounds.top &&
              message.bottom <= bounds.bottom
            )
          })
        expect(messageFits).toBe(true)
        for (const panel of await panels.all()) {
          expect(
            await panel.evaluate(
              (element) => element.scrollHeight <= element.clientHeight
            )
          ).toBe(true)
        }
        if (viewport.height < 600) {
          await page.locator("[data-feature-showcase]").evaluate((element) => {
            window.scrollBy({
              top: element.getBoundingClientRect().bottom - innerHeight + 16,
              behavior: "instant",
            })
          })
          const composer = await panels
            .last()
            .locator(":scope > div")
            .last()
            .boundingBox()
          expect(composer!.y).toBeGreaterThanOrEqual(72)
          expect(composer!.y + composer!.height).toBeLessThanOrEqual(
            viewport.height
          )
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        ).toBe(true)
      }
    })
  }

  test("keeps a static final Telegram illustration with reduced motion", async ({
    page,
  }) => {
    const serverResponse = await page.request.get("/en")
    expect(await serverResponse.text()).toContain("data-telegram-browser")
    expect(serverResponse.ok()).toBe(true)
    expect(await serverResponse.text()).toContain('data-demo-renderer="static"')
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/en")
    const showcase = page.locator('[data-landing-section="showcase"]')
    await showcase.scrollIntoViewIfNeeded()
    await showcase.getByRole("button", { name: /Scheduled Telegram/ }).click()
    const telegramDemo = showcase.locator(
      '[data-telegram-demo-stage][data-demo-renderer="motion"]'
    )
    await expect(telegramDemo).toBeVisible({ timeout: 8000 })
    await expect(telegramDemo).toHaveAttribute(
      "data-telegram-demo-state",
      "delivered"
    )
    await expect(telegramDemo).toHaveAttribute(
      "data-telegram-demo-playback",
      "complete"
    )
    await expect(telegramDemo.getByRole("button")).toHaveCount(0)
    await expect(telegramDemo.locator('[data-visible="true"]')).toHaveCount(1)
  })

  test("reflows the five capability triggers without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/en")

    const desktopCards = page.locator("[data-capability-trigger]")
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
      .locator("[data-capability-trigger]")
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

  for (const locale of ["vi", "en"] as const) {
    test(`${locale} shows five capability details on hover without moving the hero`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.emulateMedia({ reducedMotion: "reduce" })
      await page.goto(`/${locale}`)
      const hero = page.locator('[data-landing-section="hero-product-proof"]')
      const before = await hero.boundingBox()
      const details = [
        [
          "knowledge-graph",
          locale === "vi"
            ? "Nắm trọn bức tranh thị trường."
            : "See the complete market picture.",
        ],
        [
          "live-charts",
          locale === "vi"
            ? "Thấy rõ điều gì đang làm giá chuyển động."
            : "See what is moving prices.",
        ],
        [
          "ai-assistant",
          locale === "vi"
            ? "Hỏi nhanh, hiểu sâu cùng AI."
            : "Ask quickly and understand deeply with AI.",
        ],
        [
          "telegram",
          locale === "vi"
            ? "Tín hiệu quan trọng, gửi thẳng đến Telegram."
            : "Send important signals straight to Telegram.",
        ],
        [
          "strategy-coding",
          locale === "vi"
            ? "Biến ý tưởng giao dịch thành chiến lược."
            : "Turn a trading idea into a strategy.",
        ],
      ]
      for (const [id, title] of details) {
        const trigger = page.locator(`[data-capability-trigger="${id}"]`)
        await waitForClientHandler(trigger)
        await trigger.hover()
        const popup = page.getByRole("dialog", { name: title, exact: true })
        await expect(popup).toBeVisible()
        await expect(page.getByRole("dialog")).toHaveCount(1)
        await expect(
          popup.locator('[data-slot="popover-description"]')
        ).not.toBeEmpty()
        await expect(trigger).toHaveAttribute("aria-expanded", "true")
        await popup.hover()
        await expect(popup).toBeVisible()
        const box = await popup.boundingBox()
        expect(box && box.x >= 0 && box.x + box.width <= 1440).toBe(true)
        expect((await hero.boundingBox())?.height).toBe(before?.height)
        await page.mouse.move(4, 4)
        await expect(popup).toBeHidden()
      }
      await page.locator("#knowledge-graph").hover()
      await expect(
        page.locator('[data-capability-detail="knowledge-graph"]')
      ).toBeVisible()
      await expect(
        new AxeBuilder({ page }).include("#landing-capability-detail").analyze()
      ).resolves.toMatchObject({ violations: [] })
      await page.screenshot({
        path: `test-results/hero-preview/capability-desktop-${locale}.png`,
      })
    })
  }

  test("opens capability details with keyboard and restores focus on Escape", async ({
    page,
  }) => {
    await page.goto("/vi")
    const trigger = page.locator("#ai-assistant")
    await trigger.focus()
    await expect(trigger).toBeFocused()
    await expect(trigger).toHaveCSS("outline-style", "solid")
    await trigger.press("Enter")
    const popup = page.getByRole("dialog", {
      name: "Hỏi nhanh, hiểu sâu cùng AI.",
      exact: true,
    })
    await expect(popup).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(popup).toBeHidden()
    await expect(trigger).toBeFocused()
    await trigger.press("Space")
    await expect(popup).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(trigger).toBeFocused()
  })

  test("opens capability details from header, footer, repeated links and locale hashes", async ({
    page,
  }) => {
    await page.goto("/vi?source=hero#strategy-coding")
    await expect(
      page.getByRole("dialog", {
        name: "Biến ý tưởng giao dịch thành chiến lược.",
        exact: true,
      })
    ).toBeVisible()
    await page.locator("[data-locale-menu-trigger]").click()
    await page.getByRole("link", { name: "English", exact: true }).click()
    await expect(page).toHaveURL(/\/en\?source=hero#strategy-coding$/)
    await expect(
      page.getByRole("dialog", {
        name: "Turn a trading idea into a strategy.",
        exact: true,
      })
    ).toBeVisible()
    await page.keyboard.press("Escape")
    await page.locator('footer a[href="#telegram"]').click()
    await expect(
      page.getByRole("dialog", {
        name: "Send important signals straight to Telegram.",
        exact: true,
      })
    ).toBeVisible()
    await page.keyboard.press("Escape")
    await page.locator('footer a[href="#telegram"]').click()
    await expect(
      page.getByRole("dialog", {
        name: "Send important signals straight to Telegram.",
        exact: true,
      })
    ).toBeVisible()
    await page.keyboard.press("Escape")
    await page.getByText("Product", { exact: true }).first().hover()
    await page.locator('header a[href="#knowledge-graph"]:visible').click()
    await expect(
      page.getByRole("dialog", {
        name: "See the complete market picture.",
        exact: true,
      })
    ).toBeVisible()
  })

  test("opens capability details by touch and keeps mobile and zoom layouts readable", async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 375, height: 800 },
      hasTouch: true,
      isMobile: true,
      reducedMotion: "reduce",
    })
    const page = await context.newPage()
    try {
      await page.goto("/vi")
      await page.locator("#knowledge-graph").tap()
      await expect(
        page.getByRole("dialog", {
          name: "Nắm trọn bức tranh thị trường.",
          exact: true,
        })
      ).toBeVisible()
      await page.locator("#telegram").tap()
      const popup = page.getByRole("dialog", {
        name: "Tín hiệu quan trọng, gửi thẳng đến Telegram.",
        exact: true,
      })
      await expect(popup).toBeVisible()
      await expect(page.getByRole("dialog")).toHaveCount(1)
      const box = await popup.boundingBox()
      expect(box && box.x >= 0 && box.x + box.width <= 375).toBe(true)
      await page.screenshot({
        path: "test-results/hero-preview/capability-mobile.png",
      })
      await page.locator("#telegram").tap()
      await expect(popup).toBeHidden()
      await page.locator("#ai-assistant").tap()
      await page.locator("h1").tap()
      await expect(page.getByRole("dialog")).toHaveCount(0)
      await page.setViewportSize({ width: 720, height: 450 })
      await page.evaluate(() => {
        document.body.style.zoom = "2"
      })
      await page.locator("#strategy-coding").tap()
      await expect(
        page.getByRole("dialog", {
          name: "Biến ý tưởng giao dịch thành chiến lược.",
          exact: true,
        })
      ).toBeVisible()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true)
    } finally {
      await context.close()
    }
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

    const summary = page.locator("[data-mobile-menu] > summary")
    await summary.focus()
    await expect(summary).toBeFocused()
    await summary.press("Enter")
    await expect(page.locator("[data-mobile-menu]")).toHaveAttribute("open", "")
    const productGroup = page
      .locator('[data-mobile-menu] details[name="landing-mobile-menu-group"]')
      .first()
    await productGroup.locator("summary").press("Enter")
    await expect(productGroup).toHaveAttribute("open", "")
    await expect(
      page.getByRole("link", { name: /Đồ thị Tri thức/ })
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: "English", exact: true }).last()
    ).toBeVisible()
    const box = await summary.boundingBox()
    expect(box?.width).toBeGreaterThanOrEqual(44)
    expect(box?.height).toBeGreaterThanOrEqual(44)
  })

  test("keeps desktop navigation open while moving into its panel", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto("/en")

    const disclosure = page
      .locator('details[name="landing-desktop-menu"]')
      .first()
    const trigger = disclosure.locator("summary")
    const panelLink = disclosure.getByRole("link").first()

    await trigger.hover()
    await expect(disclosure).toHaveAttribute("open", "")

    const triggerBox = await trigger.boundingBox()
    const panelBox = await disclosure.locator("div").first().boundingBox()
    expect(triggerBox).not.toBeNull()
    expect(panelBox).not.toBeNull()

    await page.mouse.move(
      triggerBox!.x + triggerBox!.width / 2,
      (triggerBox!.y + triggerBox!.height + panelBox!.y) / 2
    )
    await expect(disclosure).toHaveAttribute("open", "")

    await panelLink.hover()
    await expect(panelLink).toBeVisible()
    await expect(disclosure).toHaveAttribute("open", "")
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
      await expect(page.locator("[data-feature-showcase]")).toHaveAttribute(
        "data-scroll-enhanced",
        width >= 1024 ? "true" : "false"
      )
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth
          )
        )
        .toBe(true)

      const tabListBox = await page
        .locator('[data-story-copy="knowledge-graph"]')
        .boundingBox()
      const stageBox = await page
        .locator('[data-feature-stage="knowledge-graph"]')
        .boundingBox()
      expect(tabListBox).not.toBeNull()
      expect(stageBox).not.toBeNull()
      if (width < 1024) {
        expect(tabListBox!.y + tabListBox!.height).toBeLessThanOrEqual(
          stageBox!.y + 1
        )
      } else {
        expect(tabListBox!.x + tabListBox!.width).toBeLessThanOrEqual(
          stageBox!.x
        )
      }
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
    const zoomedTabList = await page
      .locator('[data-story-copy="knowledge-graph"]')
      .boundingBox()
    const zoomedStage = await page
      .locator('[data-feature-stage="knowledge-graph"]')
      .boundingBox()
    expect(zoomedTabList!.y + zoomedTabList!.height).toBeLessThanOrEqual(
      zoomedStage!.y + 1
    )

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

  test("keeps provider logos static when reduced motion is requested", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/en#trust")

    const providerSection = page.locator(
      '[data-landing-section="ai-providers"]'
    )
    await expect(providerSection.locator("[data-provider-item]")).toHaveCount(6)
    await expect(providerSection.locator("ul[aria-hidden='true']")).toBeHidden()
    await expect(
      providerSection.locator("[data-provider-logo]").first()
    ).toBeVisible()
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
