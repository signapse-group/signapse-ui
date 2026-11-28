---
name: code-review
description: Rà soát độc lập và bàn giao FE khi WORKFLOW.md gọi skill trong phiên Symphony In Review.
---

# Rà soát mã nguồn

Chỉ bắt đầu khi prompt [workflow](../../../WORKFLOW.md) của Symphony gọi skill trong phiên In Review. Ngoài phiên được giao, áp dụng hướng dẫn repo cho tác vụ hiện tại. Dùng quyền của phiên In Review, đọc [chuẩn review](../../../CONTRIBUTING.md#review-standards).

## Chốt đầu vào

Xác định ticket hoặc yêu cầu đã chốt, base và SHA của `HEAD`. Với PR, dùng nhánh đích thực tế, hoặc base do người dùng chỉ định. Chỉ hỏi khi không thể xác định rõ base hoặc nguồn yêu cầu.

Đọc yêu cầu đã chốt và tài liệu tham chiếu hiện hành. Xác định phạm vi từ diff đã commit giữa base hoặc merge-base đã xác định và `HEAD`, diff đã stage và chưa stage, cùng đầu ra liên quan chưa được Git theo dõi. Chỉ loại thay đổi khi có căn cứ rõ về phạm vi sở hữu. Ghi đầu vào còn thiếu hoặc phần việc chưa xác định được trước khi đánh giá.

Trong phiên Symphony, khi bắt đầu, resume và trước mutation hoặc bàn giao, đọc lại Subtask, parent, comment đã chốt, tài liệu tham chiếu và native dependencies qua `jira_rest`. Phân trang comment liên quan và dùng ADF cho body REST v3. Giữ [dependencies envelope](../../../CONTRIBUTING.md#reading-jira-dependencies). Xác nhận trạng thái live In Review, project/type/parent, route và owner của đầu ra. Dừng và giữ đầu ra hiện có nếu assignment nằm ngoài quyền của phiên. Native prerequisite `is blocked by` chỉ đạt khi Jira status category là `done`. Xem prerequisite chưa đọc được, còn mơ hồ hoặc thuộc category đang hoạt động là chưa đạt.

Trong phiên Symphony, đối chiếu PR, base/head, branch/workspace, đầu ra, checks, review và trạng thái delivery đã lưu. Khi resume, dùng lại review độc lập còn hiệu lực và đánh giá lại phần chịu ảnh hưởng bởi fix, thay đổi head hoặc contract, hay tác động cụ thể từ base. Nếu PR đã merge mà thiếu review hợp lệ, đánh giá candidate đã được merge.

## Giao hai trục song song

Khi cần đánh giá candidate hoặc phần bị ảnh hưởng, khởi tạo hai subagent chỉ đọc trước khi chờ kết quả. Giao một trục cho mỗi subagent.

- **Đáp ứng yêu cầu** (Requirement adherence). Dùng [checklist Requirement](references/requirement-checklist.md).
- **Tính đúng đắn và tuân thủ chuẩn** (Correctness & Standards). Dùng [checklist Code](references/code-checklist.md). Khi thay đổi có thể ảnh hưởng giao diện, kể cả qua mã dùng chung, dùng thêm [checklist UI](references/ui-checklist.md).

Gửi cùng nguồn yêu cầu, base, `HEAD`, phạm vi thay đổi, bằng chứng sẵn có và đường dẫn checklist tương ứng. Yêu cầu mỗi subagent đọc hướng dẫn repo và đánh giá các mục thuộc trục được giao từ bằng chứng gốc. Giới hạn subagent ở việc khảo sát và trả kết quả cho reviewer chính trong phiên này.

Mỗi subagent phân loại phát hiện theo bước [đối chiếu và kết luận](#đối-chiếu-và-kết-luận) trước khi chấm. Trả một dòng cho mỗi mục thuộc trục được giao, gồm tên mục, trạng thái `Đạt`, `Không đạt`, `Thiếu bằng chứng` hoặc `Không áp dụng`, và đường dẫn tới bằng chứng hoặc lý do. Dùng `Không áp dụng` cho mục nằm ngoài phạm vi có căn cứ. Dùng `Thiếu bằng chứng` cho mục trong phạm vi chưa đủ căn cứ kết luận. Với phát hiện cần sửa, nêu vị trí, tác động và kết quả tối thiểu cần đạt. Nếu công cụ subagent không khả dụng hoặc một lượt trả kết quả không đủ, reviewer chính trực tiếp hoàn tất phần còn thiếu theo cùng checklist.

## Đối chiếu và kết luận

Reviewer chính trong phiên Review đọc trực tiếp các nguồn cần thiết để xác nhận kết luận của cả hai trục, xử lý kết quả mâu thuẫn và áp dụng [quy tắc chọn phép kiểm và dùng lại bằng chứng](../../../CONTRIBUTING.md#test-ownership-and-selection) khi còn thiếu bằng chứng hoặc khi đánh giá bản sửa. Nêu rõ nếu điều kiện review độc lập chưa được đáp ứng.

Trước khi chấm `Không đạt`, đối chiếu hành vi ở base và `HEAD` đủ để xác định tác động của PR, kể cả qua caller. Ghi bằng chứng cho thấy PR tạo ra hoặc làm nặng thêm sai lệch, hoặc yêu cầu đã chốt giao xử lý sai lệch có sẵn. Nêu đầu ra bắt buộc của PR bị cản và lý do phải xử lý ở pha hiện tại. Ghi riêng sai lệch baseline ngoài phạm vi và việc cần làm ở pha sau, kèm owner. Reviewer chính kiểm lại căn cứ này cho từng phát hiện chặn bàn giao trước khi dùng verdict của subagent.

Báo cáo riêng kết luận của hai trục, kèm base, `HEAD`, phần đầu ra đã kiểm tra, phát hiện chặn bàn giao, góp ý tùy chọn và bằng chứng còn thiếu. Chỉ mục bắt buộc trong phạm vi pha hiện tại có kết quả `Không đạt` hoặc thiếu bằng chứng bắt buộc mới giữ trục ở trạng thái chưa đạt. Trả kết quả theo [chuẩn review](../../../CONTRIBUTING.md#review-standards).

## Symphony review and delivery

Continue here only with the In Review grant. Use both review verdicts, blocking findings and evidence gaps to choose the next action. Verify [required PR build checks](../../../CONTRIBUTING.md#required-pr-build-checks) for the assessed head. Pending QA or owner acceptance and coordinator-owned metadata alone do not block an otherwise complete contribution review. Report any concrete receiver actions.

### Return required fixes

For blocking findings, conflicts or in-scope required check gaps, durably save/read back actionable PR feedback tied to the assessed candidate:

```text
Cần sửa:
- <vị trí hoặc check/evidence>: <vấn đề và ảnh hưởng> → <kết quả cần đạt>.
```

Keep detailed findings at the PR/evidence. Use Jira comments for uncertain access, linkage, candidate identity or separate owner action. Preserve other authors' records and old evidence under [record ownership standards](../../../CONTRIBUTING.md#decisions-and-evidence). Optional suggestions do not block. Return unclear requirements to their owner.

Reread live contract/status/routing/dependencies, resolve the destination from native transitions and transition/read back In Review → Progress after required feedback is saved/read back. End the Review session. Implement resumes existing output, without resetting Ready. Read back ambiguous writes before retry; missing durable feedback/transition access remains an unconfirmed handoff.

### Merge the approved candidate

Only a candidate passing both review axes and applicable checks proceeds. Reread live assignment, approved PR/head, checks, base dev, open/non-draft state and mergeability. Pending mergeability permits three reads with 5/10-second backoff. With verified `PR` and `HEAD_SHA`, use the worker's existing `gh` CLI:

```sh
gh pr merge "$PR" --repo signapse-group/signapse-ui --merge --match-head-commit "$HEAD_SHA"
gh pr view "$PR" --repo signapse-group/signapse-ui --json state,url,headRefOid,mergeCommit
```

No admin bypass. Read back ambiguous writes before retry; MERGED and actual merge SHA confirm merge. An already merged candidate proceeds through reconciliation/delivery. Conflicts and in-scope code fixes return Progress; an accepted fix after merge uses a follow-up PR from current dev with old evidence retained.

### Verify the delivered build

For app delivery, require a verified live revision on **https://dev-dashboard.signapse.cloud** containing the contribution, with successful dev quality checks. Owner/QA verifies website, auth and features; these are not FE developer delivery gates. Deployment confirmation does not certify website behavior or later rollbacks.

Read [CI/Vercel technical setup](../../../docs/delivery.md#ci-and-vercel-setup) when setup evidence is needed. Local configuration does not prove hosting activation. Required developer delivery evidence connects the reviewed candidate to the actual merge and deployed build. Overall green CI, merge or a health check alone is insufficient.

After merge, select the dev Verify push run for a SHA containing that merge. Save merge/run/build identity, start time, absolute deadline (30 minutes per tracked run) and retry counter in an existing durable owned delivery record before waiting. Reuse them across restart/resume; neither reconnect nor rerun resets the budget. Require its actual `check` job to succeed:

```sh
gh run watch "$VERIFY_RUN" --repo signapse-group/signapse-ui --interval 30 --exit-status
gh run view "$VERIFY_RUN" --repo signapse-group/signapse-ui --json headSha,status,conclusion,jobs,url
```

Then run the existing verifier from the FE workspace, using the actual full merge SHA from the merged PR. On the Linux worker, cap the process with the remaining saved budget:

```sh
remaining_seconds=$((DELIVERY_WAIT_DEADLINE_EPOCH - $(date +%s)))
test "$remaining_seconds" -gt 0
timeout "${remaining_seconds}s" /opt/apps/symphony/runtime/run-fe-deploy "$PWD" "$MERGE_SHA"
```

`DELIVERY_WAIT_DEADLINE_EPOCH` comes from the saved absolute deadline; do not create a new deadline when starting the verifier. Bound `gh run watch` by that same remaining deadline. Use short tool yields, checking the same terminal every 30–60 seconds during quiet waits. A tool disconnect/timeout is not deployment failure; reread live state and reconnect only within the remaining budget. Do not end merely to obtain a new scheduler attempt/deadline.

Use the [deployment verifier reference](../../../docs/delivery.md#confirm-live-dev-revision) for prerequisites, candidate validation, polling and read-retry behavior. Its per-invocation timeout does not reset the saved deadline. A skipped/canceled check, overall green CI or merge alone is insufficient. Require verifier exit code 0 and PASS. The verifier checks dev quality success for the actual deployed SHA. Save its merge/deployed SHA, environment/URL and confirmation time with the corresponding Actions quality-run link in existing PR/delivery evidence before handoff. Take the deployed SHA from the verifier. A confirmed containing descendant may satisfy delivery.

Docs-only output uses artifact location/version, review and applicable checks rather than mandatory app deployment. Runtime/workflow output still needs activation evidence when the accepted assignment requires it; source edits alone do not establish worker adoption.

### Recovery and external blockers

Pending delivery within budget stays In Review. Reread the specific run/deployment before retry or when the deadline expires. In-scope code/build/check defects return Progress with saved actionable feedback. Temporary infrastructure failure permits at most two reruns, with reasons/counters saved and the original deadline retained. No autonomous infrastructure repair or rollback is granted.

If required evidence remains unavailable due to an external input/access/decision or exhausted recovery, apply the [shared blocker gate](../../../CONTRIBUTING.md#blockers-and-resume). Expiry alone is not a blocker. When the gate is met, save/read back the consolidated record, resolve/read back In Review → Blocked and end the session. Preserve the review, deployment identity, deadline/counters and verified evidence for an authorized resume.

### Delivery handoff and Done

When every applicable gate is satisfied, save/read back the assigned Subtask's short delivery handoff before transition. Omit inapplicable lines:

```text
Đã bàn giao trên <môi trường>: <build/revision đã xác minh>.
Delivery: <link evidence nối contribution với build và các gate áp dụng>.
Lưu ý: <điểm ảnh hưởng trực tiếp integration/test — chỉ khi có>.
Cần <owner>: <hành động cụ thể — chỉ khi có>.
```

Use artifact location/version and verification for output without app deployment. For application delivery, state which FE checks passed and which live checks the receiving QA/coordinator owns. Keep detailed review, commands/CI run IDs and candidate/merge/deployed-build relation in linked evidence; Jira keeps coordination/actions, not duplicate reports. For API output, distinguish FE output from producer revision/environment/publication and pending integration. For Bug fixes, connect the addressed Bug and QA run/report to the delivered source/build/environment and corrected coverage; dev checks do not close the Bug or replace QA retest.

Reread live contract/status/routing/dependencies and verify review, required PR checks/Preview, merge, applicable dev/deployment or artifact/activation gates, and saved/read-back handoff. Resolve live In Review → Done, transition/read back and end the session. Done confirms the contribution and its required delivery, independently of QA/product/parent acceptance. New work after Done needs a new coordinator-assigned contribution.
