import { describe, expect, it } from "vitest"

import { en } from "@/app/lib/i18n/dictionaries/en"
import {
  TELEGRAM_DEMO_DURATION,
  TELEGRAM_DEMO_FINAL_FRAME,
  TELEGRAM_DEMO_TIMING,
  getTelegramDemoCursor,
  getTelegramDemoFrame,
  getTelegramDemoMessage,
} from "@/app/[lang]/landing-scheduled-telegram-demo-model"

describe("Scheduled Telegram automatic timeline", () => {
  it("configures the schedule, builds the analysis, then delivers it", () => {
    const phases = [
      0, 1.1, 1.7, 2.4, 2.9, 3.6, 4.1, 4.95, 5.2, 5.5, 5.9, 6.3, 6.7, 7.1, 7.9,
      9.6, 10.6, 12.3,
    ].map((time) => getTelegramDemoFrame(time).phase)
    expect(phases).toEqual([
      "start",
      "assetOpen",
      "assetSelected",
      "timeOpen",
      "timeSelected",
      "languageOpen",
      "languageSelected",
      "submit",
      "scheduled",
      "collecting",
      "priceReady",
      "technicalReady",
      "contextReady",
      "normalizing",
      "reasoning",
      "composing",
      "sending",
      "delivered",
    ])
    expect(getTelegramDemoFrame(TELEGRAM_DEMO_DURATION)).toBe(
      TELEGRAM_DEMO_FINAL_FRAME
    )
    expect(
      TELEGRAM_DEMO_DURATION - TELEGRAM_DEMO_TIMING.delivered
    ).toBeGreaterThanOrEqual(7)
    expect(getTelegramDemoFrame(0).phase).toBe("start")
  })

  it("places the cursor on the actual option before each selection and presses the submit button", () => {
    const initial = getTelegramDemoCursor(0)
    expect(initial.from).toBe("center")
    expect(initial.to).toBe("center")
    expect(initial.opacity).toBe(1)

    for (const [time, target] of [
      [1.65, "asset-option"],
      [2.85, "time-option"],
      [4.05, "language-option"],
    ] as const) {
      const cursor = getTelegramDemoCursor(time)
      expect(cursor.from).toBe(target)
      expect(cursor.to).toBe(target)
      expect(cursor.opacity).toBe(1)
    }
    const click = getTelegramDemoCursor(5)
    expect(click.from).toBe("submit")
    expect(click.to).toBe("submit")
    expect(click.scale).toBeCloseTo(0.88)
    expect(getTelegramDemoCursor(TELEGRAM_DEMO_TIMING.collecting).opacity).toBe(
      1
    )
  })

  it("keeps cursor interpolation bounded throughout a loop and reuses frames between transitions", () => {
    for (let time = 0; time <= TELEGRAM_DEMO_DURATION; time += 0.025) {
      const cursor = getTelegramDemoCursor(time)
      expect(cursor.progress).toBeGreaterThanOrEqual(0)
      expect(cursor.progress).toBeLessThanOrEqual(1)
      expect(cursor.scale).toBeGreaterThanOrEqual(0.879)
      expect(cursor.scale).toBeLessThanOrEqual(1.001)
    }
    expect(getTelegramDemoFrame(12.3)).toBe(getTelegramDemoFrame(19.9))
  })

  it("uses the output language for the entire analysis, independently of the page language", () => {
    const labels = en.landing.showcase.telegram
    const message = getTelegramDemoMessage(labels, {
      asset: "XAU/USD",
      sendTime: "08:00",
      outputLanguage: "vi",
    })
    expect(message.title).toBe("📊 XAUUSD · 16/09/2026 08:00")
    expect(message.horizon).toContain("THIÊN HƯỚNG: TĂNG")
    expect(message.scenario).toContain("BUY PULLBACK")
    expect(message.risk).toContain("breakout 3.705")
    expect(message.meta).toContain("Tiếng Việt")
  })
})
