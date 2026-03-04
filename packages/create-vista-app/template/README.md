# My Vista App

Built with [Vista.js](https://github.com/vistagen/Vista-Js) — the React framework powered by Rust.

## Getting Started

Run the development server:

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3003](http://localhost:3003) in your browser.

If you want typed API starter files in a fresh app:

```bash
npx create-vista-app@latest my-vista-app --typed-api
```

## Project Structure

```
app/
├── root.tsx        # Root layout (<html>, <body>, fonts)
├── index.tsx       # Home page
├── globals.css     # Global styles (Tailwind CSS v4)
└── about/
    └── page.tsx    # Example nested route → /about
public/
├── vista.svg       # Static assets
vista.config.ts     # Framework configuration
```

## Key Concepts

- **`app/root.tsx`** — Root layout that wraps every page. Defines `<html>`, fonts, and metadata.
- **`app/index.tsx`** or **`app/page.tsx`** — Page components. Each folder = a route.
- **`'use client'`** — Add this directive to make a component interactive (client-side).
- **Server Components** — All components are server components by default (zero JS sent to browser).

## Available Commands

| Command       | Description                       |
| ------------- | --------------------------------- |
| `vista dev`   | Start dev server with live-reload |
| `vista build` | Create production build           |
| `vista start` | Start production server           |
| `vista g api-init` | Generate typed API starter files |
| `vista g router <name>` | Generate a typed router file |
| `vista g procedure <name> [get\|post]` | Generate a typed procedure file |

## Typed API Rollback

Typed API is experimental and can be disabled anytime from `vista.config.ts`:

```ts
experimental: {
  typedApi: {
    enabled: false
  }
}
```

## Learn More

- [Vista.js GitHub](https://github.com/vistagen/Vista-Js)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Tailwind CSS v4](https://tailwindcss.com)
