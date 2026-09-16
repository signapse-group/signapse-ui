"use client"

import { useId, type ReactNode, type Ref } from "react"
import Image from "next/image"
import {
  ActivityIcon,
  BrainCircuitIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronLeftIcon,
  DatabaseIcon,
  LoaderCircleIcon,
  MoreVerticalIcon,
  PaperclipIcon,
  SearchIcon,
  SendIcon,
  SparklesIcon,
} from "lucide-react"
import { AnimatePresence, m } from "motion/react"

import type { AppLocale } from "@/app/lib/i18n/config"
import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { Logo } from "@/components/logo"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Message } from "@/components/ui/message"
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  TELEGRAM_DEMO_TIMING as timing,
  getTelegramDemoMessage,
  type TelegramDemoFrame,
} from "./landing-scheduled-telegram-demo-model"
import styles from "./landing-feature-showcase.module.css"

type TelegramLabels = Dictionary["landing"]["showcase"]["telegram"]

function AnalysisSource({
  icon,
  label,
  value,
  active,
  ready,
}: {
  icon: ReactNode
  label: string
  value: string
  active: boolean
  ready: boolean
}) {
  return (
    <m.li
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: active ? 1 : 0.3, y: 0 }}
      transition={{ duration: 0.25 }}
      data-ready={ready}
    >
      <span className={styles.analysisSourceIcon}>{icon}</span>
      <span className={styles.analysisSourceCopy}>
        <strong>{label}</strong>
        <small>{value}</small>
      </span>
      {ready ? <CheckCircle2Icon /> : <LoaderCircleIcon />}
    </m.li>
  )
}

function AnalysisRunPanel({
  labels,
  frame,
}: {
  labels: TelegramLabels
  frame: TelegramDemoFrame
}) {
  const composed = frame.at >= timing.composing
  const complete = frame.at >= timing.sending
  const showReasoning = frame.at >= timing.reasoning
  const progress =
    frame.at >= timing.composing
      ? 1
      : frame.at >= timing.reasoning
        ? 0.86
        : frame.at >= timing.normalizing
          ? 0.72
          : frame.at >= timing.contextReady
            ? 0.58
            : frame.at >= timing.technicalReady
              ? 0.44
              : frame.at >= timing.priceReady
                ? 0.28
                : 0.12
  const status =
    frame.at >= timing.composing
      ? labels.composing
      : frame.at >= timing.reasoning
        ? labels.reasoning
        : frame.at >= timing.normalizing
          ? labels.normalizing
          : labels.analysisRunning

  return (
    <m.div
      key="analysis"
      className={styles.analysisRun}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.28 }}
    >
      <div className={styles.analysisHeader}>
        <div>
          <span className={styles.analysisEyebrow}>{labels.analysisRun}</span>
          <strong>{complete ? labels.analysisComplete : status}</strong>
        </div>
        <span className={styles.analysisState} data-complete={complete}>
          {complete ? <CheckCircle2Icon /> : <LoaderCircleIcon />}
          {complete ? labels.analysisComplete : labels.analysisRunning}
        </span>
      </div>

      <ul className={styles.analysisSources}>
        <AnalysisSource
          icon={<DatabaseIcon />}
          label={labels.sourcePrice}
          value={labels.priceValue}
          active
          ready={frame.at >= timing.priceReady}
        />
        <AnalysisSource
          icon={<ActivityIcon />}
          label={labels.sourceTechnical}
          value={labels.technicalValue}
          active={frame.at >= timing.priceReady}
          ready={frame.at >= timing.technicalReady}
        />
        <AnalysisSource
          icon={<BrainCircuitIcon />}
          label={labels.sourceContext}
          value={labels.contextValue}
          active={frame.at >= timing.technicalReady}
          ready={frame.at >= timing.contextReady}
        />
      </ul>

      <div className={styles.analysisProgress} data-complete={composed}>
        <m.span
          initial={false}
          animate={{ scaleX: progress }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>
      <p className={styles.analysisCurrentStep}>
        <SparklesIcon />
        {status}
      </p>

      <AnimatePresence initial={false}>
        {showReasoning ? (
          <m.dl
            className={styles.analysisResult}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div>
              <dt>{labels.trendLabel}</dt>
              <dd>{labels.trendValue}</dd>
            </div>
            <div>
              <dt>{labels.keyZoneLabel}</dt>
              <dd>{labels.keyZoneValue}</dd>
            </div>
            <div>
              <dt>{labels.confidenceLabel}</dt>
              <dd>{labels.confidenceValue}</dd>
            </div>
          </m.dl>
        ) : null}
      </AnimatePresence>
    </m.div>
  )
}

