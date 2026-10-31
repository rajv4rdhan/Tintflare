# Tintflare

A Cloudflare Worker that serves static assets from a private Backblaze B2 bucket, with edge caching and a custom 404 page.

## How it works

- `/` and directory paths (for example `/blog/`) resolve to `index.html`.
- Other paths map directly to an object key in the bucket.
- Successful asset responses are cached at the edge for 24 hours.
- B2 authorization tokens are cached per Worker isolate for 23 hours.
- A missing asset serves `404.html` from the bucket, or a built-in fallback page.
- SVG assets are remapped at the edge: `?tm=light` / `?tm=dark` for the default theme, `?theme=rvfolio&tm=dark` for a named theme, and `?cvd=deutan` for a deuteranopia-safe variant.
- Responses include `Server-Timing` metrics for cache, parse, transform, and total time.
- Only `GET` and `HEAD` requests are allowed.

## SVG themes

SVG assets can be remapped at the edge:

| Query | Result |
| --- | --- |
| `?tm=light` | Default light theme |
| `?tm=dark` | Default dark theme |
| `?theme=rvfolio` | rvfolio light theme |
| `?theme=rvfolio&tm=light` | rvfolio light theme |
| `?theme=rvfolio&tm=dark` | rvfolio dark theme |
| `?cvd=deutan` | Default light theme with deuteranopia-safe colors |
| `?theme=rvfolio&tm=dark&cvd=deutan` | rvfolio dark theme with deuteranopia-safe colors |

An unknown `theme` or `tm` value returns `400 Bad Request`.

The pipeline converts each color to OKLCH, flips lightness for dark mode, preserves hue and chroma, gamut-maps back to sRGB, and enforces WCAG contrast for text and strokes. White fills map to the exact theme background.

### Customizing a theme

Every theme definition supports:

| Field | Purpose |
| --- | --- |
| `background` | Exact page background; white SVG fills fall back to this color |
| `minContrast` | WCAG minimum contrast ratios for text, strokes, and fills |
| `colors` | Role-wide replacements for every `text`, `stroke`, or `fill` color |
| `overrides` | Exact source-color replacements by hex, either for all roles or per role |

The default theme is split into separate light and dark files:

| File | Used by |
| --- | --- |
| `src/themes/light.ts` | Default `?tm=light` and `?cvd=deutan` |
| `src/themes/dark.ts` | Default `?tm=dark` |

Set `background` to the exact page background your site uses. For example, a cream light theme and a dark-blue theme:

```ts
// src/themes/light.ts
background: '#faf6ee', // cream

// src/themes/dark.ts
background: '#0b1220', // dark blue
```

#### Replace every text, stroke, or fill color

Use `colors` to control a whole role:

```ts
colors: {
  text: '#1f2937',
  stroke: '#334155',
  // fill omitted, so fills keep automatic recoloring
},
```

Every text color becomes `#1f2937` unless an exact `overrides` entry matches first. The same applies to `stroke` and `fill`. Set a role to `null` to keep all of its original colors.

#### Replace a specific source color

Use `overrides` to target exact source colors. A string applies to every role:

```ts
overrides: {
  '#e03131': '#b91c1c',
  '#ffc9c9': '#fee2e2',
},
```

Use an object to set different replacements per role:

```ts
overrides: {
  '#1e1e1e': {
    text: '#1f2937',
    stroke: '#334155',
  },
  '#1971c2': { stroke: '#0f766e', fill: '#ccfbf1' },
  '#2f9e44': null, // keep the original green
},
```

Short and long hex values are matched together: an override for `#fff` also matches source color `#ffffff`.

#### Color resolution order

For each SVG color:

1. Exact `overrides[sourceHex][role]`
2. Exact `overrides[sourceHex]` as an all-role string
3. Role-wide `colors[role]`
4. White fill → theme `background`
5. Automatic OKLCH recoloring and contrast enforcement

Explicit replacements are written exactly as configured and bypass automatic contrast adjustment. Choose values that remain readable against your background. `null` keeps the original source color unchanged.

#### Common Excalidraw colors

| Source color | Excalidraw use |
| --- | --- |
| `#1e1e1e` | Default text and stroke |
| `#e03131` | Red stroke |
| `#2f9e44` | Green stroke |
| `#1971c2` | Blue stroke |
| `#f08c00` | Orange stroke |
| `#ffc9c9` | Red fill |
| `#b2f2bb` | Green fill |
| `#a5d8ff` | Blue fill |
| `#ffec99` | Yellow fill |

### Adding a named theme

Create a theme collection with its own light and dark variants, for example `src/themes/rvfolio.ts`:

