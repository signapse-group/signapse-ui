import type { RefObject } from "react"
import {
  CheckCircle2Icon,
  HistoryIcon,
  LoaderCircleIcon,
  MessageSquareTextIcon,
  PlusIcon,
  SendIcon,
  SparklesIcon,
} from "lucide-react"

import type { Dictionary } from "@/app/lib/i18n/dictionary-types"
import {
  AI_CONVERSATION_DEMO_DURATION,
  AI_CONVERSATION_DEMO_FINAL_FRAME,
  AI_CONVERSATION_DEMO_TIMING as timing,
  type AiConversationDemoFrame,
} from "./landing-ai-conversation-demo-model"
import { LandingDemoBrowserChrome } from "./landing-demo-browser-chrome"
import styles from "./landing-feature-showcase.module.css"

type Labels = Dictionary["landing"]["showcase"]["aiConversation"]
type ProcessState = "pending" | "active" | "complete"

export function LandingAiConversationWindow({
  labels,
  frame = AI_CONVERSATION_DEMO_FINAL_FRAME,
  animated = false,
  transcriptRef,
}: {
  labels: Labels
  frame?: AiConversationDemoFrame
  animated?: boolean
  transcriptRef?: RefObject<HTMLDivElement | null>
}) {
  const at = animated ? frame.at : AI_CONVERSATION_DEMO_DURATION
  const visible = (phase: keyof typeof timing) =>
    !animated || at >= timing[phase]
  const complete = visible("complete")
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
    >
      <LandingDemoBrowserChrome labels={labels} />

      <div className={styles.aiConversationCanvas}>
        <section className={styles.aiChatWindow}>
          <header className={styles.aiChatHeader}>
            <span className={styles.aiChatAvatar} aria-hidden="true">
              <SparklesIcon />
            </span>
            <span className={styles.aiChatIdentity}>
              <strong>{labels.chatTitle}</strong>
              <small>{labels.chatContext}</small>
            </span>
            <span className={styles.aiDemoBadge}>{labels.demoLabel}</span>
            <span className={styles.aiChatStatus} aria-live="polite">
              {complete ? labels.readyLabel : labels.workingLabel}
            </span>
            <span className={styles.aiChatAction} aria-hidden="true">
              <HistoryIcon />
            </span>
            <span className={styles.aiChatAction} aria-hidden="true">
              <PlusIcon />
            </span>
          </header>

          <div
            ref={transcriptRef}
            className={styles.aiTranscript}
            data-ai-transcript
            role="log"
            aria-label={labels.transcriptLabel}
          >
            <article className={styles.aiMessageUser}>
              <p className={styles.aiMessageRole}>{labels.userRole}</p>
              <p>{labels.prompt}</p>
            </article>

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
              <p className={styles.aiMessageRole}>{labels.assistantRole}</p>
              <p className={styles.aiConclusion}>{labels.synthesisBody}</p>

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
              <p className={styles.aiMessageRole}>{labels.userRole}</p>
              <p>{labels.followUpPrompt}</p>
            </article>

            <article
              className={`${styles.aiMessageAssistant} ${styles.aiReveal}`}
              data-visible={complete}
              aria-hidden={!complete}
            >
              <p className={styles.aiMessageRole}>{labels.assistantRole}</p>
              <p>{labels.followUpAnswer}</p>
            </article>
          </div>

          <footer className={styles.aiComposer}>
            <span>{labels.composerPlaceholder}</span>
            <SendIcon aria-hidden="true" />
          </footer>
        </section>
      </div>
    </div>
  )
}
