import type { AppConfig } from '../config';
import { cacheResponse, matchCached } from '../lib/cache';
import { buildAssetResponse, buildTextResponse } from '../lib/http';
import { resolveObjectKey } from '../lib/paths';
import { fetchFile } from '../services/backblaze';
import { serveNotFound } from './not-found';

export async function serveAsset(
  request: Request,
  config: AppConfig,
  ctx: ExecutionContext,
): Promise<Response> {
  if (request.method === 'GET') {
    const cached = await matchCached(request);
    if (cached) return cached;
  }

  const key = resolveObjectKey(new URL(request.url).pathname);
  if (!key) return buildTextResponse('Bad Request', 400);

  const upstream = await fetchFile(config, key);

  if (upstream.status === 404) {
    return serveNotFound(config);
  }

  if (!upstream.ok) {
    console.error(`B2 request for "${key}" failed with status ${upstream.status}`);
    return buildTextResponse('Failed to fetch asset from storage', 502);
  }

  const response = buildAssetResponse(upstream);

  if (request.method === 'GET') {
    cacheResponse(ctx, request, response);
  }

  return response;
}
