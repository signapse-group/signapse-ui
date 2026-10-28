# Signapse UI

![Signapse Logo](public/images/signapse_logo_light.svg)

A modern Next.js application with shadcn/ui, featuring real-time market data visualization and analysis tools.

This repository serves the authenticated Signapse dashboard. The marketing landing
and public articles are maintained and deployed in a separate repository.
`/` negotiates the locale, and `/[lang]` enters the protected dashboard. Anonymous
visitors are redirected to the localized sign-in page; `sign-in/**` and the read-only
`/api/build-revision` deployment identity endpoint are public.
The application emits `noindex, nofollow` metadata.

The editor and dashboard prototype routes have been retired. The shared Plate
editor remains available for blog authoring and Personal Notes, with explicit
initial content supplied by each feature.

## Assigned Execution

Jira [Signapse](https://signapse-group.atlassian.net/) project `SIGN` holds assigned
contracts and lifecycle state. [Planning's execution workflow](https://github.com/signapse-group/signapse-planing/blob/main/workflow/project-execution-workflow.md)
defines hierarchy, routing and human acceptance. This repository's
[WORKFLOW.md](WORKFLOW.md) configures its Symphony worker for native Subtasks with
`route-frontend`; GitHub hosts code, PRs and CI.

[WORKFLOW.md](WORKFLOW.md) is the execution entrypoint for assigned phases.
[CONTRIBUTING.md](CONTRIBUTING.md) owns shared implementation, verification and review
standards. Technical skills under `.agents/skills` are available after clone,
independently of Symphony releases, and are selected when the task needs them.

Configuration changes require operator verification before activation: confirm
the installed Symphony revision, worker credentials/tools and a separate FE
workspace root; drain the previous worker, reconcile existing work and verify a
coordinator-authorized canary assigned after preparation and Symphony deployment.
See [CI/Vercel prerequisites](docs/delivery.md#ci-and-vercel-setup) and the
[current planning cutover](https://github.com/signapse-group/signapse-planing/blob/main/workflow/project-execution-workflow.md#preflight-và-cutover-fe-và-landing).

## Local Development

Use the repository's pnpm scripts:

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the local development server. |
| `pnpm build` | Build the production application. |
| `pnpm start` | Run the production server. |
| `pnpm lint` | Check lint rules. |
| `pnpm typecheck` | Generate Next.js types and check TypeScript. |
| `pnpm format` | Format TS/TSX files. |

Copy `.env.example` to the ignored `.env.local` and supply your backend URL and Clerk keys, or use
your operator-provided application environment file. Real configuration and test accounts belong
outside Git. Next.js reads `.env.local`; standalone test runners require explicit loading.

Clerk sign-up is disabled in the sign-in component and its sign-up link is hidden.
The Clerk instance must also disable public account creation in its configuration.
Keep sign-in, session and password-recovery settings pointed at this dashboard's
host. Retired landing environment variables are no longer read by this app.

Set `SIGNAPSE_AUTH_MODE=disabled` to open the dashboard without Clerk login while developing against a local backend with auth disabled. This mode is ignored in production and sends backend API requests without Clerk bearer tokens.

CI uses `pnpm test:quality`; local FE work selects focused Vitest checks and browser
coverage only when needed under [test ownership and selection](CONTRIBUTING.md#test-ownership-and-selection)
and the [change-scope matrix](docs/testing/browser-tests.md#selecting-checks-by-change-scope).
Live feature testing belongs to QA/coordinator; `test:integration` remains a legacy
reference, outside FE Survey/Implement/Review gates.

## Using the Logo Component

Import the Logo component to display the Signapse branding:

```tsx
import { Logo } from "@/components/logo"

export function Header() {
  return (
    <div className="flex items-center gap-2">
      <Logo width={40} height={40} />
      <span className="font-semibold">Signapse</span>
    </div>
  )
}
```

The Logo component automatically adapts to light/dark theme. Props:

- `width`: Logo width in pixels (default: 40)
- `height`: Logo height in pixels (default: 40)
- `className`: Additional CSS classes
- `variant`: Display variant (default: "icon")

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button"
```
