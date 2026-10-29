const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
} as const;

const ONE_DAY_IN_SECONDS = 60 * 60 * 24;

export function buildAssetResponse(upstream: Response): Response {
  const headers = new Headers(CORS_HEADERS);

  headers.set(
    'Content-Type',
    upstream.headers.get('Content-Type') ?? 'application/octet-stream',
  );
  headers.set('Cache-Control', `public, max-age=${ONE_DAY_IN_SECONDS}`);

  const etag = upstream.headers.get('ETag');
  if (etag) headers.set('ETag', etag);

  const lastModified = upstream.headers.get('Last-Modified');
  if (lastModified) headers.set('Last-Modified', lastModified);

  return new Response(upstream.body, { status: upstream.status, headers });
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
