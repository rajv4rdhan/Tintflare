export interface AppConfig {
  readonly accountId: string;
  readonly applicationKey: string;
  readonly bucketName: string;
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export function loadConfig(env: Env): AppConfig {
  const accountId = env.B2_ACCOUNT_ID?.trim();
  const applicationKey = env.B2_APPLICATION_KEY?.trim();
  const bucketName = env.B2_BUCKET_NAME?.trim();

  if (!accountId || !applicationKey || !bucketName) {
    const missing = [
      ...(!accountId ? ['B2_ACCOUNT_ID'] : []),
      ...(!applicationKey ? ['B2_APPLICATION_KEY'] : []),
      ...(!bucketName ? ['B2_BUCKET_NAME'] : []),
    ];

    throw new ConfigurationError(
      `Missing B2 environment variables: ${missing.join(', ')}. ` +
        'Set them with `wrangler secret bulk .env` or `wrangler secret put <NAME>`.',
    );
  }

  return { accountId, applicationKey, bucketName };
}
