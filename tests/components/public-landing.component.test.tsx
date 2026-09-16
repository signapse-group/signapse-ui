import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/app/[lang]/landing-locale-links", () => ({
  LandingLocaleLinks: ({ labels }: { labels: { vi: string; en: string } }) => (
    <nav data-locale-links>
      {labels.vi} / {labels.en}
    </nav>
  ),
}))

import { LandingPage } from "@/app/[lang]/landing-page"
import { en as enDictionary } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"

function renderLanding(locale: "vi" | "en", isAuthenticated = true) {
  return renderToStaticMarkup(
    <LandingPage
      dictionary={locale === "vi" ? viDictionary : enDictionary}
      locale={locale}
      isAuthenticated={isAuthenticated}
    />
  )
}

describe("localized landing composition", () => {
  it.each([
    ["vi", "Hiểu nhanh hơn. Hành động chủ động hơn."],
    ["en", "Understand faster. Act proactively."],
  ] as const)("renders the five-capability %s story", (locale, heading) => {
    const html = renderLanding(locale)
    expect(html).toContain('data-landing-theme="fixed-signapse"')
    expect((html.match(/data-landing-surface="dark"/g) ?? []).length).toBe(5)
    expect((html.match(/data-landing-surface="light"/g) ?? []).length).toBe(4)

    const sectionOrder = [
      "hero-product-proof",
      "capability-strip",
      "product-story",
      "audiences",
      "analysis-flow",
      "showcase",
      "ai-providers",
      "final-access-cta",
    ]
    const positions = sectionOrder.map((section) =>
      html.indexOf(`data-landing-section=\"${section}\"`)
    )

    expect(positions.every((position) => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect((html.match(/<h1/g) ?? []).length).toBe(1)
    expect(html).toContain(heading)
    expect(html).toContain(
      "MARKET INTELLIGENCE &amp; TRADING AUTOMATION PLATFORM"
    )
    expect(html).toContain('href="#product"')
    expect(html).toContain(
      locale === "vi" ? "Trợ lý AI chuyên biệt" : "Specialized AI Assistant"
    )
    expect(html).toContain(
      locale === "vi"
        ? "Đọc bối cảnh, không chỉ nhìn nến"
        : "Read the context, not just the candles"
    )

    expect((html.match(/data-product-card/g) ?? []).length).toBe(5)
    expect((html.match(/data-media-state="approved"/g) ?? []).length).toBe(2)
    expect(html).not.toContain('data-media-state="text-first"')
    expect((html.match(/data-landing-media-slot/g) ?? []).length).toBe(2)
    expect(html).toContain(
      locale === "vi"
        ? "Nắm trọn bức tranh thị trường."
        : "See the complete market picture."
    )
    expect(html).toContain(
      locale === "vi"
        ? "Thấy rõ điều gì đang làm giá chuyển động."
        : "See what is moving prices."
    )
    expect(html).toContain(
      locale === "vi" ? "Hiểu bối cảnh nhanh hơn" : "Understand context faster"
    )
    expect(html).toContain(
      locale === "vi" ? "Xây dựng chiến lược" : "Build a strategy"
    )
    expect(html).toContain(
      locale === "vi" ? "Theo dõi thị trường" : "Monitor the market"
    )
    expect(html).toContain(
      locale === "vi"
        ? "Phân phối qua Telegram hoặc triển khai bot trong phạm vi quyền kiểm soát."
        : "Distribute through Telegram or deploy a bot within controlled limits."
    )
    expect(html).toContain(
      locale === "vi"
        ? "Công nghệ phù hợp với từng mục tiêu giao dịch."
        : "Technology shaped around every trading objective."
    )
    expect(html).toContain(
      locale === "vi"
        ? "Xem cách Signapse biến dữ liệu thành hành động."
        : "See how Signapse turns data into action."
    )
    const showcaseSelectorOrder = [
      locale === "vi" ? "Đồ thị Tri thức" : "Knowledge Graph",
      locale === "vi" ? "Biểu đồ thị trường" : "Market Chart",
      locale === "vi" ? "Hội thoại AI" : "AI Conversation",
      locale === "vi" ? "Telegram theo lịch" : "Scheduled Telegram",
    ]
    const showcaseSelectorPositions = showcaseSelectorOrder.map((label) =>
      html.indexOf(label)
    )
    expect(showcaseSelectorPositions.every((position) => position >= 0)).toBe(
      true
    )
    expect(showcaseSelectorPositions).toEqual(
      [...showcaseSelectorPositions].sort((a, b) => a - b)
    )
    expect(html).toContain(
      locale === "vi"
        ? "Phân tích thị trường cùng Signapse AI"
        : "Market analysis with Signapse AI"
    )
    expect(html).toContain(
      locale === "vi" ? "Dấu vết bằng chứng" : "Evidence trail"
    )
    expect(html).toContain("BTC")
    expect(html).toContain('data-ai-conversation-state="complete"')
    expect(html).toContain('role="log"')
    expect((html.match(/role="tab"/g) ?? []).length).toBe(4)
    expect(html).toContain('data-feature-selector="scheduled-telegram"')
    expect(html).toMatch(
      /aria-selected="true"[^>]*data-feature-selector="scheduled-telegram"/
    )
    expect(html).toContain('data-feature-stage="scheduled-telegram"')
    expect(html).toContain('data-demo-mode="automatic"')
    expect(html).toContain('data-demo-renderer="static"')
    expect(html).toContain('data-telegram-demo-state="preview"')
    expect(html).toContain("DEMO")
    expect(html).toContain("Market Desk")
    expect(html).toContain("XAU/USD")
    expect(html).toContain("Asia/Bangkok")
    expect(html).not.toContain("Strategy Coding")
    expect(html).not.toContain("Price threshold alert")
    expect(html).toContain(
      locale === "vi"
        ? "Nhiều mô hình AI. Một nền tảng Signapse."
        : "Multiple AI models. One Signapse platform."
    )
    expect((html.match(/data-provider-item=/g) ?? []).length).toBe(6)
    expect(html).toContain("Anthropic")
    expect(html).toContain("/images/providers/anthropic.svg")
    expect(html).not.toContain("workspace-ai")
    expect(html).not.toContain("Market Query")
    expect(
      (html.match(/data-landing-decoration="ohlcv-depth-field"/g) ?? []).length
    ).toBe(1)
    expect(html).toMatch(
      /<div aria-hidden="true"[^>]*data-landing-decoration="ohlcv-depth-field"/
    )
    expect(html).toContain('focusable="false"')
    expect(html).toContain('data-landing-visual="context-figure"')
    expect(html).toContain('<figcaption class="sr-only">')
  })

  it("renders the localized demo form for anonymous visitors", () => {
    const html = renderLanding("vi", false)

    expect(html).toContain("Họ và tên")
    expect(html).toContain("Email công việc")
    expect(html).toContain("Nhu cầu chính")
    expect(html).toContain("Đăng ký xem demo")
    expect(html).not.toContain("Bản demo tĩnh")
  })
})
