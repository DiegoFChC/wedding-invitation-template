## Development

Run from the repo root. Node `>=22.12.0` is required (see `engines` in `package.json`).

Dev server — **always start in background mode**:

```
astro dev --background
```

Manage the running server with: `astro dev stop`, `astro dev status`, `astro dev logs`.
Local URL: `http://localhost:4321`.

Available npm scripts (see `package.json`):
- `npm run dev` → `astro dev`
- `npm run build` → `astro build` (outputs static files to `dist/`)
- `npm run preview` → preview the build locally
- `npm run astro ...` → run any Astro CLI command, e.g. `npm run astro add X`

There are **no lint, format, typecheck, or test scripts**. `npx astro check` is NOT ready out of the box — it additionally requires installing `npm i -D @astrojs/check typescript` before it will run.

## Toolchain and versions

- Astro `^7.2.4`, Tailwind CSS `4` (via `@tailwindcss/vit`), GSAP `3.15`.
- `astro.config.mjs` registers the Tailwind Vite plugin; no SSR adapter (static site).
- `tsconfig.json` extends `astro/tsconfigs/strict`.
- TypeScript is present only transitively — do not add it to `package.json` unless needed.

## Code conventions

- **All code is written in English.**
- Layout imports `src/styles/global.css` in its frontmatter (`<head>` lives in `src/layouts/Layout.astro`).
- Project layout: `src/pages/` (routes), `src/layouts/`, `src/components/`, `src/scripts/` (client JS), `src/styles/`.
- No couple photos. Keep the aesthetic: navy/deep-blue, cream/soft-white, gold accents.

## Tailwind 4 specifics (guess these wrong at your peril)

- Do **not** use the legacy `@tailwind base; @tailwind components; @tailwind utilities;` directives.
- global.css starts with `@import "tailwindcss";`
- Custom design tokens (colors, fonts) go in an `@theme { }` block in `src/styles/global.css`:
  `-color-navy`, `--color-gold`, `--font-title` (Cormorant Garamond), `--font-body` (Inter).
  They become ready-made utility names like `bg-navy`, `text-gold`, `font-title`.
- Google Fonts are loaded via `<link>` in `Layout.astro` (preconnect to `fonts.googleapis.com` / `fonts.gstatic.com`). Do not `@import` them inside CSS.

## Critical Astro + GSAP quirk

A `<script>` inside a `.astro` file is **inert on the client** unless it carries a hydration directive.
Any interactive/client JS (e.g. the GSAP envelope animation) must use:

```astro
<script type="module" client:load>
  import { initEnvelope } from "../scripts/envelopeAnimation";
  initEnvelope();
</script>
```

Without `client:load`/`client:idle`/`client:visible`, the script never executes in the browser.
This applies to `src/components/Envelop.astro`, which drives the flap-open + card-reveal animation with GSAP.

## Documentation

Full documentation: https://docs.astro.build

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