// A staged menu stays inside the inert illustration. A real Select popup would
// portal outside it and take focus/scroll while the automatic demo is playing.
function DemoSelect({
  id,
  label,
  target,
  options,
  selected,
  open,
}: {
  id: string
  label: string
  target: string
  options: string[]
  selected: boolean
  open: boolean
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className={styles.demoSelect} data-open={open}>
        <Select
          items={options.map((value) => ({ label: value, value }))}
          value={selected ? options[0] : null}
          open={false}
        >
          <SelectTrigger id={id} className="w-full" data-cursor-target={target}>
            <SelectValue placeholder={label} />
          </SelectTrigger>
        </Select>
        <ul className={styles.demoSelectMenu} data-open={open}>
          {options.map((option, index) => (
            <li
              key={option}
              data-cursor-target={index === 0 ? `${target}-option` : undefined}
              data-selected={index === 0}
            >
              <span>{option}</span>
              {index === 0 ? <CheckIcon /> : null}
            </li>
          ))}
        </ul>
      </div>
    </Field>
  )
}

export function LandingTelegramWindows({
  labels,
  locale,
  frame,
  cursor,
  windowRef,
}: {
  labels: TelegramLabels
  locale: AppLocale
  frame: TelegramDemoFrame
  cursor?: ReactNode
  windowRef?: Ref<HTMLElement>
}) {
  const id = useId()
  const scheduled = frame.at >= timing.scheduled
  const analysisStarted = frame.at >= timing.collecting
  const showMessage = frame.at >= timing.delivered
  const telegramIsTyping =
    frame.at >= timing.composing && frame.at < timing.delivered
  const languageOptions =
    locale === "vi"
      ? [labels.languageVietnamese, labels.languageEnglish]
      : [labels.languageEnglish, labels.languageVietnamese]
  const message = getTelegramDemoMessage(labels, {
    asset: "XAU/USD",
    sendTime: "08:00",
    outputLanguage: locale,
  })

  return (
    <div
      role="img"
      aria-label={`${labels.stageLabel}. ${labels.scheduleName}: XAU/USD, 08:00, ${labels.timezone}, ${languageOptions[0]}. ${message.summary}`}
    >
      <div className={styles.telegramWindows} inert aria-hidden="true">
        <section ref={windowRef} className={styles.signapseWindow}>
          <header className={styles.signapseAppBar}>
            <span className={styles.signapseMark}>
              <Logo width={30} height={30} colorScheme="light" />
            </span>
            <span className={styles.signapseBreadcrumb}>
              Signapse <span>/</span> Telegram
            </span>
            <span className={styles.activeDot}>{labels.enabledStatus}</span>
          </header>
          <AnimatePresence mode="wait" initial={false}>
            {!analysisStarted ? (
              <m.div
                key="schedule"
                className={styles.scheduleSetup}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <div className={styles.signapseFormHeader}>
                  <span className={styles.formIcon}>
                    <CalendarClockIcon />
                  </span>
                  <div>
                    <h3>{labels.formTitle}</h3>
                    <p>{labels.formDescription}</p>
                  </div>
                </div>
                <div className={styles.signapseForm}>
                  <FieldGroup className={styles.demoFieldGroup}>
                    <Field>
                      <FieldLabel htmlFor={`${id}-name`}>
                        {labels.scheduleNameLabel}
                      </FieldLabel>
                      <Input
                        id={`${id}-name`}
                        value={labels.scheduleName}
                        readOnly
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`${id}-destination`}>
                        {labels.destinationLabel}
                      </FieldLabel>
                      <Input
                        id={`${id}-destination`}
                        value={labels.destinationName}
                        readOnly
                      />
                    </Field>
                    <FieldGroup className={styles.demoFieldRow}>
                      <DemoSelect
                        id={`${id}-asset`}
                        label={labels.assetLabel}
                        target="asset"
                        options={["XAU/USD", "BTC/USD"]}
                        selected={frame.at >= timing.assetSelected}
                        open={frame.phase === "assetOpen"}
                      />
                      <DemoSelect
                        id={`${id}-time`}
                        label={labels.timeLabel}
                        target="time"
                        options={["08:00", "18:00"]}
                        selected={frame.at >= timing.timeSelected}
                        open={frame.phase === "timeOpen"}
                      />
                    </FieldGroup>
                    <FieldGroup className={styles.demoFieldRow}>
                      <Field>
                        <FieldLabel htmlFor={`${id}-timezone`}>
                          {labels.timezoneLabel}
                        </FieldLabel>
                        <Input
                          id={`${id}-timezone`}
                          value={labels.timezone}
                          readOnly
                        />
                      </Field>
                      <DemoSelect
                        id={`${id}-language`}
                        label={labels.languageLabel}
                        target="language"
                        options={languageOptions}
                        selected={frame.at >= timing.languageSelected}
                        open={frame.phase === "languageOpen"}
                      />
                    </FieldGroup>
                  </FieldGroup>
                  <div className={styles.signapseFormFooter}>
                    <span className={styles.formStatus}>
                      {scheduled ? <CheckCircle2Icon /> : <CalendarClockIcon />}
                      {scheduled ? labels.scheduledStatus : labels.routeName}
                    </span>
                    <div
                      className={styles.demoSubmit}
                      data-pressed={frame.phase === "submit"}
                    >
                      <Button
                        type="button"
                        size="sm"
                        data-cursor-target="submit"
                      >
                        {scheduled ? (
                          <CheckIcon data-icon="inline-start" />
                        ) : (
                          <CalendarClockIcon data-icon="inline-start" />
                        )}
                        {scheduled
                          ? labels.scheduledStatus
                          : labels.createSchedule}
                      </Button>
                    </div>
                  </div>
                </div>
              </m.div>
            ) : (
              <AnalysisRunPanel labels={labels} frame={frame} />
            )}
          </AnimatePresence>
          {cursor}
        </section>

        <section className={styles.telegramWindow}>
          <header className={styles.telegramAppBar}>
            <ChevronLeftIcon />
            <span className={styles.telegramAvatar}>
              <Image
                src="/images/telegram-logo.svg"
                alt=""
                width={30}
                height={30}
              />
            </span>
            <span className={styles.telegramIdentity}>
              <strong>{labels.destinationName}</strong>
              <small>
                {telegramIsTyping
                  ? labels.telegramTyping
                  : labels.telegramLastSeen}
              </small>
            </span>
            <SearchIcon />
            <MoreVerticalIcon />
          </header>
          <div className={styles.telegramConversation}>
            <span className={styles.telegramDate}>{labels.telegramToday}</span>
            <div className={styles.messageArea}>
              <div
                className={styles.telegramMessage}
                data-visible={showMessage}
              >
                <Message>
                  <Bubble variant="outline">
                    <BubbleContent>
                      <p className={styles.messageTitle}>{message.title}</p>
                      <p className={styles.messageBias}>{message.horizon}</p>
                      <p className={styles.messageSummary}>{message.summary}</p>
                      <div className={styles.messageSection}>
                        <strong>{message.contextTitle}</strong>
                        <span>• {message.supportContext}</span>
                        <span>• {message.pressureContext}</span>
                      </div>
                      <div className={styles.messageSection}>
                        <strong>{message.levelsTitle}</strong>
                        <span>{message.supportLevel}</span>
                        <span>{message.resistanceLevel}</span>
                      </div>
                      <div className={styles.messageSection}>
                        <strong>{message.scenario}</strong>
                        <span className={styles.messagePrice}>
                          {message.entry}
                        </span>
                        <span className={styles.messagePrice}>
                          {message.targets}
                        </span>
                        <span>{message.trigger}</span>
                        <span>{message.invalidation}</span>
                      </div>
                      <p className={styles.messageEvent}>{message.event}</p>
                      <p className={styles.messageRisk}>{message.risk}</p>
                      <p className={styles.messageMeta}>
                        {message.meta} · 08:00
                      </p>
                    </BubbleContent>
                  </Bubble>
                </Message>
              </div>
              <div
                className={styles.telegramTyping}
                data-visible={telegramIsTyping}
              >
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
          <div className={styles.telegramComposer}>
            <PaperclipIcon />
            <span>{labels.telegramMessagePlaceholder}</span>
            <SendIcon />
          </div>
        </section>
        <m.span
          className={styles.analysisPacket}
          initial={false}
          animate={
            frame.phase === "sending"
              ? {
                  opacity: [0, 1, 1, 0],
                  x: ["-90%", "-20%", "20%", "90%"],
                  scale: [0.8, 1, 1, 0.8],
                }
              : { opacity: 0, x: "-75%", scale: 0.8 }
          }
          transition={{
            duration: 1.6,
            ease: "easeInOut",
            times: [0, 0.35, 0.65, 1],
          }}
          aria-hidden="true"
        >
          <Logo width={18} height={18} colorScheme="light" />
        </m.span>
      </div>
    </div>
  )
}
