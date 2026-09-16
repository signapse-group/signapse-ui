import type { RefObject } from "react"
import {
  ArrowUpIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  LoaderCircleIcon,
  MaximizeIcon,
  MessageSquareTextIcon,
  MousePointer2Icon,
  PenLineIcon,
  XIcon,
} from "lucide-react"

import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import {
  AI_CONVERSATION_DEMO_DURATION,
  AI_CONVERSATION_DEMO_FINAL_FRAME,
  AI_CONVERSATION_CURSOR_MOVE_DURATION,
  AI_CONVERSATION_DEMO_TIMING as timing,
  getAiConversationPromptText,
  type AiConversationDemoFrame,
} from "./landing-ai-conversation-demo-model"
import { LandingDemoBrowserChrome } from "./landing-demo-browser-chrome"
import styles from "./landing-feature-showcase.module.css"

type Labels = Dictionary["landing"]["showcase"]["aiConversation"]
type ProcessState = "pending" | "active" | "complete"

export function LandingAiConversationWindow({
  labels,
  frame = AI_CONVERSATION_DEMO_FINAL_FRAME,
  seconds = AI_CONVERSATION_DEMO_DURATION,
  animated = false,
  transcriptRef,
}: {
  labels: Labels
  frame?: AiConversationDemoFrame
  seconds?: number
  animated?: boolean
  transcriptRef?: RefObject<HTMLDivElement | null>
}) {
  const at = animated ? frame.at : AI_CONVERSATION_DEMO_DURATION
  const visible = (phase: keyof typeof timing) =>
    !animated || at >= timing[phase]
  const complete = visible("complete")
  const submitted = visible("submitted")
  const cursorClicking =
    animated && seconds >= timing.cursorClick && seconds < timing.submitted
  const cursorFraction = animated
    ? Math.max(
        0,
        Math.min(
          1,
          (seconds - timing.cursorMove) / AI_CONVERSATION_CURSOR_MOVE_DURATION
        )
      )
    : 0
  const cursorProgress =
    cursorFraction * cursorFraction * (3 - 2 * cursorFraction)
  const cursorX = 50 + (94 - 50) * cursorProgress
  const cursorY = 50 + (91 - 50) * cursorProgress
  const promptText = animated
    ? getAiConversationPromptText(labels.prompt, seconds)
    : ""
  const processStates: ProcessState[] = [
    visible("compare") ? "complete" : visible("context") ? "active" : "pending",
    visible("crossCheck")
      ? "complete"
      : visible("compare")
        ? "active"
        : "pending",
    visible("answer")
      ? "complete"
      : visible("crossCheck")
        ? "active"
        : "pending",
    visible("evidence") ? "complete" : visible("answer") ? "active" : "pending",
  ]
  const processItems = [
    [labels.stepOneLabel, labels.stepOneBody],
    [labels.stepTwoLabel, labels.stepTwoBody],
    [labels.stepThreeLabel, labels.stepThreeBody],
    [labels.stepFourLabel, labels.stepFourBody],
  ] as const

  return (
    <div
      className={styles.aiConversationDemo}
      data-ai-conversation-state={animated ? frame.phase : "complete"}
      data-demo-mode={animated ? "automatic" : "static"}
      data-demo-renderer={animated ? "motion" : "static"}
      aria-label={labels.stageLabel}
      inert
    >
      <LandingDemoBrowserChrome labels={labels} />

      <div className={styles.aiConversationCanvas}>
        <section className={styles.aiChatWindow}>
          <header className={styles.aiChatHeader}>
            <span className={styles.aiChatIdentity}>
              <strong>{labels.prompt}</strong>
              <ChevronDownIcon aria-hidden="true" />
            </span>
            <div className={styles.aiChatActions}>
              <button
                type="button"
                disabled
                className={styles.aiChatAction}
                aria-label={labels.newConversationLabel}
              >
                <PenLineIcon aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled
                className={styles.aiChatAction}
                aria-label={labels.expandLabel}
              >
                <MaximizeIcon aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled
                className={styles.aiChatAction}
                aria-label={labels.closeLabel}
              >
                <XIcon aria-hidden="true" />
              </button>
            </div>
          </header>

          <div className={styles.aiTranscriptFrame}>
            <div
              ref={transcriptRef}
              className={styles.aiTranscript}
              data-ai-transcript
              role="log"
              aria-label={labels.transcriptLabel}
            >
              {submitted ? (
                <article className={styles.aiMessageUser}>
                  <p>{labels.prompt}</p>
                </article>
              ) : null}

              <article
                className={styles.aiMessageAssistant}
                data-visible={visible("context")}
                aria-hidden={!visible("context")}
              >
                <p className={styles.aiMessageRole}>{labels.assistantRole}</p>
                <div className={styles.aiProcessHeader}>
                  <MessageSquareTextIcon aria-hidden="true" />
                  <strong>{labels.processTitle}</strong>
                </div>
                <ol className={styles.aiProcess}>
                  {processItems.map(([title, body], index) => {
                    const state = processStates[index]
                    return (
                      <li key={title} data-state={state}>
                        {state === "complete" ? (
                          <CheckCircle2Icon aria-hidden="true" />
                        ) : state === "active" ? (
                          <LoaderCircleIcon aria-hidden="true" />
                        ) : (
                          <span className={styles.aiProcessDot} />
                        )}
                        <span>
                          <strong>{title}</strong>
                          <small>{body}</small>
                        </span>
                      </li>
                    )
                  })}
                </ol>
              </article>

              <article
                className={styles.aiMessageAssistant}
                data-visible={visible("answer")}
                aria-hidden={!visible("answer")}
              >
                <div className={styles.aiResponseHeading}>
                  <h3>{labels.responseHeading}</h3>
                  <span aria-hidden="true">−</span>
                </div>
                <p className={styles.aiConclusion}>{labels.responseIntro}</p>

                <section className={styles.aiResponseTable}>
                  <p>{labels.tableSource}</p>
                  <div className={styles.aiTableWrap}>
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">{labels.ohlcDateHeader}</th>
                          <th scope="col">{labels.ohlcOpenHeader}</th>
                          <th scope="col">{labels.ohlcHighHeader}</th>
                          <th scope="col">{labels.ohlcLowHeader}</th>
                          <th scope="col">{labels.ohlcCloseHeader}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          [
                            labels.ohlcRowOneDate,
                            labels.ohlcRowOneOpen,
                            labels.ohlcRowOneHigh,
                            labels.ohlcRowOneLow,
                            labels.ohlcRowOneClose,
                          ],
                          [
                            labels.ohlcRowTwoDate,
                            labels.ohlcRowTwoOpen,
                            labels.ohlcRowTwoHigh,
                            labels.ohlcRowTwoLow,
                            labels.ohlcRowTwoClose,
                          ],
                          [
                            labels.ohlcRowThreeDate,
                            labels.ohlcRowThreeOpen,
                            labels.ohlcRowThreeHigh,
                            labels.ohlcRowThreeLow,
                            labels.ohlcRowThreeClose,
                          ],
                        ].map((row) => (
                          <tr key={row[0]}>
                            {row.map((value, index) => (
                              <td key={value} data-emphasis={index === 4}>
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section
                  className={styles.aiReveal}
                  data-visible={visible("evidence")}
                  aria-hidden={!visible("evidence")}
                >
                  <h4>{labels.evidenceTitle}</h4>
                  <div className={styles.aiEvidenceGrid}>
                    <div>
                      <strong>{labels.evidenceOneTitle}</strong>
                      <p>{labels.evidenceOneBody}</p>
                    </div>
                    <div>
                      <strong>{labels.evidenceTwoTitle}</strong>
                      <p>{labels.evidenceTwoBody}</p>
                    </div>
                    <div>
                      <strong>{labels.evidenceThreeTitle}</strong>
                      <p>{labels.evidenceThreeBody}</p>
                    </div>
                    <div>
                      <strong>{labels.evidenceFourTitle}</strong>
                      <p>{labels.evidenceFourBody}</p>
                    </div>
                  </div>
                </section>

                <section
                  className={styles.aiReveal}
                  data-visible={visible("scenarios")}
                  aria-hidden={!visible("scenarios")}
                >
                  <h4>{labels.scenariosTitle}</h4>
                  <div className={styles.aiScenarioList}>
                    <div>
                      <strong>{labels.scenarioOneTitle}</strong>
                      <span>{labels.scenarioOneCondition}</span>
                      <p>{labels.scenarioOneBody}</p>
                    </div>
                    <div>
                      <strong>{labels.scenarioTwoTitle}</strong>
                      <span>{labels.scenarioTwoCondition}</span>
                      <p>{labels.scenarioTwoBody}</p>
                    </div>
                    <div>
                      <strong>{labels.scenarioThreeTitle}</strong>
                      <span>{labels.scenarioThreeCondition}</span>
                      <p>{labels.scenarioThreeBody}</p>
                    </div>
                  </div>
                </section>

                <div
                  className={`${styles.aiConfidence} ${styles.aiReveal}`}
                  data-visible={visible("scenarios")}
                  aria-hidden={!visible("scenarios")}
                >
                  <strong>{labels.confidenceLabel}</strong>
                  <span>{labels.confidenceValue}</span>
                  <p>{labels.limitationBody}</p>
                </div>
              </article>

              <article
                className={`${styles.aiMessageUser} ${styles.aiReveal}`}
                data-visible={complete}
                aria-hidden={!complete}
              >
                <p>{labels.followUpPrompt}</p>
              </article>

              <article
                className={`${styles.aiMessageAssistant} ${styles.aiReveal}`}
                data-visible={complete}
                aria-hidden={!complete}
              >
                <p>{labels.followUpAnswer}</p>
              </article>
            </div>
          </div>

          <footer
            className={styles.aiComposer}
            data-typing={animated && !submitted}
          >
            <textarea
              rows={2}
              disabled
              readOnly
              tabIndex={-1}
              value={animated && !submitted ? promptText : ""}
              aria-label={labels.composerLabel}
              placeholder={labels.composerPlaceholder}
            />
            <div className={styles.aiComposerActions}>
              <button
                type="button"
                disabled
                data-pressed={cursorClicking}
                aria-label={labels.sendLabel}
              >
                <ArrowUpIcon aria-hidden="true" />
              </button>
            </div>
          </footer>
          <span
            className={`${styles.demoCursor} ${styles.aiConversationCursor}`}
            style={{
              left: `${cursorX}%`,
              top: `${cursorY}%`,
              transform: `translate(-50%, -50%) scale(${cursorClicking ? 0.82 : 1})`,
            }}
            aria-hidden="true"
          >
            <MousePointer2Icon fill="currentColor" />
          </span>
        </section>
      </div>
    </div>
  )
}
