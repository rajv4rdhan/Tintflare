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

  copyHeader(upstream, headers, 'ETag');
  copyHeader(upstream, headers, 'Last-Modified');

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}

export function buildHtmlResponse(
  body: BodyInit | null,
  status: number,
  maxAgeSeconds: number,
): Response {
  return new Response(body, {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': `public, max-age=${maxAgeSeconds}`,
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

function copyHeader(source: Response, target: Headers, name: string): void {
  const value = source.headers.get(name);

  if (value) {
    target.set(name, value);
  }
}
