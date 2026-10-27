"use client"

import { Calendar } from "lucide-react"
import type { ReactNode } from "react"
import {
  getGraphViewRelationLabel,
  type GraphViewNode,
} from "@/app/lib/graph-view/definitions"
import { useLocalization } from "@/app/lib/i18n/provider"
import { AppTimeMetadata } from "@/components/app-time-metadata"

type LocalizationContext = ReturnType<typeof useLocalization>
const GRAPH_INSPECTOR_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
}

function formatInspectorDate(
  value: string | null | undefined,
  localization: LocalizationContext
) {
  const formatted = localization.formatDateTime(
    value,
    GRAPH_INSPECTOR_DATE_TIME_OPTIONS,
    ""
  )

  return formatted || null
}

function formatInspectorConfidence(
  value: number | null | undefined,
  localization: LocalizationContext
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null
  }

  const normalizedValue = value <= 1 ? value : value / 100

  return localization.formatPercent(normalizedValue, {
    maximumFractionDigits: 0,
  })
}

function getInspectorText(value: string | null | undefined) {
  const trimmedValue = value?.trim()

  return trimmedValue || null
}

function getThemeMetadataItems(
  metadata: GraphViewNode["metadata"],
  dictionary: LocalizationContext["dictionary"]
) {
  return (
    metadata?.themes
      ?.map((theme, index) => {
        const title = getInspectorText(theme.title)

        if (!title) {
          return null
        }

        const relationLabel = theme.relationType
          ? getGraphViewRelationLabel(theme.relationType, dictionary)
          : null

        return {
          key: `${theme.relationType ?? "theme-metadata"}-${title}-${index}`,
          relationLabel,
          title,
        }
      })
      .filter(
        (
          theme
        ): theme is {
          key: string
          relationLabel: string | null
          title: string
        } => theme !== null
      ) ?? []
  )
}

function formatThemeMetadataValue(
  themes: Array<{ relationLabel: string | null; title: string }>
) {
  return themes
    .map((theme) =>
      theme.relationLabel
        ? `${theme.title} (${theme.relationLabel})`
        : theme.title
    )
    .join(", ")
}

function GraphThemeMetadataList({
  themes,
}: {
  themes: Array<{ key: string; relationLabel: string | null; title: string }>
}) {
  return (
    <div className="flex flex-col gap-1">
      {themes.map((theme) => (
        <span
          key={theme.key}
          className="min-w-0 text-xs font-medium text-foreground"
        >
          <span className="break-words">{theme.title}</span>
          {theme.relationLabel ? (
            <span className="ml-1 text-muted-foreground">
              {theme.relationLabel}
            </span>
          ) : null}
        </span>
      ))}
    </div>
  )
}

function getMeaningfulInspectorStatus(value: string | null | undefined) {
  const trimmedValue = getInspectorText(value)

  if (!trimmedValue || /^[A-Z0-9_]+$/.test(trimmedValue)) {
    return null
  }

  return trimmedValue
}

type GraphNodeInspectorFieldDefinition = {
  key: string
  label: string
  value?: string | null
  valueNode?: ReactNode
}

function GraphNodeInspectorField({
  label,
  value,
  valueNode,
}: {
  label: string
  value?: string | null
  valueNode?: ReactNode
}) {
  if (!value && !valueNode) {
    return null
  }

  return (
    <div className="min-w-0 rounded-lg border border-border/60 bg-background/55 px-2.5 py-2">
      <dt className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 min-w-0" title={value ?? undefined}>
        {valueNode ?? (
          <span className="block truncate text-xs font-medium text-foreground">
            {value}
          </span>
        )}
      </dd>
    </div>
  )
}