```ts
import type { ThemeCollection } from './types';

export const rvfolioTheme = {
  light: {
    background: '#faf6ee',
    minContrast: { text: 4.5, stroke: 3, fill: 0 },
    colors: { text: '#1f2937' },
    overrides: {
      '#1e1e1e': { text: '#1f2937', stroke: '#334155' },
      '#e03131': '#b91c1c',
    },
  },
  dark: {
    background: '#0b1220',
    minContrast: { text: 4.5, stroke: 3, fill: 0 },
    colors: { text: '#e5e7eb' },
    overrides: {
      '#1e1e1e': { text: '#e5e7eb', stroke: '#cbd5e1' },
      '#e03131': '#f87171',
    },
  },
} satisfies ThemeCollection;
```

The full Excalidraw-oriented example lives in `src/themes/rvfolio.ts`.

Register it in `src/themes/index.ts`:

```ts
export const THEMES = {
  default: { light: lightTheme, dark: darkTheme },
  rvfolio: rvfolioTheme,
} satisfies Record<string, ThemeCollection>;
```

The registry key becomes the `?theme=` value. Use `?theme=rvfolio&tm=light` or `?theme=rvfolio&tm=dark`; omitting `tm` defaults to light.

Adjust `minContrast` if your site needs stricter or looser WCAG thresholds. CVD matrices live in `src/themes/cvd.ts`.

## Server-Timing

Every response includes a `Server-Timing` header:

```text
cache;desc=MISS, parse;dur=1.0, transform;dur=4.0, total;dur=8.0
cache;desc=HIT, total;dur=2.0
```

Open DevTools → Network → Timing to see the breakdown. `parse` and `transform` only appear for themed SVG responses; `cache` is `HIT`, `MISS`, or `BYPASS`.

## Local development

```bash
npm install
cp .env.example .env
```

Fill in the values in `.env`:

| Variable             | Description                                                    |
| -------------------- | -------------------------------------------------------------- |
| `B2_ACCOUNT_ID`      | B2 application key ID (the Basic auth username, not the account ID) |
| `B2_APPLICATION_KEY` | B2 application key                                             |
| `B2_BUCKET_NAME`     | Bucket containing the static files                             |

Then start the Worker:

```bash
npm run dev
```

Wrangler serves the Worker at http://localhost:8787 and loads `.env` automatically. `.env` is gitignored and never deployed.

## Deploy

Authenticate with Cloudflare once:

```bash
npx wrangler login
```

Deploy:

```bash
npm run deploy
```

`npm run deploy` runs the type check and build, uploads `.env` as Worker secrets, then deploys. To upload secrets without deploying, run `npm run secrets`. You can also set them individually:

```bash
npx wrangler secret put B2_ACCOUNT_ID
npx wrangler secret put B2_APPLICATION_KEY
npx wrangler secret put B2_BUCKET_NAME
```

If the Worker returns `Worker is not configured correctly`, its B2 secrets are missing from the deployed script. Add `B2_ACCOUNT_ID`, `B2_APPLICATION_KEY`, and `B2_BUCKET_NAME` under **Workers & Pages → tintflare → Settings → Variables and Secrets**, then redeploy. `wrangler tail` logs the missing variable names.

## Scripts

| Script               | Description                                      |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Run the Worker locally with Wrangler             |
| `npm run build`      | Bundle the Worker into `dist/` with a dry run    |
| `npm run secrets`    | Upload `.env` values as Worker secrets           |
| `npm run deploy`     | Type-check, build, upload secrets, then deploy   |
| `npm run typecheck`  | Type-check the project with TypeScript           |
| `npm run cf-typegen` | Regenerate `worker-configuration.d.ts`           |

## Project layout

```text
src/
  index.ts              Worker entry point, method routing, error handling
  config.ts             Environment validation and typed configuration
  env.d.ts              Worker environment variable types
  handlers/
    assets.ts           Asset requests and edge caching
    not-found.ts        Custom and fallback 404 responses
  lib/
    cache.ts            Cloudflare Cache API helpers
    color.ts            OKLCH conversion, gamut mapping, contrast
    http.ts             Response builders
    paths.ts            URL pathname to B2 object key mapping
    server-timing.ts    Server-Timing collector and response header
    svg-theme.ts        SVG color replacement pipeline
  themes/
    index.ts            Theme registry and named theme lookup
    light.ts            Default light theme: background and contrast
    dark.ts             Default dark theme: background and contrast
    rvfolio.ts          rvfolio light/dark colors and replacements
    cvd.ts              Color-vision-deficiency matrices
    types.ts            Shared theme types
  services/
    backblaze.ts        B2 authorization and file downloads
```
