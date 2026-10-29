import type { AppConfig } from '../config';
import { cacheResponse, matchCached } from '../lib/cache';
import { buildAssetResponse, buildTextResponse } from '../lib/http';
import { resolveObjectKey } from '../lib/paths';
import { downloadFile, getAuthorization } from '../services/backblaze';
import { serveNotFound } from './not-found';

/**
 * Serves an asset from B2, using the Cloudflare edge cache when possible.
 */
export async function serveAsset(
  request: Request,
  config: AppConfig,
  ctx: ExecutionContext,
): Promise<Response> {
  if (request.method === 'GET') {
    const cachedResponse = await matchCached(request);

    if (cachedResponse) {
      return cachedResponse;
    }
  }

  const objectKey = resolveObjectKey(new URL(request.url).pathname);

  if (objectKey === undefined) {
    return buildTextResponse('Bad Request', 400);
  }

  const authorization = await getAuthorization(config);
  const upstreamResponse = await downloadFile(
    authorization,
    config.bucketName,
    objectKey,
  );

  if (upstreamResponse.status === 404) {
    return serveNotFound(config, authorization);
  }

  if (!upstreamResponse.ok) {
    console.error(
      `Storage request for "${objectKey}" failed with status ${upstreamResponse.status}`,
    );
    return buildTextResponse('Failed to fetch asset from storage', 502);
  }

  const response = buildAssetResponse(upstreamResponse);

  if (request.method === 'GET') {
    cacheResponse(ctx, request, response);
  }

  return response;
}