function getGraphNodeInspectorFields({
  confidence,
  dictionary,
  metadata,
  node,
  occurredAt,
  publishedAt,
}: {
  confidence: string | null
  dictionary: LocalizationContext["dictionary"]
  metadata: GraphViewNode["metadata"]
  node: GraphViewNode
  occurredAt: string | null
  publishedAt: string | null
}) {
  const eventStatus = getMeaningfulInspectorStatus(metadata?.status)
  const narrativeStatus = getInspectorText(metadata?.narrativeStatus)
  const sourceName = getInspectorText(metadata?.sourceName)
  const assetType = getInspectorText(metadata?.assetType)
  const thesis = getInspectorText(metadata?.thesis)
  const symbol = getInspectorText(metadata?.symbol)
  const themeItems = getThemeMetadataItems(metadata, dictionary)
  const themeValue = formatThemeMetadataValue(themeItems)
  const themeField: GraphNodeInspectorFieldDefinition | null =
    themeItems.length > 0
      ? {
          key: "themes",
          label: dictionary.graphView.inspector.themes,
          value: themeValue,
          valueNode: <GraphThemeMetadataList themes={themeItems} />,
        }
      : null
  const showSymbol =
    symbol && symbol.toLowerCase() !== node.label.trim().toLowerCase()

  if (node.kind === "event") {
    const fields: GraphNodeInspectorFieldDefinition[] = [
      {
        key: "occurred-at",
        label: dictionary.graphView.inspector.time,
        value: occurredAt,
        valueNode: occurredAt ? (
          <AppTimeMetadata icon={Calendar}>{occurredAt}</AppTimeMetadata>
        ) : undefined,
      },
      {
        key: "confidence",
        label: dictionary.graphView.inspector.confidence,
        value: confidence,
      },
      {
        key: "status",
        label: dictionary.graphView.inspector.status,
        value: eventStatus,
      },
    ]

    if (themeField) {
      fields.push(themeField)
    }

    return fields
  }

  if (node.kind === "news-article") {
    return [
      {
        key: "news-outlet",
        label: dictionary.graphView.inspector.newsOutlet,
        value: sourceName,
      },
      {
        key: "published-at",
        label: dictionary.graphView.inspector.publishedAt,
        value: publishedAt,
        valueNode: publishedAt ? (
          <AppTimeMetadata icon={Calendar}>{publishedAt}</AppTimeMetadata>
        ) : undefined,
      },
      {
        key: "confidence",
        label: dictionary.graphView.inspector.confidence,
        value: confidence,
      },
    ]
  }

  if (node.kind === "asset") {
    return [
      {
        key: "symbol",
        label: dictionary.graphView.inspector.symbol,
        value: showSymbol ? symbol : null,
      },
      {
        key: "asset-type",
        label: dictionary.graphView.inspector.assetType,
        value: assetType,
      },
    ]
  }

  if (node.kind === "narrative") {
    const fields: GraphNodeInspectorFieldDefinition[] = [
      {
        key: "thesis",
        label: dictionary.graphView.inspector.thesis,
        value: thesis,
        valueNode: thesis ? (
          <span className="line-clamp-4 text-xs font-medium text-foreground">
            {thesis}
          </span>
        ) : undefined,
      },
      {
        key: "narrative-status",
        label: dictionary.graphView.inspector.narrativeStatus,
        value: narrativeStatus,
      },
      {
        key: "confidence",
        label: dictionary.graphView.inspector.confidence,
        value: confidence,
      },
    ]

    if (themeField) {
      fields.push(themeField)
    }

    return fields
  }

  return []
}

export function GraphNodeInspectorMetadata({ node }: { node: GraphViewNode }) {
  const localization = useLocalization()
  const metadata = node.metadata ?? {}
  const inspectorFields = getGraphNodeInspectorFields({
    node,
    metadata,
    dictionary: localization.dictionary,
    confidence: formatInspectorConfidence(metadata.confidence, localization),
    occurredAt: formatInspectorDate(metadata.occurredAt, localization),
    publishedAt: formatInspectorDate(metadata.publishedAt, localization),
  })
  return (
    <dl className="flex flex-col gap-2">
      {inspectorFields.map((field) => (
        <GraphNodeInspectorField
          key={field.key}
          label={field.label}
          value={field.value}
          valueNode={field.valueNode}
        />
      ))}
    </dl>
  )
}
