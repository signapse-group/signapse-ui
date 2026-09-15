import type { AppLocale } from "@/app/lib/i18n/config"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"

export const TELEGRAM_DEMO_DURATION = 9
export const TELEGRAM_DEMO_TIMING = {
  start: 0,
  assetOpen: 1.05,
  assetSelected: 1.65,
  timeOpen: 2.3,
  timeSelected: 2.85,
  languageOpen: 3.5,
  languageSelected: 4.05,
  submit: 4.9,
  scheduled: 5.1,
  running: 5.4,
  preview: 6.7,
} as const

export type TelegramDemoPhase = keyof typeof TELEGRAM_DEMO_TIMING
const frames = Object.entries(TELEGRAM_DEMO_TIMING).map(([phase, at]) => ({
  phase: phase as TelegramDemoPhase,
  at,
}))

export function getTelegramDemoFrame(seconds: number) {
  return frames.findLast((frame) => seconds >= frame.at) ?? frames[0]
}

export type TelegramDemoFrame = ReturnType<typeof getTelegramDemoFrame>
export const TELEGRAM_DEMO_FINAL_FRAME = getTelegramDemoFrame(
  TELEGRAM_DEMO_DURATION
)

const cursorStops = [
  { at: 0, target: "entry" },
  { at: 0.8, target: "asset" },
  { at: 1.1, target: "asset" },
  { at: 1.45, target: "asset-option" },
  { at: 1.8, target: "asset-option" },
  { at: 2.15, target: "time" },
  { at: 2.35, target: "time" },
  { at: 2.65, target: "time-option" },
  { at: 3, target: "time-option" },
  { at: 3.35, target: "language" },
  { at: 3.55, target: "language" },
  { at: 3.85, target: "language-option" },
  { at: 4.2, target: "language-option" },
  { at: 4.75, target: "submit" },
  { at: TELEGRAM_DEMO_DURATION, target: "submit" },
] as const

// All visual effects are derived from the same clock, including click feedback.
export function getTelegramDemoCursor(seconds: number) {
  const index = cursorStops.findIndex((stop) => stop.at > seconds)
  const end =
    cursorStops[index < 0 ? cursorStops.length - 1 : Math.max(1, index)]
  const start =
    cursorStops[index < 0 ? cursorStops.length - 2 : Math.max(0, index - 1)]
  const fraction = Math.max(
    0,
    Math.min(1, (seconds - start.at) / (end.at - start.at))
  )
  const progress = fraction * fraction * (3 - 2 * fraction)
  const click = [0.9, 1.55, 2.2, 2.75, 3.4, 3.95, 4.9].find(
    (at) => seconds >= at && seconds <= at + 0.2
  )

  return {
    from: start.target,
    to: end.target,
    progress,
    scale:
      click === undefined
        ? 1
        : 1 - 0.12 * Math.sin(((seconds - click) / 0.2) * Math.PI),
    opacity:
      seconds >= TELEGRAM_DEMO_TIMING.running ? 0 : Math.min(1, seconds / 0.25),
  }
}

export function getTelegramDemoMessage(
  labels: Dictionary["landing"]["showcase"]["telegram"],
  state: { asset: string; sendTime: string; outputLanguage: AppLocale }
) {
  const templates = labels.messageTemplates[state.outputLanguage]
  const language =
    state.outputLanguage === "vi"
      ? labels.languageVietnamese
      : labels.languageEnglish
  const values = {
    asset: state.asset,
    time: state.sendTime,
    timezone: labels.timezone,
    language,
  }
  const format = (template: string) =>
    Object.entries(values).reduce(
      (result, [key, value]) => result.replaceAll(`{${key}}`, value),
      template
    )

  return {
    title: format(templates.title),
    prepared: format(templates.prepared),
    action: templates.action,
    meta: format(labels.messageMeta),
  }
}
