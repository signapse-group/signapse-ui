// @vitest-environment jsdom

import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/app/[lang]/landing-locale-links", () => ({
  LandingLocaleLinks: ({ labels }: { labels: { vi: string; en: string } }) => (
    <nav data-locale-links>
      {labels.vi} / {labels.en}
    </nav>
  ),
  LandingLocaleMenu: () => <button type="button" aria-label="locale menu" />,
}))

import { LandingPage } from "@/app/[lang]/landing-page"
import { LocalizationProvider } from "@/app/lib/i18n/provider"
import { en as enDictionary } from "@/app/lib/i18n/dictionaries/en"
import { vi as viDictionary } from "@/app/lib/i18n/dictionaries/vi"

function renderLanding(locale: "vi" | "en", isAuthenticated = true) {
  return renderToStaticMarkup(
    <LocalizationProvider
      locale={locale}
      dictionary={locale === "vi" ? viDictionary : enDictionary}
    >
      <LandingPage
        dictionary={locale === "vi" ? viDictionary : enDictionary}
        locale={locale}
        isAuthenticated={isAuthenticated}
      />
    </LocalizationProvider>
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
    expect((html.match(/data-landing-surface="light"/g) ?? []).length).toBe(2)

    const sectionOrder = [
      "hero-product-proof",
      "capability-strip",
      "showcase",
      "audiences",
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
    expect(html).toContain(
      locale === "vi" ? "Trợ lý AI chuyên biệt" : "Specialized AI Assistant"
    )
    expect(html).not.toContain(
      locale === "vi"
        ? "Đọc bối cảnh, không chỉ nhìn nến"
        : "Read the context, not just the candles"
    )

    expect(html).not.toContain("data-product-card")
    expect(html).not.toContain('id="product"')
    expect((html.match(/data-capability-trigger=/g) ?? []).length).toBe(5)
    expect(html).not.toContain("data-landing-media-slot")
    expect(html).not.toContain("/images/landing/")
    expect(html).toContain("data-graph-demo-state")
    expect(html).toContain("data-market-demo-state")
    expect(html).not.toContain(
      locale === "vi"
        ? "NĂM NĂNG LỰC · MỘT QUY TRÌNH LIỀN MẠCH"
        : "FIVE CAPABILITIES · ONE SEAMLESS WORKFLOW"
    )
    expect(html).not.toContain('data-landing-section="analysis-flow"')
    expect(html).not.toContain(
      locale === "vi"
        ? "TỪ TÍN HIỆU ĐẾN TỰ ĐỘNG HÓA"
        : "FROM SIGNALS TO AUTOMATION"
    )
    expect(html).toContain(
      locale === "vi"
        ? "Công nghệ phù hợp với từng mục tiêu giao dịch."
        : "Technology shaped around every trading objective."
    )
    expect(html).not.toContain(
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
        ? "Vì sao XAUUSD tăng gần đây?"
        : "Why has XAUUSD risen recently?"
    )
    expect(html).toContain(locale === "vi" ? "Tín hiệu chính" : "Key signals")
    expect(html).toContain("XAUUSD")
    expect(html).toContain(
      locale === "vi"
        ? "Kết nối sự kiện, tài sản và tin tức trong một ngữ cảnh."
        : "Connect events, assets, and news in one market context."
    )
    expect(html).toContain(
      locale === "vi" ? "Giải pháp doanh nghiệp" : "Enterprise solutions"
    )
    expect(html).toContain(locale === "vi" ? "Sắp ra mắt" : "Coming soon")
    expect(html).not.toContain(locale === "vi" ? ">Bảng giá<" : ">Pricing<")
    expect(html).not.toContain(
      locale === "vi" ? ">Bot giao dịch<" : ">Trading bot<"
    )
    expect(html).toContain('data-ai-conversation-state="complete"')
    expect(html).toContain('role="log"')
    expect(html).toContain(
      locale === "vi"
        ? 'aria-label="Hội thoại mới"'
        : 'aria-label="New conversation"'
    )
    expect(html).toContain(
      locale === "vi"
        ? 'placeholder="Đặt câu hỏi tiếp theo…"'
        : 'placeholder="Ask a follow-up question…"'
    )
    expect(html).toContain(
      locale === "vi"
        ? "Trong 24–72 giờ tới, tôi nên theo dõi điều gì?"
        : "What should I watch over the next 24–72 hours?"
    )
    expect(html).toContain("inert")
    expect(html).toMatch(/<textarea[^>]*disabled/)
    expect((html.match(/data-story-step=/g) ?? []).length).toBe(4)
    expect(html).not.toContain('role="tab"')
    expect(html).not.toContain("SEE THE WORKFLOW")
    expect((html.match(/data-demo-progress=/g) ?? []).length).toBe(4)
    expect(html).toContain('data-feature-selector="scheduled-telegram"')
    expect(html).toMatch(
      /aria-current="step"[^>]*data-feature-selector="knowledge-graph"/
    )
    expect(html).toContain('data-feature-stage="knowledge-graph"')
    expect(html).toContain('data-demo-mode="automatic"')
    expect(html).toContain('data-demo-renderer="static"')
    expect(html).toContain('data-telegram-demo-state="preview"')
    expect(html).not.toContain(">DEMO<")
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

  it.each([
    ["vi", false],
    ["vi", true],
    ["en", false],
    ["en", true],
  ] as const)(
    "keeps one contact CTA and the relocated AI proof in the %s hero (authenticated: %s)",
    (locale, isAuthenticated) => {
      const doc = new DOMParser().parseFromString(
        renderLanding(locale, isAuthenticated),
        "text/html"
      )
      const hero = doc.querySelector(
        '[data-landing-section="hero-product-proof"]'
      )!
      const links = hero.querySelectorAll("a")
      expect(links).toHaveLength(1)
      expect(links[0].getAttribute("href")).toBe("#access")
      expect(links[0].textContent).toBe(locale === "vi" ? "Liên Hệ" : "Contact")
      expect(links[0].getAttribute("aria-label")).toBe(
        locale === "vi" ? "Liên Hệ với Signapse" : "Contact Signapse"
      )
      expect(hero.textContent).not.toContain(
        locale === "vi"
          ? "Bối cảnh rõ ràng · Tín hiệu theo cấu hình · Tự động hóa có kiểm soát"
          : "Clear context · Configurable signals · Controlled automation"
      )
      const proof = hero.querySelector("dl")!
      expect(proof.querySelector("dt")?.textContent).toBe(
        locale === "vi" ? "Trợ lý AI chuyên biệt" : "Specialized AI Assistant"
      )
      expect(proof.querySelector("dd")?.textContent).toBe(
        locale === "vi"
          ? "Vận hành trên Đồ thị Tri thức, được xây dựng từ dữ liệu thị trường đa nguồn đã qua tổng hợp, đánh giá và phân tích."
          : "Powered by a Knowledge Graph built from multi-source market data—aggregated, evaluated, and analyzed."
      )
      expect(links[0].parentElement?.nextElementSibling).toBe(proof)
      expect(proof.parentElement).toBe(
        hero.querySelector("h1")?.parentElement?.parentElement
      )
      expect(
        hero
          .querySelector('[data-landing-visual="context-figure"]')
          ?.parentElement?.querySelector("dl")
      ).toBeNull()
    }
  )

  it("renders a minimal email request action for anonymous visitors", () => {
    const html = renderLanding("vi", false)

    expect(html).toContain("Liên hệ demo")
    expect(
      html.includes("Mở ứng dụng email để bắt đầu trao đổi với Signapse.")
    ).toBe(true)
    expect((html.match(/href="mailto:/g) ?? []).length).toBe(1)
    expect(html).not.toContain("Họ và tên")
    expect(html).not.toContain("Email công việc")
    expect(html).not.toContain("Nhu cầu chính")
    expect(html).not.toContain("Bản demo tĩnh")
  })
})
