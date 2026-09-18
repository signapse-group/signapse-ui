# Performance observability operations guide

## Signal catalog

Speed Insights remains the authoritative browser Web Vitals source, and the existing Vercel Analytics integration remains mounted outside fixture mode. The application adds the following stable signals:

| Operation                               | Runtime | Boundary                                                                                       |
| --------------------------------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `signapse.auth.resolve`                 | Node    | Fixture-header or Clerk user/token resolution                                                  |
| `signapse.backend.request`              | Node    | Shared backend request through body read and JSON parsing                                      |
| `signapse.dashboard.load`               | Node    | Protected Dashboard permission, locale, workspace, and page-state assembly                     |
| `signapse.market_chart.initial_load`    | Browser | Accepted selection through committed valid initial chart data                                  |
| `signapse.market_chart.live_connect`    | Browser | EventSource creation or reconnect start through `open`                                         |
| `signapse.market_chart.first_live_data` | Browser | Connection attempt through the first valid snapshot, price, or candle                          |
| `signapse.market_assistant.submit`      | Browser | Accepted submit, including first-conversation creation, through assistant-message availability |

Sanitized automatic Next.js spans use `next.request` or `next.render`. Successful server duration distributions come from spans. Server JSON diagnostics are failure-only. Optional client delivery uses Vercel Analytics custom events; local Performance marks and measures remain available when delivery is disabled or unsupported.

## Export allowlist and privacy contract

Application records may contain only these fields:

- `feature`, `operation`, `method`, `route`, `http.status_code`
- `outcome`, `error.type`, `duration_ms`, `trace_id`
- `locale`, `environment`, `connection.kind`, `conversation.kind`, `market.event_kind`
- `validation.issue_count`, `validation.issue_codes`, `validation.issue_paths`

Routes contain a path only. Scheme, authority, query, fragment, numeric identifiers, UUID-like identifiers, and values under identity or payload resources are normalized before export. Never add authorization or cookie headers, user/workspace/asset/conversation identifiers, request or response bodies, remote error messages, prompts, assistant/user messages, arbitrary `Error` objects, or raw URLs/query strings.

The export processor renames automatic framework spans, rebuilds their attributes from the same allowlist, removes exception events and link attributes, and clears status messages. Automatic fetch instrumentation is disabled; `signapse.backend.request` is canonical. The SSE proxy also opts out of automatic fetch telemetry.

## Configuration

