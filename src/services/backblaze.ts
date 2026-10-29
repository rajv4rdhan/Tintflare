import type { AppConfig } from '../config';
import { HttpError } from '../lib/errors';

const B2_API_BASE_URL = 'https://api.backblazeb2.com/b2api/v2';
const AUTHORIZATION_TTL_MS = 23 * 60 * 60 * 1000;

export interface B2Authorization {
  readonly token: string;
  readonly downloadUrl: string;
}

interface CachedAuthorization extends B2Authorization {
  readonly accountId: string;
  readonly expiresAt: number;
}

interface AuthorizeAccountResponse {
  readonly authorizationToken: string;
  readonly downloadUrl: string;
}

let cachedAuthorization: CachedAuthorization | undefined;

/**
 * Authorizes against Backblaze B2, reusing the token for the lifetime of the
 * Worker isolate. Tokens are valid for 24 hours; refresh slightly earlier.
 */
export async function getAuthorization(config: AppConfig): Promise<B2Authorization> {
  const now = Date.now();

  if (
    cachedAuthorization &&
    cachedAuthorization.accountId === config.accountId &&
    cachedAuthorization.expiresAt > now
  ) {
    return cachedAuthorization;
  }

  const response = await fetch(`${B2_API_BASE_URL}/b2_authorize_account`, {
    headers: {
      Authorization: `Basic ${encodeCredentials(config)}`,
    },
  });

  if (!response.ok) {
    throw new HttpError(502, 'Storage authentication failed');
  }

  const data = (await response.json()) as AuthorizeAccountResponse;

  cachedAuthorization = {
    accountId: config.accountId,
    token: data.authorizationToken,
    downloadUrl: data.downloadUrl,
    expiresAt: now + AUTHORIZATION_TTL_MS,
  };

  return cachedAuthorization;
}

export function downloadFile(
  authorization: B2Authorization,
  bucketName: string,
  key: string,
): Promise<Response> {
  return fetch(buildDownloadUrl(authorization.downloadUrl, bucketName, key), {
    headers: {
      Authorization: authorization.token,
    },
  });
}

export function buildDownloadUrl(
  downloadUrl: string,
  bucketName: string,
  key: string,
): string {
  const baseUrl = downloadUrl.replace(/\/$/, '');
  const encodedBucket = encodeURIComponent(bucketName);
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');

  return `${baseUrl}/file/${encodedBucket}/${encodedKey}`;
}

function encodeCredentials({ accountId, applicationKey }: AppConfig): string {
  return btoa(`${accountId}:${applicationKey}`);
}
