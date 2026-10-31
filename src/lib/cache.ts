const cache = caches.default;

export function matchCached(key: Request): Promise<Response | undefined> {
  return cache.match(key);
}

export function cacheResponse(
  ctx: ExecutionContext,
  key: Request,
  response: Response,
): void {
  ctx.waitUntil(cache.put(key, response.clone()));
}

/**
 * Builds the edge cache key from the path plus only the query values that
 * change the response, in a fixed order. Reordered, differently cased, or
 * unknown parameters share one entry instead of each refetching from B2.
 * The key carries no request headers, so a match is never a conditional 304.
 */
export function buildCacheKey(
  url: URL,
  params: Record<string, string | undefined>,
): Request {
  const key = new URL(url.pathname, url.origin);

  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined) key.searchParams.set(name, value);
  }

  return new Request(key.toString(), { method: 'GET' });
}
