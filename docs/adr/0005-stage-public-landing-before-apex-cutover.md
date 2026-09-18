---
status: accepted
---

# Stage the public landing before apex cutover

Signapse will keep the coming-soon site at the public apex while the localized application landing page is tested independently on the application host. After the landing satisfies its release gates, an explicit owner-run cutover will make it the public apex experience while preserving the coming-soon deployment as the initial rollback target; this avoids exposing an unverified landing while still converging on one canonical public surface.

## Consequences

- During preview, the application landing is served from `dev.signapse.cloud` and its metadata uses that origin; preview URLs must not claim the apex canonical before cutover. After cutover, landing metadata uses the `signapse.cloud` apex origin.
- The application-host landing remains publicly reachable for anonymous testing but must emit `noindex` until the apex cutover; the apex landing becomes indexable only after release approval.
- Public origin and indexability are controlled by explicit server-side deployment configuration. A non-indexable deployment with a missing or invalid origin continues to render with `noindex` but omits canonical and language alternates; it never infers them from the hostname. An indexable deployment fails fast unless its origin is exactly `https://signapse.cloud`.
- The landing implementation and the apex cutover are separate deliverables with separate completion criteria.
- Verifying that the request-access mailbox accepts external mail and has a monitoring owner blocks the public cutover, but does not block merging the landing implementation.
- Apex cutover requires successful automated repository gates, real-Clerk anonymous/authenticated CTA verification, mailbox verification, localized visual/accessibility review, and preview metadata/social-card verification.
- The Signapse Product Owner is the designated landing release owner and makes the final cutover decision only after collecting product sign-off for public content and mailbox readiness and engineering sign-off for the technical gates.
- After cutover, `www.signapse.cloud` permanently redirects to the same path and query on the canonical `signapse.cloud` apex host.
- The active coming-soon contract remains valid during testing. The cutover task removes the retired `coming-soon/` source from the working tree, while the previous immutable deployment URL remains available as the rollback target for seven days; after that window the release owner may remove the deployment, and Git retains the source history.
