# SIGN-211 approved design comparison

The approved List and Create references are attached to [SIGN-189](https://signapse-group.atlassian.net/browse/SIGN-189) and mirrored on [SIGN-211](https://signapse-group.atlassian.net/browse/SIGN-211) as attachments 10047 and 10048.

These candidate renders were captured by the P0 browser suite from `codex/SIGN-211-merge-current-main`, based on `5288dd85c51b0dc88c91d2b0736079ff26dfb645`. Both use the approved dark mode, a 1520×1024 CSS viewport at 100% zoom, with the app sidebar expanded:

- [List](list-1520x1024.png)
- [Create](create-1520x1024.png)

The List fixture grants connection read/create and task-configuration read, and preserves a legacy Groq connection with a masked key. Its response omits `taskReferences`, so the UI says “Not provided”; it does not infer the sample task count from legacy model/default-provider fields. The Create image shows the supported OpenAI provider, default endpoint, and one empty draft key. The detail view shows the actual zero-reference count. Edit controls are omitted because their ownership belongs to SIGN-200.
