import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

import { GraphNodeInspectorMetadata } from "@/app/[lang]/(main)/graph-view/graph-node-inspector-metadata"
import type {
  GraphViewNode,
  GraphViewNodeMetadata,
} from "@/app/lib/graph-view/definitions"
import { en } from "@/app/lib/i18n/dictionaries/en"
import { LocalizationProvider } from "@/app/lib/i18n/provider"

function markup(node: GraphViewNode) {
  return renderToStaticMarkup(
    <LocalizationProvider locale="en" dictionary={en}>
      <GraphNodeInspectorMetadata node={node} />
    </LocalizationProvider>
  )
}

function createNode(
  kind: GraphViewNode["kind"],
  label: string,
  metadata: Partial<GraphViewNodeMetadata> = {}
): GraphViewNode {
  return {
    id: `${kind}:1`,
    kind,
    label,
    secondaryLabel: null,
    metadata: {
      slug: null,
      canonicalKey: null,
      symbol: null,
      assetType: null,
      sourceName: null,
      url: null,
      occurredAt: null,
      publishedAt: null,
      status: null,
      narrativeStatus: null,
      confidence: null,
      thesis: null,
      themes: null,
      ...metadata,
    },
  }
}

describe("shared graph inspector metadata", () => {
  it("keeps event time, meaningful status, confidence and theme relationships", () => {
    const html = markup(
      createNode("event", "Rates", {
        occurredAt: "2026-01-15T08:30:00Z",
        status: "ENRICHED",
        confidence: 0.92,
        themes: [{ title: "Inflation", relationType: "PRIMARY_THEME" }],
      })
    )
    expect(html).toContain("08:30")
    expect(html).not.toContain("ENRICHED")
    expect(html).toContain("92%")
    expect(html).toContain("Inflation")
    expect(html).toContain("Primary theme")
  })

  it("does not show raw pipeline codes or absent values", () => {
    const html = markup(
      createNode("event", "Rates", { status: "ENRICHED", confidence: null })
    )
    expect(html).not.toContain("ENRICHED")
    expect(html).not.toContain("NaN")
    expect(html).not.toContain("<dt")
  })

  it("avoids repeated asset symbols and keeps article and narrative fields", () => {
    const asset = markup(
      createNode("asset", "TSLA", { symbol: " tsla ", assetType: "EQUITY" })
    )
    expect(asset).not.toContain(en.graphView.inspector.symbol)
    expect(asset).toContain("EQUITY")
    const article = markup(
      createNode("news-article", "Report", {
        sourceName: "Reuters",
        publishedAt: "2026-01-15T12:45:00Z",
      })
    )
    expect(article).toContain("Reuters")
    expect(article).toContain("12:45")
    const narrative = markup(
      createNode("narrative", "Outlook", {
        thesis: "Rates may fall",
        narrativeStatus: "ACTIVE",
      })
    )
    expect(narrative).toContain("Rates may fall")
    expect(narrative).toContain("ACTIVE")
  })
})
