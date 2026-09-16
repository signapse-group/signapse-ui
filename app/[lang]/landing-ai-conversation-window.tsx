import type { RefObject } from "react"
import {
  ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  LoaderCircleIcon,
  MaximizeIcon,
  MousePointer2Icon,
  PenLineIcon,
  XIcon,
} from "lucide-react"

import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import { Logo } from "@/components/logo"
import {
  AI_CONVERSATION_DEMO_DURATION,
  AI_CONVERSATION_DEMO_FINAL_FRAME,
  AI_CONVERSATION_CURSOR_MOVE_DURATION,
  AI_CONVERSATION_DEMO_TIMING as timing,
  getAiConversationFollowUpStream,
  getAiConversationPresentation,
  getAiConversationPromptText,
  getAiConversationResponseStream,
  getAiConversationTypedText,
  type AiConversationDemoFrame,
} from "./landing-ai-conversation-demo-model"
import { LandingDemoBrowserChrome } from "./landing-demo-browser-chrome"
import styles from "./landing-feature-showcase.module.css"

type Labels = Dictionary["landing"]["showcase"]["aiConversation"]
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
  const submitted = visible("submitted")
  const firstTyping =
    animated && seconds >= timing.typing && seconds < timing.submitted
  const followUpTyping =
    animated &&
    seconds >= timing.followUpTyping &&
    seconds < timing.followUpSubmitted
  const cursorClicking =
    animated &&
    ((seconds >= timing.cursorClick && seconds < timing.submitted) ||
      (seconds >= timing.followUpCursorClick &&
        seconds < timing.followUpSubmitted))
  const cursorVisible =
    animated &&
    (seconds < timing.submitted ||
      (seconds >= timing.followUpTyping && seconds < timing.followUpSubmitted))
  const followUpCursorCycle = seconds >= timing.followUpTyping
  const cursorMoveStart = followUpCursorCycle
    ? timing.followUpCursorMove
    : timing.cursorMove
  const cursorFraction = animated
    ? Math.max(
        0,
        Math.min(
          1,
          (seconds - cursorMoveStart) / AI_CONVERSATION_CURSOR_MOVE_DURATION
        )
      )
    : 0
  const cursorProgress =
    cursorFraction * cursorFraction * (3 - 2 * cursorFraction)
  // The cursor graphic is centered on these coordinates while its visual
  // hotspot sits near the icon's top-left corner. Aim past the button center
  // so the hotspot lands on the send action.
  const cursorX = 50 + (95.4 - 50) * cursorProgress
  const cursorY = 50 + (95 - 50) * cursorProgress
  const firstPromptText = animated
    ? getAiConversationPromptText(labels.prompt, seconds)
    : ""
  const followUpPromptText = animated
    ? getAiConversationTypedText(
        labels.promptDetail,
        seconds,
        timing.followUpTyping,
        timing.followUpSubmitted
      )
    : ""
  const composerText = followUpTyping ? followUpPromptText : firstPromptText
  const canSubmit = (firstTyping || followUpTyping) && composerText.length > 0
  const timelineSeconds = animated ? seconds : AI_CONVERSATION_DEMO_DURATION
  const presentation = getAiConversationPresentation(timelineSeconds)
  const streamedResponse = animated
    ? getAiConversationResponseStream(
        labels.responseHeading,
        labels.responseIntro,
        seconds
      )
    : {
        heading: labels.responseHeading,
        body: labels.responseIntro,
      }
  const streamedFollowUpResponse = animated
    ? getAiConversationFollowUpStream(
        labels.followUpResponseHeading,
        labels.followUpResponseBody,
        seconds
      )
    : {
        heading: labels.followUpResponseHeading,
        body: labels.followUpResponseBody,
      }
  const thinkingSteps = [
    labels.stepOneLabel,
    labels.stepTwoLabel,
    labels.stepThreeLabel,
  ]
  const thinkingStepIndex = visible("crossCheck")
    ? 2
    : visible("compare")
      ? 1
      : 0
  const followUpThinkingSteps = [
    labels.followUpStepOneLabel,
    labels.followUpStepTwoLabel,
    labels.followUpStepThreeLabel,
  ]
  const followUpThinkingStepIndex = visible("followUpSynthesize")
    ? 2
    : visible("followUpCompare")
      ? 1
      : 0

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
              <strong>
                {submitted ? labels.conversationTitle : labels.newChatTitle}
              </strong>
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
              className={styles.aiWelcome}
              data-visible={!submitted}
              aria-hidden={submitted}
            >
              <Logo width={38} height={38} colorScheme="light" />
              <strong>{labels.welcomeTitle}</strong>
              <p>{labels.welcomeBody}</p>
            </div>
            <div
              ref={transcriptRef}
              className={styles.aiTranscript}
              data-ai-transcript
              role="log"
              aria-label={labels.transcriptLabel}
            >
              {submitted ? (
                <article className={styles.aiMessageUser} data-ai-user-message>
                  <p>{labels.prompt}</p>
                </article>
              ) : null}

              <article
                className={styles.aiMessageAssistant}
                data-visible={presentation.showThinking}
                data-ai-thinking
                aria-hidden={!presentation.showThinking}
              >
                <p className={styles.aiMessageRole}>{labels.assistantRole}</p>
                <ol className={styles.aiThinkingProcess}>
                  {thinkingSteps
                    .slice(0, thinkingStepIndex + 1)
                    .map((step, index) => (
                      <li
                        key={step}
                        className={styles.aiThinkingStep}
                        data-state={
                          index < thinkingStepIndex ? "complete" : "active"
                        }
                      >
                        {index < thinkingStepIndex ? (
                          <CheckIcon aria-hidden="true" />
                        ) : (
                          <LoaderCircleIcon aria-hidden="true" />
                        )}
                        <span>{step}</span>
                      </li>
                    ))}
                </ol>
              </article>

              <article
                className={styles.aiMessageAssistant}
                data-visible={presentation.showResponse}
                data-streaming={presentation.isStreaming}
                data-ai-response
                aria-hidden={!presentation.showResponse}
              >
                <div className={styles.aiResponseHeading}>
                  <h3>{streamedResponse.heading}</h3>
                  <span aria-hidden="true">−</span>
                </div>
                <p className={styles.aiConclusion}>
                  {streamedResponse.body}
                  {presentation.isStreaming ? (
                    <span
                      className={styles.aiStreamCursor}
                      aria-hidden="true"
                    />
                  ) : null}
                </p>

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
                  </div>
                </section>
              </article>

              <article
                className={`${styles.aiMessageUser} ${styles.aiReveal}`}
                data-visible={presentation.showFollowUpUser}
                data-ai-follow-up-user
                aria-hidden={!presentation.showFollowUpUser}
              >
                <p>{labels.promptDetail}</p>
              </article>

              <article
                className={styles.aiMessageAssistant}
                data-visible={presentation.showFollowUpThinking}
                data-ai-follow-up-thinking
                aria-hidden={!presentation.showFollowUpThinking}
              >
                <p className={styles.aiMessageRole}>{labels.assistantRole}</p>
                <ol className={styles.aiThinkingProcess}>
                  {followUpThinkingSteps
                    .slice(0, followUpThinkingStepIndex + 1)
                    .map((step, index) => (
                      <li
                        key={step}
                        className={styles.aiThinkingStep}
                        data-state={
                          index < followUpThinkingStepIndex
                            ? "complete"
                            : "active"
                        }
                      >
                        {index < followUpThinkingStepIndex ? (
                          <CheckIcon aria-hidden="true" />
                        ) : (
                          <LoaderCircleIcon aria-hidden="true" />
                        )}
                        <span>{step}</span>
                      </li>
                    ))}
                </ol>
              </article>

              <article
                className={styles.aiMessageAssistant}
                data-visible={presentation.showFollowUpResponse}
                data-streaming={presentation.isFollowUpStreaming}
                data-ai-follow-up-response
                aria-hidden={!presentation.showFollowUpResponse}
              >
                <div className={styles.aiResponseHeading}>
                  <h3>{streamedFollowUpResponse.heading}</h3>
                  <span aria-hidden="true">−</span>
                </div>
                <p className={styles.aiConclusion}>
                  {streamedFollowUpResponse.body}
                  {presentation.isFollowUpStreaming ? (
                    <span
                      className={styles.aiStreamCursor}
                      aria-hidden="true"
                    />
                  ) : null}
                </p>

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
                    </div>
                    <div>
                      <strong>{labels.scenarioTwoTitle}</strong>
                      <span>{labels.scenarioTwoCondition}</span>
                    </div>
                    <div>
                      <strong>{labels.scenarioThreeTitle}</strong>
                      <span>{labels.scenarioThreeCondition}</span>
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
            </div>
          </div>

          <footer
            className={styles.aiComposer}
            data-typing={firstTyping || followUpTyping}
          >
            <textarea
              rows={2}
              disabled
              readOnly
              tabIndex={-1}
              value={firstTyping || followUpTyping ? composerText : ""}
              aria-label={labels.composerLabel}
              placeholder={
                submitted && !followUpTyping
                  ? labels.composerPlaceholder
                  : labels.initialComposerPlaceholder
              }
            />
            <div className={styles.aiComposerActions}>
              <button
                type="button"
                disabled={!canSubmit}
                data-active={canSubmit}
                data-pressed={cursorClicking}
                aria-label={labels.sendLabel}
              >
                <ArrowUpIcon aria-hidden="true" />
              </button>
            </div>
          </footer>
          <span
            className={`${styles.demoCursor} ${styles.aiConversationCursor}`}
            data-visible={cursorVisible}
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
