---
name: survey-frontend
description: Survey a Symphony FE Subtask in Ready when selected by WORKFLOW.md.
---

# Survey FE in Ready

Start only when the rendered Symphony [workflow](../../../WORKFLOW.md) selects this skill in Ready. Outside that assignment, use the repository instructions for the task. Retain the live Jira `dependencies` envelope under the [shared contract](../../../CONTRIBUTING.md#reading-jira-dependencies).

## Receive and survey

1. At start/resume and before mutations/handoff, read live Subtask/parent, relevant accepted comments, references, native dependencies and existing workspace/output through `jira_rest`. Paginate relevant comments; use ADF for REST v3 bodies. Snapshot status is not live authority. Confirm live Ready, project/type/parent, route and deliverable ownership. Stop if phase/route/ownership changes or the assignment is out of profile; preserve output for its owner.
2. Verify native `is blocked by` dependencies before dependent execution. Jira status category `done` satisfies admission; `Resolved` in an active category does not. Unreadable/ambiguous dependencies remain unsatisfied. Parent readiness, assignee and title prefix do not replace Subtask admission.
3. Trace affected code, callers/consumers, reusable patterns, necessary changes and verification seams. Existing code shows current behavior, not expected behavior. For API work, read [API consumer standards](../../../docs/api-consumer.md) and affected producer contract/publication evidence. For UI work, apply the [UI design gate](../../../docs/design/DESIGN.md#ui-design-gate) to verify the accepted source, fixed constraints and scope FE can complete before handing off to Implement. When the task introduces or changes a UI pattern, [select a UI pattern](#select-a-ui-pattern).
4. For a fix under a Bug, read accepted expected/basis and the latest relevant QA report: case/version, actual result, tested build/environment and assigned regression. A FAIL summary may also contain Blocked/Not Run or a different deviation; survey the assigned fix only.
5. Run existing checks only to answer a concrete question on isolated local data, using [test ownership and selection](../../../CONTRIBUTING.md#test-ownership-and-selection). Apply the [unfinished-ticket wording rule](../../../CONTRIBUTING.md#blockers-and-resume) for legacy verification. Missing QA accounts/results alone do not block Survey. Hand a grounded in-scope baseline failure to Implement. Check the implemented candidate against AC in its assigned phase.
6. Identify the smallest implementation approach and focused acceptance/regression checks. Apply [decision standards](../../../CONTRIBUTING.md#decisions-and-evidence) when an edge-case fix would materially change the user experience. Investigate discoverable facts before escalating unresolved requirements or material decisions to the coordinator. Continue meaningful independent survey while only dependent work waits.

## Select a UI pattern

Find a component or screen in this repo that supports the same interaction and fits the accepted design. For a new composition, choose a specific [shadcn example](https://ui.shadcn.com/docs/components) for Base UI and verify it against the FE wrappers. Consult the [Base UI API](https://base-ui.com/react/overview/quick-start) when primitive behavior needs clarification. If the example covers only part of the interaction, identify the remaining work.

## Record only useful handoff information

Clarify Subtask wording/references only from already accepted requirements. Preserve format, meaning, scope, AC, concurrent content and source decisions; do not edit the parent or copy its contract. Reread before mutation and save/read back required additions.

Before moving to Progress, record each selected UI pattern in the Survey comment on the Subtask. Under `Hướng làm`, cite the local file and symbol or the exact example URL, name the FE wrapper, and state which structure or interaction to reuse and which part FE must supply. For other tasks, comment when technical information must carry into Implement. Separate observations from recommendations, include relevant file/symbol/revision or evidence links, preserve the survey independently of later feedback/delivery records, and omit inapplicable lines:

```text
Hướng làm: <tái sử dụng gì, đổi ở đâu và vì sao — file và symbol hoặc link đến ví dụ cụ thể>.
Cần kiểm chứng: <case hoặc regression trọng tâm và seam dự kiến>.
Đã kiểm tra: <kết quả có ích cho Implement — dẫn evidence>.
Lưu ý: <giới hạn hoặc điểm cần đối soát trước khi sửa>.
```

Follow [record ownership/evidence standards](../../../CONTRIBUTING.md#decisions-and-evidence) and establish ownership before editing. Read back ambiguous writes before retry to avoid duplicates.

## Complete the phase

Before handoff, reread live contract/status/routing/dependencies. Ready → Progress requires a settled contract, matching profile/dependencies, relevant survey, an implementation/verification approach, sufficient UI direction under the local gate, no unanswered required decision, and saved/read-back additions when needed. Missing detailed mockups or an inaccessible detail reference alone do not prevent Progress. Hold only consequential decisions outside FE authority; use the blocker procedure when no meaningful independent work remains. Resolve the transition from the live issue by destination; never hardcode its ID. Transition/read back Progress and end this session for a fresh Implement prompt in the same workspace. No extra ticket or manual Survey approval is required.

## Blocker and resume

Apply the [shared blocker gate](../../../CONTRIBUTING.md#blockers-and-resume) for required Survey inputs after completing independent work. A diagnosed in-scope baseline failure goes to Implement. When the gate is met, save/read back the consolidated record, resolve/read back Ready → Blocked and end the session. The coordinator owns resume.
