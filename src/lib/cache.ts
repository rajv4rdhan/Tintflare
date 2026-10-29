const cache = caches.default;

export function matchCached(request: Request): Promise<Response | undefined> {
  return cache.match(request);
}

export function cacheResponse(
  ctx: ExecutionContext,
  request: Request,
  response: Response,
): void {
  ctx.waitUntil(cache.put(request, response.clone()));
}
