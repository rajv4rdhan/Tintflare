/**
 * Bindings and environment variables available to the Worker.
 *
 * `wrangler types` cannot infer secrets, so they are declared here. Keep this
 * in sync with `.env.example` and the secrets configured in Cloudflare.
 */
interface Env {
  /** Backblaze B2 application key ID (used as the Basic auth username). */
  B2_ACCOUNT_ID: string;
  /** Backblaze B2 application key. */
  B2_APPLICATION_KEY: string;
  /** Bucket that stores the static site files. */
  B2_BUCKET_NAME: string;
}
