# AGENTS.md

Instructions for AI coding sessions working on this repo (interactive wedding invitation).

Stack: Astro 7 (static, no adapter) + Tailwind CSS 4 + GSAP 3. Node >= 22.12.

## Commands

```bash
npm run dev            # starts the dev server IN BACKGROUND and returns immediately
npm run build          # production build -> dist/  (this is THE verification step)
npx astro dev status | logs | stop
```

- There are **no lint / test / typecheck scripts**. Verify changes with `npm run build`.
- `npx astro check` requires `npm i -D @astrojs/check typescript` first (not installed).
- Do **not** run `astro dev --background` (documented nowhere else; it hangs forever with no output).
- If HTTP checks hit `localhost:4321`, confirm the server first: `npx astro dev status`. After heavy edits the served module can be stale — restart with `stop` + `npm run dev`.

## Verified Astro quirks in this repo (do not regress)

- **Never add hydration directives to plain scripts.** `<script type="module" client:load>` inside `.astro` builds to a RAW unprocessed script whose relative imports 404 in `dist/`. Use a normal processed `<script>` (Astro bundles it into `_astro/*.js`). This contradicts older notes/CLAUDE.md — trust this section.
- **Bare `.svg` imports return an Astro component**, not a URL. For `<img src>` you need the Vite suffix: `import flowers from "../assets/flowers.svg?url"`. Symptom of getting it wrong: `src="(...args) =>"` in the rendered HTML.
- The florals in `src/assets/flowers*.svg` are ~3 MB Illustrator exports (no intrinsic width/height attrs). When placing them via `<img>`, set sizes explicitly (e.g. `aspect-ratio` / viewport units); percentage heights collapse under parents that only have `min-height`.

## Architecture

Page flow (all sections are `main > section`, each visually full-height):

1. `Envelop.astro` — **fixed, opaque-navy overlay** shown on load (wax-seal button). On tap, GSAP opens flap -> card slides out -> overlay fades and dispatches `window` event `"envelope:opened"`. Body scroll stays locked until then; `<noscript>` hides the overlay.
2. `Hero.astro` (names) -> `WeddingInfo.astro` (date + live countdown) -> `Schedule.astro` (timeline + Google Maps embed) -> `Rsvp.astro` (form) -> `Footer.astro` (outside `main`).
3. `/` renders `PrivateGate.astro` (code input only — no private data). Personalized invites render `InvitationPage.astro` from `src/pages/invitacion/[token].astro` via `getStaticPaths()` over `src/data/invitados.json`. Unknown tokens land on the friendly `404.astro`.

Client scripts (`src/scripts/`) — one owner per concern, wired from each component's own `<script>` tag:

| File | Owns |
| --- | --- |
| `scrollEffects.ts` | ALL scroll behavior: hero intro (waits for `"envelope:opened"`), parallax, section entrances, wheel/touch/keyboard navigation |
| `envelopeAnimation.ts` | Seal -> flap -> card timeline; scroll lock/unlock; broadcasts `"envelope:opened"` |
| `particles.ts` | Canvas dust (reused on Hero, Envelop scene, Gate); pauses off-screen; reduced-motion = static frame |
| `countdown.ts` | Wedding date constant `TARGET` lives here |
| `rsvp.ts` | Form validation, localStorage persistence, success/registered states |

Scroll-navigation contract (easy to break): gesture steps apply **only within the first two sections** (`NAV_LIMIT` in `scrollEffects.ts`); everything after scrolls natively so long sections stay reachable. The HERO is a 3-panel story (`[data-hero-panel]`: names / verse 1 / verse 2): each gesture dissolves the current text into char-particles drifting sideways and assembles the next (`swapHeroPanel`); the step after the last verse glides to the date section, and returning up lands on the last verse. Panels' text is split into per-char spans by `chunkify()` — keep `data-chunk="chars"`/`"el"` attributes intact or swaps break. Sections must keep `min-height: 100lvh` (with `100dvh` fallback line before it) — using only `dvh` makes the mobile URL-bar resize expose the previous section.

GSAP conventions here: all motion goes through `gsap.matchMedia()` with `prefers-reduced-motion` conditions (reduce => jump to final state / native scrolling). Elements animated on reveal are hidden via `gsap.set` **at startup** and revealed with `.to()` timelines — never `gsap.from()` at trigger time (caused a visible double-animation bug before). Scripts select elements via `data-*` attributes (`[data-hero-name-left]`, `[data-timeline-line]`, ...); Astro scoped styles don't interfere.

## Data & pending work

- Guest data: `src/data/invitados.json` — `{ token: { name, allowedSlots } }`. Stepper max and guest greeting derive from it.
- RSVP flow (`rsvp.ts`): Google Sheets is the single source of truth. On load, personalized pages run `GET APPS_SCRIPT_URL?token=<token>` (Apps Script `doGet` scans the sheet's token column and returns `{ alreadyAnswered, data }`); answered guests get a summary card instead of the form; network failure falls back to showing the form (no local persistence anywhere). Submissions POST the JSON payload `{ token, name, attendance: "yes"|"no", count, message }` via opaque `no-cors` (completion = success).

## Conventions

- Identifiers and comments in **English**; user-facing copy in **Spanish**. Code carries explanatory comments (owner preference — do not strip them).
- Tailwind 4: no legacy `@tailwind` directives; design tokens live in the `@theme` block of `src/styles/global.css` (`--color-navy*`, `--color-gold*`, `--color-cream*`, `--font-title` = Cormorant Garamond, `--font-body` = Inter) and become utilities (`bg-navy-deep`, `text-gold-light`, `font-title`). Google Fonts load via `<link>` in `Layout.astro`, never `@import` in CSS.
- Aesthetic guardrails: navy/deep-blue primary, cream paper tones, gold accents; no couple photos; florals come from `src/assets/*.svg` (mirrored/repositioned copies are fine).
- Editable business constants are intentionally co-located: wedding date in `countdown.ts`, venue/address/map coords in `Schedule.astro` frontmatter, couple name/title in `Layout.astro` defaults.
