import type { AppConfig } from '../config';
import { buildCacheKey, cacheResponse, matchCached } from '../lib/cache';
import {
  buildAssetResponse,
  buildNotModifiedResponse,
  buildSvgResponse,
  buildTextResponse,
} from '../lib/http';
import { resolveObjectKey } from '../lib/paths';
import type { ServerTiming } from '../lib/server-timing';
import {
  applySvgTheme,
  getSvgThemeOptions,
  type SvgThemeOptions,
} from '../lib/svg-theme';
import { fetchFile } from '../services/backblaze';
import { serveNotFound } from './not-found';

/** `?v=` is a cache-busting token, not content, so keep it short and plain. */
const VERSION_PATTERN = /^[\w.-]{1,64}$/;

export async function serveAsset(
  request: Request,
  config: AppConfig,
  ctx: ExecutionContext,
  timing: ServerTiming,
): Promise<Response> {
  const url = new URL(request.url);
  const key = resolveObjectKey(url.pathname);
  if (!key) return buildTextResponse('Bad Request', 400);

  const svgTheme = getSvgThemeOptions(url, key);

  if (svgTheme.status === 'invalid') {
    return buildTextResponse(svgTheme.message, 400);
  }

  const version = url.searchParams.get('v') ?? undefined;

  if (version !== undefined && !VERSION_PATTERN.test(version)) {
    return buildTextResponse(
      'Invalid v: use up to 64 letters, digits, dots, dashes, or underscores.',
      400,
    );
  }

  const theme = svgTheme.status === 'themed' ? svgTheme.options : undefined;
  const cacheKey = buildCacheKey(url, {
    theme: theme?.theme,
    tm: theme?.mode,
    cvd: theme?.cvd,
    v: version,
    // A deploy can change a palette or the transform itself, so themed
    // entries from an earlier deploy are never served.
    deployment: theme ? config.deploymentId : undefined,
  });

  if (request.method === 'GET') {
    const cached = await matchCached(cacheKey);

    if (cached) {
      timing.add('cache', undefined, 'HIT');
      return answerConditional(request, cached);
    }

    timing.add('cache', undefined, 'MISS');
  } else {
    timing.add('cache', undefined, 'BYPASS');
  }

  const upstream = await fetchFile(config, key);

  if (upstream.status === 404) {
    return serveNotFound(config);
  }

  if (!upstream.ok) {
    console.error(`B2 request for "${key}" failed with status ${upstream.status}`);
    return buildTextResponse('Failed to fetch asset from storage', 502);
  }

  const sourceTag = getSourceTag(upstream);
  const immutable = version !== undefined;
  let response: Response;

  if (theme && request.method === 'GET') {
    const etag = sourceTag
      ? `"${await hashThemedTag(sourceTag, theme, config.deploymentId)}"`
      : undefined;

    response = buildSvgResponse(applySvgTheme(upstream, theme).body, upstream, {
      immutable,
      etag,
    });
  } else {
    response = buildAssetResponse(upstream, {
      immutable,
      etag: sourceTag ? `"${sourceTag}"` : undefined,
    });
  }

  if (request.method === 'GET') {
    cacheResponse(ctx, cacheKey, response);
  }

  return answerConditional(request, response);
}

function answerConditional(request: Request, response: Response): Response {
  const notModified = buildNotModifiedResponse(request, response);
  if (!notModified) return response;

  // The body is not sent. Cancelling this branch leaves a cache write's clone intact.
  void response.body?.cancel();
  return notModified;
}

/**
 * Identifies the stored bytes: B2's SHA-1 when it has one, otherwise the file
 * ID, which changes on every upload.
 */
function getSourceTag(upstream: Response): string | undefined {
  const sha1 = upstream.headers
    .get('x-bz-content-sha1')
    ?.replace(/^unverified:/, '');

  if (sha1 && /^[0-9a-f]{40}$/i.test(sha1)) return sha1.toLowerCase();

  return upstream.headers.get('x-bz-file-id') ?? undefined;
}

/** A themed ETag changes with the source file, the theme, and the deploy. */
async function hashThemedTag(
  sourceTag: string,
  options: SvgThemeOptions,
  deploymentId: string,
): Promise<string> {
  const input = [
    sourceTag,
    options.theme,
    options.mode,
    options.cvd ?? '',
    deploymentId,
  ].join('|');
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(input),
  );

  return [...new Uint8Array(digest).slice(0, 12)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
