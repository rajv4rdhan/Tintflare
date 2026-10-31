const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
} as const;

const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

/** Headers a 304 repeats from the full response it stands in for. */
const NOT_MODIFIED_HEADERS = [
  'Access-Control-Allow-Origin',
  'Cache-Control',
  'ETag',
  'Last-Modified',
] as const;

export interface CacheHeaders {
  /** Versioned URLs (`?v=`) never change content, so they are cached for a year. */
  immutable: boolean;
  etag?: string;
}

export function buildAssetResponse(
  upstream: Response,
  cacheHeaders: CacheHeaders,
): Response {
  const headers = buildCacheableHeaders(upstream, cacheHeaders);

  headers.set(
    'Content-Type',
    upstream.headers.get('Content-Type') ?? 'application/octet-stream',
  );

  return new Response(upstream.body, { status: upstream.status, headers });
}

export function buildSvgResponse(
  body: ReadableStream | null,
  upstream: Response,
  cacheHeaders: CacheHeaders,
): Response {
  const headers = buildCacheableHeaders(upstream, cacheHeaders);

  headers.set('Content-Type', 'image/svg+xml; charset=utf-8');

  return new Response(body, { status: upstream.status, headers });
}

function buildCacheableHeaders(
  upstream: Response,
  { immutable, etag }: CacheHeaders,
): Headers {
  const headers = new Headers(CORS_HEADERS);

  headers.set(
    'Cache-Control',
    immutable
      ? `public, max-age=${ONE_YEAR_IN_SECONDS}, immutable`
      : `public, max-age=${ONE_DAY_IN_SECONDS}`,
  );

  if (etag) headers.set('ETag', etag);

  const lastModified = upstream.headers.get('Last-Modified');
  if (lastModified) headers.set('Last-Modified', lastModified);

  return headers;
}

/**
 * Answers a conditional GET with 304 when `If-None-Match` matches the
 * response's ETag, using the weak comparison RFC 9110 requires.
 */
export function buildNotModifiedResponse(
  request: Request,
  response: Response,
): Response | undefined {
  const etag = response.headers.get('ETag');
  const ifNoneMatch = request.headers.get('If-None-Match');

  if (response.status !== 200 || !etag || !ifNoneMatch) return undefined;

  const target = opaqueTag(etag);
  const matches =
    ifNoneMatch.trim() === '*' ||
    ifNoneMatch.split(',').some((tag) => opaqueTag(tag) === target);

  if (!matches) return undefined;

  const headers = new Headers();

  for (const name of NOT_MODIFIED_HEADERS) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new Response(null, { status: 304, headers });
}

function opaqueTag(tag: string): string {
  return tag.trim().replace(/^W\//, '');
}

export function buildHtmlResponse(
  body: BodyInit | null,
  status: number,
  maxAge: number,
): Response {
  return new Response(body, {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': `public, max-age=${maxAge}`,
    },
  });
}

export function buildTextResponse(
  body: string,
  status: number,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(body, {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}
