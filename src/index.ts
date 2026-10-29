import { loadConfig } from './config';
import { serveAsset } from './handlers/assets';
import { buildTextResponse } from './lib/http';

export default {
  async fetch(request, env, ctx): Promise<Response> {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return buildTextResponse('Method Not Allowed', 405, {
        Allow: 'GET, HEAD',
      });
    }

    try {
      return await serveAsset(request, loadConfig(env), ctx);
    } catch (error) {
      console.error('Request failed', error);
      return buildTextResponse('Internal Server Error', 500);
    }
  },
} satisfies ExportedHandler<Env>;
