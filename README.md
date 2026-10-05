# Signapse UI

![Signapse Logo](public/images/signapse_logo_light.svg)

A modern Next.js application with shadcn/ui, featuring real-time market data visualization and analysis tools.

This repository serves the authenticated Signapse dashboard. The marketing landing
and public articles are maintained and deployed in a separate repository.
`/` negotiates the locale, and `/[lang]` enters the protected dashboard. Anonymous
visitors are redirected to the localized sign-in page; only `sign-in/**` is public.
The application emits `noindex, nofollow` metadata.

The editor and dashboard prototype routes have been retired. The shared Plate
editor remains available for blog authoring and Personal Notes, with explicit
initial content supplied by each feature.

## Local Development

Copy `.env.example` to the ignored `.env.local` and supply your backend URL and Clerk keys, or use
your operator-provided application environment file. Real configuration and test accounts belong
outside Git. Next.js reads `.env.local`; standalone test runners require explicit loading.

Clerk sign-up is disabled in the sign-in component and its sign-up link is hidden.
The Clerk instance must also disable public account creation in its configuration.
Keep sign-in, session and password-recovery settings pointed at this dashboard's
host. Retired landing environment variables are no longer read by this app.

Set `SIGNAPSE_AUTH_MODE=disabled` to open the dashboard without Clerk login while developing against a local backend with auth disabled. This mode is ignored in production and sends backend API requests without Clerk bearer tokens.

Use `pnpm test:quality` for deterministic checks and `pnpm test:integration` for password
authentication against the configured public development backend. See the
[change-scope check selection](docs/testing/browser-tests.md#selecting-checks-by-change-scope)
and [browser and integration testing](docs/testing/browser-tests.md) for private file setup,
commands, and the scope each test lane proves.

## Using the Logo Component

Import the Logo component to display the Signapse branding:

```tsx
import { Logo } from "@/components/logo";

export function Header() {
  return (
    <div className="flex items-center gap-2">
      <Logo width={40} height={40} />
      <span className="font-semibold">Signapse</span>
    </div>
  );
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
import { Button } from "@/components/ui/button";
```
