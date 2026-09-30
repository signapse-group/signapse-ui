# Signapse UI

![Signapse Logo](public/images/signapse_logo_light.svg)

A modern Next.js application with shadcn/ui, featuring real-time market data visualization and analysis tools.

## Local Development

Copy `.env.example` to the ignored `.env.local` and supply your backend URL and Clerk keys, or use
your operator-provided application environment file. Real configuration and test accounts belong
outside Git. Next.js reads `.env.local`; standalone test runners require explicit loading.

Set `SIGNAPSE_AUTH_MODE=disabled` to open the dashboard without Clerk login while developing against a local backend with auth disabled. This mode is ignored in production and sends backend API requests without Clerk bearer tokens.

Use `pnpm test:quality` for deterministic checks and `pnpm test:integration` for password
authentication against the configured public development backend. See
[browser and integration testing](docs/testing/browser-tests.md) for private file setup,
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