| Key                                               | Supported values and behavior                                                                                                                                                                                                                                         |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SIGNAPSE_TELEMETRY_ENABLED`                      | Only exact `true` registers server telemetry. Any other value disables registration. P0 fixture mode always overrides it and stays silent.                                                                                                                            |
| `NEXT_PUBLIC_SIGNAPSE_PERFORMANCE_EVENTS_ENABLED` | Build-time client flag. Exact `true` enables optional Analytics custom events; otherwise only local Performance entries are recorded. Confirm the Vercel plan supports custom events before enabling.                                                                 |
| `OTEL_TRACES_SAMPLER`                             | `always_on`/`parentbased_always_on`, `always_off`/`parentbased_always_off`, or `traceidratio`/`parentbased_traceidratio`. All supported modes are mapped to parent-based behavior. Missing defaults to parent-based on; invalid values fail safe to parent-based off. |
| `OTEL_TRACES_SAMPLER_ARG`                         | Ratio from `0` through `1` when a ratio sampler is selected. Missing, non-numeric, or out-of-range values fail safe to parent-based off.                                                                                                                              |
| `API_BASE_URL`                                    | Defines the sole origin eligible for explicit W3C trace-context propagation. Context is never injected into another origin.                                                                                                                                           |
| `VERCEL_ENV`                                      | Normalized to `production`, `preview`, `development`, or `unknown` for the low-cardinality environment attribute.                                                                                                                                                     |

Registration sets `NEXT_OTEL_FETCH_DISABLED=1` internally and does not install browser OpenTelemetry. Local development is externally silent unless server telemetry is explicitly enabled; P0 fixture execution remains silent even if a surrounding environment enables telemetry.

## Preview rollout and privacy gate

1. Confirm the Vercel plan and expected event volume/cost. Leave the client custom-event flag off when the plan does not support it.
2. Enable server telemetry in Preview. Use `OTEL_TRACES_SAMPLER=always_on` where Preview volume permits.
3. Exercise representative Dashboard success and partial failure, Market Chart initial success/failure, SSE initial/reconnect/invalid-payload, AI Assistant new/existing/failure, transport HTTP failure, timeout, and malformed JSON flows.
4. Inspect representative trace waterfalls. Confirm the expected parent/child operations, stable names, normalized routes, terminal outcomes, and trace-context headers sent only to `API_BASE_URL`.
5. Inspect every exported span name, span attribute, event, link, and diagnostic against the allowlist. Any raw URL/query, identity, credential, payload, prompt/message, remote error text, or unbounded validation value blocks Production rollout.
6. Confirm application results and localized errors are unchanged while the exporter is available, unavailable, and disabled. Observability is fail-open: adapter, registration, propagation, Performance, and Analytics failures must not become application failures.

Cross-service continuation depends on the backend accepting W3C `traceparent`. The UI sends the header only to the configured backend origin, but the UI cannot guarantee that the backend preserves or exports the continued context.

## Seven-day Production baseline

After the Preview privacy gate, enable Production tracing at a cost-appropriate parent-based sample rate. Use full sampling only if the projected volume and retention cost are acceptable. For seven representative days:

- compare p50/p75/p95/p99 and volume for each stable operation and normalized route;
- correlate Web Vitals by route, device class, and environment in Speed Insights;
- inspect Dashboard, Market Chart initial/live/reconnect, AI Assistant, auth, backend, validation, timeout, and parse-failure distributions;
- record whether backend spans continued the propagated trace context;
- rank optimization candidates by request volume, tail latency, and journey importance.

The baseline is an operational follow-up, not an implementation completion gate. Create separate optimization tasks after evidence identifies the bottleneck; this work does not alter caching, fetching, rendering, or backend behavior.

## Rollback

Set `SIGNAPSE_TELEMETRY_ENABLED` to a non-`true` value to stop server registration, set `NEXT_PUBLIC_SIGNAPSE_PERFORMANCE_EVENTS_ENABLED` to a non-`true` value and redeploy to stop optional client delivery, or set `OTEL_TRACES_SAMPLER=always_off` for an immediate sampling kill switch. If startup or bundle behavior is affected despite those controls, roll back the deployment. Existing Speed Insights and Analytics remain in place.

## Implementation verification notes

The following static checks were run from the repository root:

```bash
rg -n "observeServerOperation|reportValidationFailure|startClientPerformanceMeasurement|startAssistantSubmitMeasurement|createMarketChartInitialLoadObserver|createMarketChartLiveStreamOpener" app components instrumentation.ts
rg -n "@opentelemetry|@vercel/otel" app components instrumentation.ts
rg -n "authorization|user_id|workspace_id|conversation_id|raw_url|http\.url|http\.target|prompt|payload|request\.body|response\.body" app/lib/observability 'app/[lang]/(main)/market-charts/market-chart-initial-load-observability.ts' 'app/[lang]/(main)/market-charts/market-chart-live-stream.ts' components/market-conversation-assistant/assistant-observability.ts app/api/auth/action.ts app/api/dashboard/action.ts app/api/market-charts/action.ts
rg -n "@vercel/otel|@opentelemetry/sdk-trace|registerOTel|BasicTracerProvider|OTEL_TRACES_SAMPLER|SIGNAPSE_TELEMETRY_ENABLED" .next/static
```

Results: feature call sites route through the shared adapters; server OpenTelemetry imports are limited to `app/lib/observability/server.ts` and `app/lib/observability/instrumentation.ts`; sensitive-term matches in production observability code are limited to route-redaction vocabulary, automatic-span source fields consumed and removed by the privacy processor, `invalid_payload` classification, and the pre-existing localized invalid-event callback text. No sensitive term is attached by a feature measurement call. The production build completed successfully, and the final server-SDK/configuration search over `.next/static` returned no matches (exit code 1 from `rg`).

Deterministic verification results:

- `pnpm install --ignore-scripts`: passed with the lockfile up to date; direct production dependencies are `@opentelemetry/api` and `@vercel/otel`, with no browser OTel SDK.
- Focused transport, registration, adapter, Dashboard, Market Chart, SSE, and AI Assistant run: 11 files and 48 tests passed.
- `pnpm lint`: passed with zero errors; existing non-blocking warnings remain.
- `pnpm typecheck`: passed.
- `pnpm build`: passed, including production compilation, TypeScript, page generation, and the client-bundle server-SDK search above.
- Repo-wide `pnpm test`: all 25 files and 119 tests passed. Existing async UI tests now wait for portal data and transition-controlled actions to become ready, and Vitest uses at most four workers to keep the jsdom interaction suites stable under load.
