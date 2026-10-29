import { loadConfig, type AppConfig } from './config';
import { serveAsset } from './handlers/assets';
import { HttpError } from './lib/errors';
import { buildTextResponse } from './lib/http';

const ALLOWED_METHODS = new Set(['GET', 'HEAD']);

export default {
  async fetch(request, env, ctx): Promise<Response> {
    if (!ALLOWED_METHODS.has(request.method)) {
      return buildTextResponse('Method Not Allowed', 405, {
        Allow: 'GET, HEAD',
      });
    }

    let config: AppConfig;

    try {
      config = loadConfig(env);
    } catch (error) {
      console.error('Invalid Worker configuration', error);
      return buildTextResponse('Worker is not configured correctly', 500);
    }

    try {
      return await serveAsset(request, config, ctx);
    } catch (error) {
      console.error('Request failed', error);

      if (error instanceof HttpError) {
        return buildTextResponse(error.message, error.status);
      }

      return buildTextResponse('Internal Server Error', 500);
    }
  },
} satisfies ExportedHandler<Env>;
