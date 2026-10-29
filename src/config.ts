export interface AppConfig {
  readonly accountId: string;
  readonly applicationKey: string;
  readonly bucketName: string;
}

export function loadConfig(env: Env): AppConfig {
  const accountId = env.B2_ACCOUNT_ID?.trim();
  const applicationKey = env.B2_APPLICATION_KEY?.trim();
  const bucketName = env.B2_BUCKET_NAME?.trim();

  if (!accountId || !applicationKey || !bucketName) {
    throw new Error('Missing B2 environment variables');
  }

  return { accountId, applicationKey, bucketName };
}
