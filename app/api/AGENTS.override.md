# API Boundary Instructions

These instructions apply to `app/api/**` and extend the repository-level guidance.

## Ownership And Structure

- Keep backend integrations in `app/api/[feature]/action.ts`.
- Use `route.ts` only for HTTP endpoints, streaming proxies, or browser-facing handlers that require a Next.js route.
- Keep DTOs, Zod schemas, permission constants, and shared types in `app/lib/[feature]/`.
- Reuse `Page`, `SearchParams`, `ActionResult`, and query helpers from `app/lib`; do not create feature-local equivalents.

## Authentication And Transport

- Protected backend requests must use `fetchAuthenticated()` from `app/api/auth/action.ts`.
- This dashboard has no anonymous backend transport. Public content consumption belongs to the separate marketing repository.
- Do not recreate API base URL handling, Clerk JWT retrieval, locale headers, timeout handling, or JSON response parsing in feature actions.
- `app/api/auth/action.ts` is the single owner of authenticated JSON transport.
- Read `response.text()` before `JSON.parse()` when implementing or modifying direct response parsing.
- Never expose Clerk tokens, backend authorization headers, or raw secrets to client components.

## Server Actions

- Server-action modules must begin with `"use server"`.
- Read operations return typed DTOs or `Page<T>` directly.
- Mutations return `ActionResult<T>` unless an existing domain contract requires another result type.
- Catch errors as `unknown`; use localized fallback messages from `getServerDictionary()` or `getRequestLocale()`.
- Do not hardcode user-facing error messages.
- Validate untrusted `FormData`, raw request bodies, and external payloads with an existing Zod schema at the action boundary.
- After mutations, revalidate only the affected list and detail routes. Navigation remains the client component's responsibility.

## Route Handlers And Streaming

- Direct backend `fetch()` is allowed only when `fetchAuthenticated()` cannot preserve the required behavior, such as streaming or response pass-through.
- Direct protected requests must reuse `getBackendAuthHeaders()`.
- Streaming handlers must preserve abort handling, upstream failure handling, content type, cache policy, and connection headers.
- Return localized, non-sensitive errors; do not forward internal backend details unnecessarily.

## Contract Changes

- Update the corresponding definitions in `app/lib/[feature]/` whenever the backend contract changes.
- Remove obsolete frontend fields and compatibility mapping when the backend contract is simplified.
- When the live dev OpenAPI contract or backend API mappings change, use the `api-mapping-sync` skill.
