# Tintflare

A Cloudflare Worker that serves static assets from a private Backblaze B2 bucket, with edge caching and a custom 404 page.

## How it works

- `/` and directory paths (for example `/blog/`) resolve to `index.html`.
- Other paths map directly to an object key in the bucket.
- Successful asset responses are cached at the edge for 24 hours.
- B2 authorization tokens are cached per Worker isolate for 23 hours.
- A missing asset serves `404.html` from the bucket, or a built-in fallback page.
- SVG assets are remapped at the edge: `?tm=dark` for the dark theme and `?cvd=deutan` for a deuteranopia-safe variant.
- Only `GET` and `HEAD` requests are allowed.

## SVG themes

SVG assets can be remapped at the edge:

| Query | Result |
| --- | --- |
| `?tm=dark` | Perceptual OKLCH dark variant |
| `?cvd=deutan` | Deuteranopia-safe variant (light theme) |
| `?tm=dark&cvd=deutan` | Both |

The pipeline converts each color to OKLCH, flips lightness for dark mode, preserves hue and chroma, gamut-maps back to sRGB, and enforces WCAG contrast for text and strokes. White fills map to the exact theme background.

Theme background colors, contrast thresholds, and CVD matrices live in `src/lib/theme.ts`. Set `THEMES.dark.background` to the blog's exact dark background color.

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

Set the production secrets:

```bash
npx wrangler secret put B2_ACCOUNT_ID
npx wrangler secret put B2_APPLICATION_KEY
npx wrangler secret put B2_BUCKET_NAME
```

Deploy:

```bash
npm run deploy
```

## Scripts

| Script               | Description                            |
| -------------------- | -------------------------------------- |
| `npm run dev`        | Run the Worker locally with Wrangler   |
| `npm run deploy`     | Deploy the Worker to Cloudflare        |
| `npm run typecheck`  | Type-check the project with TypeScript |
| `npm run cf-typegen` | Regenerate `worker-configuration.d.ts` |

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
    svg-theme.ts        SVG color replacement pipeline
    theme.ts            Theme storage: backgrounds, contrast, CVD matrices
  services/
    backblaze.ts        B2 authorization and file downloads
```
