import type { AppConfig } from '../config';

const API_URL = 'https://api.backblazeb2.com/b2api/v2';
const AUTH_TTL_MS = 23 * 60 * 60 * 1000;

interface Authorization {
  accountId: string;
  token: string;
  downloadUrl: string;
  expiresAt: number;
}

let authorization: Authorization | undefined;

export async function fetchFile(
  config: AppConfig,
  key: string,
): Promise<Response> {
  const auth = await getAuthorization(config);
  const baseUrl = auth.downloadUrl.replace(/\/$/, '');
  const bucket = encodeURIComponent(config.bucketName);
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');

  return fetch(`${baseUrl}/file/${bucket}/${encodedKey}`, {
    headers: { Authorization: auth.token },
  });
}

async function getAuthorization(config: AppConfig): Promise<Authorization> {
  if (
    authorization &&
    authorization.accountId === config.accountId &&
    authorization.expiresAt > Date.now()
  ) {
    return authorization;
  }

  const response = await fetch(`${API_URL}/b2_authorize_account`, {
    headers: {
      Authorization: `Basic ${btoa(`${config.accountId}:${config.applicationKey}`)}`,
    },
  });

  if (!response.ok) {
    throw new Error(`B2 authorization failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    authorizationToken: string;
    downloadUrl: string;
  };

  authorization = {
    accountId: config.accountId,
    token: data.authorizationToken,
    downloadUrl: data.downloadUrl,
    expiresAt: Date.now() + AUTH_TTL_MS,
  };

  return authorization;
}
