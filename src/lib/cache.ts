const cache = caches.default;

export async function matchCached(request: Request): Promise<Response | undefined> {
  return cache.match(cacheKey(request));
}

export function cacheResponse(
  ctx: ExecutionContext,
  request: Request,
  response: Response,
): void {
  ctx.waitUntil(cache.put(cacheKey(request), response.clone()));
}

/**
 * Cache API entries are always keyed by GET requests, even when the incoming
 * request used another method.
 */
function cacheKey(request: Request): Request {
  return new Request(request.url, { method: 'GET' });
}
