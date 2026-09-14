import type { AppLocale } from "@/app/lib/i18n/config"

export type LandingProductFeature =
  | "knowledge-graph"
  | "live-charts"
  | "ai-assistant"
  | "telegram"
  | "strategy-coding"

export type LandingProductMediaFeature = Extract<
  LandingProductFeature,
  "knowledge-graph" | "live-charts"
>

export type LandingProductCaptureDescriptor = {
  feature: LandingProductMediaFeature
  locale: AppLocale
  src: string
  width: number
  height: number
  sourceRef: string
  approvalStatus:
    "approved" | "awaiting-source" | "captured" | "awaiting-owner-approval"
}

export type ApprovedLandingProductCapture = LandingProductCaptureDescriptor & {
  approvalStatus: "approved"
}

/**
 * Only captures that have completed the public-data and Product Owner review
 * belong here. Missing entries intentionally keep their chapter text-first.
 */
export const APPROVED_LANDING_PRODUCT_CAPTURES: Record<
  AppLocale,
  Partial<Record<LandingProductMediaFeature, LandingProductCaptureDescriptor>>
> = {
  vi: {
    "knowledge-graph": {
      feature: "knowledge-graph",
      locale: "vi",
      src: "/images/landing/vi/knowledge-graph.webp",
      width: 1550,
      height: 720,
      sourceRef: "user-capture-2026-09-08-knowledge-graph-vi",
      approvalStatus: "approved",
    },
    "live-charts": {
      feature: "live-charts",
      locale: "vi",
      src: "/images/landing/vi/live-market-chart.webp",
      width: 1550,
      height: 742,
      sourceRef: "user-capture-2026-09-08-live-market-chart-vi",
      approvalStatus: "approved",
    },
  },
  en: {
    "knowledge-graph": {
      feature: "knowledge-graph",
      locale: "en",
      src: "/images/landing/en/knowledge-graph.webp",
      width: 1550,
      height: 720,
      sourceRef: "user-capture-2026-09-08-knowledge-graph-en",
      approvalStatus: "approved",
    },
    "live-charts": {
      feature: "live-charts",
      locale: "en",
      src: "/images/landing/en/live-market-chart.webp",
      width: 1550,
      height: 742,
      sourceRef: "user-capture-2026-09-08-live-market-chart-en",
      approvalStatus: "approved",
    },
  },
}

export function getApprovedLandingProductCapture(
  locale: AppLocale,
  feature: LandingProductMediaFeature,
  catalog = APPROVED_LANDING_PRODUCT_CAPTURES
): ApprovedLandingProductCapture | null {
  const capture = catalog[locale][feature]

  return isApprovedCapture(capture) ? capture : null
}

function isApprovedCapture(
  capture: LandingProductCaptureDescriptor | undefined
): capture is ApprovedLandingProductCapture {
  return capture?.approvalStatus === "approved"
}
