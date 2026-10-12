---
name: resolving-merge-conflicts
description: "Use when you need to resolve an in-progress git merge/rebase conflict."
---

1. **See the current state** of the merge/rebase. Check git history, and the conflicting files.

2. **Find the primary sources** for each conflict. Understand deeply why each change was made, and what the original intent was. Read the commit messages, check the PRs, check original issues/tickets.

3. **Resolve assigned hunks in Implement.** Preserve both intents within the accepted contract and ownership. If intent/ownership changes acceptance, return that decision to its owner; continue independent work. Reviewer never edits conflicts. Do not abort/reset a human-owned merge without authorization.

4. Discover the project's **automated checks** and run them — typically typecheck, then tests, then format. Fix anything the merge broke.

5. **Finish the authorized merge/rebase.** Stage only resolved contribution-owned files and commit within the grant, preserving unrelated changes. Continue an authorized rebase without discarding other work, then reverify affected checks/review.
