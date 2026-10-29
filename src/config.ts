import { ConfigurationError } from './lib/errors';

export interface AppConfig {
  readonly accountId: string;
  readonly applicationKey: string;
  readonly bucketName: string;
}

/**
 * Reads and validates the Worker configuration from its environment.
 *
 * Throws `ConfigurationError` when a required value is missing.
 */
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
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  return { accountId, applicationKey, bucketName };
}
