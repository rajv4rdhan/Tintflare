import { ConfigurationError, loadConfig } from './config';
import { serveAsset } from './handlers/assets';
import { buildTextResponse } from './lib/http';
import { ServerTiming, withServerTiming } from './lib/server-timing';

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const started = performance.now();
    const timing = new ServerTiming();

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      timing.add('cache', undefined, 'BYPASS');
      timing.add('total', performance.now() - started);

      return withServerTiming(
        buildTextResponse('Method Not Allowed', 405, {
          Allow: 'GET, HEAD',
        }),
        timing,
      );
    }

    try {
      const response = await serveAsset(request, loadConfig(env), ctx, timing);
      timing.add('total', performance.now() - started);

      return withServerTiming(response, timing);
    } catch (error) {
      if (error instanceof ConfigurationError) {
        console.error('Worker configuration error', error);
        timing.add('total', performance.now() - started);

        return withServerTiming(
          buildTextResponse('Worker is not configured correctly', 500),
          timing,
        );
      }

      console.error('Request failed', error);
      timing.add('total', performance.now() - started);

      return withServerTiming(
        buildTextResponse('Internal Server Error', 500),
        timing,
      );
    }
  },
} satisfies ExportedHandler<Env>;
