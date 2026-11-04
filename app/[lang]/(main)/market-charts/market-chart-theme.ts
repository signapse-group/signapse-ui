import type {
  CandleTooltipLegendsCustomCallback,
  LineType,
  PolygonType,
} from "klinecharts"

import type { MarketChartTimeframe } from "@/app/lib/market-charts/definitions"

import {
  resolveMarketChartDrawingColor,
  type MarketChartDrawingStyle,
} from "./market-chart-drawing-style"

export type ChartThemeMode = "light" | "dark"

export type MarketChartThemePalette = {
  axis: string
  crosshairBackground: string
  crosshairText: string
  down: string
  drawing: string
  drawingMuted: string
  drawingSelected: string
  grid: string
  noChange: string
  up: string
  volumeDown: string
  volumeNoChange: string
  volumeUp: string
}

export const MARKET_CHART_THEME_PALETTES: Record<
  ChartThemeMode,
  MarketChartThemePalette
> = {
  light: {
    axis: "#737373",
    crosshairBackground: "#171717",
    crosshairText: "#ffffff",
    down: "#dc2626",
    drawing: "#2563eb",
    drawingMuted: "rgba(37, 99, 235, 0.55)",
    drawingSelected: "#1d4ed8",
    grid: "rgba(115, 115, 115, 0.18)",
    noChange: "#737373",
    up: "#14947e",
    volumeDown: "rgba(220, 38, 38, 0.32)",
    volumeNoChange: "rgba(115, 115, 115, 0.28)",
    volumeUp: "rgba(20, 148, 126, 0.35)",
  },
  dark: {
    axis: "#a1a1aa",
    crosshairBackground: "#fafafa",
    crosshairText: "#171717",
    down: "#ef4444",
    drawing: "#60a5fa",
    drawingMuted: "rgba(96, 165, 250, 0.6)",
    drawingSelected: "#93c5fd",
    grid: "rgba(250, 250, 250, 0.1)",
    noChange: "#a1a1aa",
    up: "#14b8a6",
    volumeDown: "rgba(239, 68, 68, 0.32)",
    volumeNoChange: "rgba(161, 161, 170, 0.24)",
    volumeUp: "rgba(20, 184, 166, 0.34)",
  },
}

export function getMarketChartThemePalette(
  mode: ChartThemeMode
): MarketChartThemePalette {
  return MARKET_CHART_THEME_PALETTES[mode]
}

export function resolveChartThemeMode(
  theme: string | undefined
): ChartThemeMode {
  return theme === "dark" ? "dark" : "light"
}

function getCssTextVariable(name: string, fallback: string) {
  if (typeof window === "undefined") {
    return fallback
  }

  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  )
}

export interface CreateChartStylesResult {
  grid: {
    horizontal: {
      color: string
      dashedValue: number[]
      show: boolean
      size: number
      style: LineType
    }
    vertical: {
      color: string
      dashedValue: number[]
      show: boolean
      size: number
      style: LineType
    }
  }
  candle: {
    bar: Record<string, string>
    priceMark: {
      high: { show: boolean }
      low: { show: boolean }
      last: {
        downColor: string
        line: { size: number }
        noChangeColor: string
        text: { family: string; size: number }
        upColor: string
      }
    }
    tooltip: {
      legend: {
        defaultValue: string
        family: string
        template: CandleTooltipLegendsCustomCallback
      }
      title: { family: string; show: boolean }
    }
  }
  indicator: {
    ohlc: Record<string, string>
    tooltip: { legend: { family: string }; title: { family: string } }
    lastValueMark: { text: { family: string } }
  }
  xAxis: {
    axisLine: { color: string; size: number }
    tickText: { color: string; family: string }
  }
  yAxis: {
    axisLine: { color: string; size: number }
    tickText: { color: string; family: string }
  }
  crosshair: {
    horizontal: {
      line: { color: string }
      text: { backgroundColor: string; color: string; family: string }
    }
    vertical: {
      line: { color: string }
      text: { backgroundColor: string; color: string; family: string }
    }
  }
  overlay: { text: { family: string; size: number } }
}

