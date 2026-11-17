# Permission Sync Status

Frontend permission gating is aligned against the backend source of truth in `D:\Github\signapse\docs\permissions.md`.

## Synced modules

- Articles
- Blogs
- Sources
- Economic calendar
- Wiki
- AI provider configs
- Cronjobs
- Roles
- Workspaces

## Pending backend permission definition

The following frontend areas are intentionally left unchanged because the backend permission catalog does not currently define a stable contract for them:

- Topics
- Dashboard / home

## Notes

- Route-level guards return an access denied state before protected screens render.
- Client-side mutation controls are hidden or disabled based on the authenticated user's permission set from `/me`.
- Backend `403 Forbidden` remains the final authority if a user calls protected endpoints directly.
