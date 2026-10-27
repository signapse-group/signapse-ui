# SIGN-211 approved design comparison

The approved List and Create references are attached to [SIGN-189](https://signapse-group.atlassian.net/browse/SIGN-189) and mirrored on [SIGN-211](https://signapse-group.atlassian.net/browse/SIGN-211) as attachments 10047 and 10048.

These dark-mode candidate renders were captured by the P0 browser suite at 1520×1024:

- [List](list-1520x1024.png)
- [Create](create-1520x1024.png)

The list fixture preserves a legacy Groq connection and masked key. Its response omits `taskReferences`, so the UI says “Not provided”; it does not infer the sample task count from legacy model/default-provider fields. The detail view shows the actual zero-reference count. Edit controls are omitted because their ownership belongs to SIGN-200.
