"use client"

import { useId, type ReactNode, type Ref } from "react"
import Image from "next/image"
import {
  CalendarClockIcon,
  CheckCircle2Icon,
  CheckIcon,
  ChevronLeftIcon,
  MoreVerticalIcon,
  PaperclipIcon,
  SearchIcon,
  SendIcon,
} from "lucide-react"

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
  const showMessage = frame.phase === "preview"
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
      aria-label={`${labels.stageLabel}. ${labels.scheduleName}: XAU/USD, 08:00, ${labels.timezone}, ${languageOptions[0]}. ${message.prepared} ${message.action}`}
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
                <Input id={`${id}-name`} value={labels.scheduleName} readOnly />
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
                <Button type="button" size="sm" data-cursor-target="submit">
                  {scheduled ? (
                    <CheckIcon data-icon="inline-start" />
                  ) : (
                    <CalendarClockIcon data-icon="inline-start" />
                  )}
                  {scheduled ? labels.scheduledStatus : labels.createSchedule}
                </Button>
              </div>
            </div>
          </div>
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
              <small>{labels.telegramLastSeen}</small>
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
                      <p>{message.prepared}</p>
                      <p>{message.action}</p>
                      <p className={styles.messageMeta}>
                        {message.meta} · 08:00
                      </p>
                    </BubbleContent>
                  </Bubble>
                </Message>
              </div>
              <div
                className={styles.telegramTyping}
                data-visible={frame.phase === "running"}
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
      </div>
    </div>
  )
}