export interface MarketChartLegendFormatters {
  formatDateTime: (
    value: number,
    options?: Intl.DateTimeFormatOptions,
    fallback?: string
  ) => string
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
  notAvailable: string
  pricePrecision: number
  timeframe: MarketChartTimeframe
}

export function formatMarketChartPrice(
  value: number,
  pricePrecision: number | null | undefined,
  formatNumber: MarketChartLegendFormatters["formatNumber"]
) {
  const precision = pricePrecision ?? 4

  return formatNumber(value, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  })
}

function getCandleTimeFormatOptions(
  timeframe: MarketChartTimeframe
): Intl.DateTimeFormatOptions {
  if (timeframe === "1mo") {
    return { year: "numeric", month: "long" }
  }

  if (timeframe === "1d" || timeframe === "1w") {
    return { year: "numeric", month: "long", day: "numeric" }
  }

  return {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
}

export function formatMarketChartVolume(
  value: number,
  formatNumber: MarketChartLegendFormatters["formatNumber"]
) {
  let divisor = 1
  let suffix = ""

  if (value > 1_000_000_000) {
    divisor = 1_000_000_000
    suffix = "B"
  } else if (value > 1_000_000) {
    divisor = 1_000_000
    suffix = "M"
  } else if (value > 1_000) {
    divisor = 1_000
    suffix = "K"
  }

  const formatted = formatNumber(value / divisor, {
    minimumFractionDigits: suffix ? 0 : 2,
    maximumFractionDigits: suffix ? 3 : 2,
  })

  return `${formatted}${suffix}`
}

export function createChartStyles(
  palette: MarketChartThemePalette,
  legendFormatters: MarketChartLegendFormatters,
  neutralizeLastPrice = false
): CreateChartStylesResult {
  const fontFamily = getCssTextVariable("--font-sans", "Geist, sans-serif")
  const timeOptions = getCandleTimeFormatOptions(legendFormatters.timeframe)

  const candleLegendTemplate: CandleTooltipLegendsCustomCallback = ({
    current,
  }) => {
    if (!current) return []

    return [
      {
        title: "time",
        value: legendFormatters.formatDateTime(
          current.timestamp,
          timeOptions,
          legendFormatters.notAvailable
        ),
      },
      {
        title: "open",
        value: formatMarketChartPrice(
          current.open,
          legendFormatters.pricePrecision,
          legendFormatters.formatNumber
        ),
      },
      {
        title: "high",
        value: formatMarketChartPrice(
          current.high,
          legendFormatters.pricePrecision,
          legendFormatters.formatNumber
        ),
      },
      {
        title: "low",
        value: formatMarketChartPrice(
          current.low,
          legendFormatters.pricePrecision,
          legendFormatters.formatNumber
        ),
      },
      {
        title: "close",
        value: formatMarketChartPrice(
          current.close,
          legendFormatters.pricePrecision,
          legendFormatters.formatNumber
        ),
      },
      {
        title: "volume",
        value:
          typeof current.volume === "number" && Number.isFinite(current.volume)
            ? formatMarketChartVolume(
                current.volume,
                legendFormatters.formatNumber
              )
            : legendFormatters.notAvailable,
      },
    ]
  }

  return {
    grid: {
      horizontal: {
        color: palette.grid,
        dashedValue: [4, 4],
        show: true,
        size: 1,
        style: "dashed",
      },
      vertical: {
        color: palette.grid,
        dashedValue: [4, 4],
        show: true,
        size: 1,
        style: "dashed",
      },
    },
    candle: {
      bar: {
        compareRule: "current_open",
        downBorderColor: palette.down,
        downColor: palette.down,
        downWickColor: palette.down,
        noChangeBorderColor: palette.noChange,
        noChangeColor: palette.noChange,
        noChangeWickColor: palette.noChange,
        upBorderColor: palette.up,
        upColor: palette.up,
        upWickColor: palette.up,
      },
      priceMark: {
        high: { show: false },
        low: { show: false },
        last: {
          downColor: neutralizeLastPrice ? palette.axis : palette.down,
          line: { size: 1 },
          noChangeColor: neutralizeLastPrice ? palette.axis : palette.noChange,
          text: { family: fontFamily, size: 10 },
          upColor: neutralizeLastPrice ? palette.axis : palette.up,
        },
      },
      tooltip: {
        legend: {
          defaultValue: legendFormatters.notAvailable,
          family: fontFamily,
          template: candleLegendTemplate,
        },
        title: { family: fontFamily, show: false },
      },
    },
    indicator: {
      ohlc: {
        compareRule: "current_open",
        downColor: palette.volumeDown,
        noChangeColor: palette.volumeNoChange,
        upColor: palette.volumeUp,
      },
      tooltip: {
        legend: { family: fontFamily },
        title: { family: fontFamily },
      },
      lastValueMark: {
        text: { family: fontFamily },
      },
    },
    xAxis: {
      axisLine: { color: palette.grid, size: 1 },
      tickText: { color: palette.axis, family: fontFamily },
    },
    yAxis: {
      axisLine: { color: palette.grid, size: 1 },
      tickText: { color: palette.axis, family: fontFamily },
    },
    crosshair: {
      horizontal: {
        line: { color: palette.axis },
        text: {
          backgroundColor: palette.crosshairBackground,
          color: palette.crosshairText,
          family: fontFamily,
        },
      },
      vertical: {
        line: { color: palette.axis },
        text: {
          backgroundColor: palette.crosshairBackground,
          color: palette.crosshairText,
          family: fontFamily,
        },
      },
    },
    overlay: {
      text: { family: fontFamily, size: 12 },
    },
  }
}

export interface CreateDrawingOverlayStylesResult {
  [key: string]: unknown
  circle: {
    borderColor: string
    borderSize: number
    color: string
    style: PolygonType
  }
  line: { color: string; size: number; style: LineType }
  point: {
    activeBorderColor: string
    activeBorderSize: number
    activeColor: string
    activeRadius: number
    borderColor: string
    borderSize: number
    color: string
    radius: number
  }
  rect: {
    borderColor: string
    borderSize: number
    color: string
    style: PolygonType
  }
  polygon: {
    style: PolygonType
    color: string
    borderColor: string
    borderSize: number
  }
  text: { color: string }
}

export function createDrawingOverlayStyles(
  palette: MarketChartThemePalette,
  style?: MarketChartDrawingStyle
): CreateDrawingOverlayStylesResult {
  const drawingColor = style
    ? resolveMarketChartDrawingColor(style.color)
    : palette.drawing
  const drawingFillColor = `${drawingColor}33`
  const drawingSize = style?.size ?? 1

  return {
    arc: {
      color: drawingColor,
      size: drawingSize,
      style: "solid",
    },
    circle: {
      borderColor: drawingColor,
      borderSize: drawingSize,
      color: drawingFillColor,
      style: "stroke_fill",
    },
    line: {
      color: drawingColor,
      size: drawingSize,
      style: "solid",
    },
    point: {
      activeBorderColor: palette.drawingSelected,
      activeBorderSize: 2,
      activeColor: palette.drawingSelected,
      activeRadius: 4,
      borderColor: palette.drawingMuted,
      borderSize: 1,
      color: drawingColor,
      radius: 3,
    },
    rect: {
      borderColor: drawingColor,
      borderSize: drawingSize,
      color: drawingFillColor,
      style: "stroke_fill",
    },
    polygon: {
      style: "stroke_fill",
      color: drawingFillColor,
      borderColor: drawingColor,
      borderSize: drawingSize,
    },
    text: {
      color: palette.crosshairText,
    },
  }
}
