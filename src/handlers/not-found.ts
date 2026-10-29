import type { AppConfig } from '../config';
import { buildHtmlResponse } from '../lib/http';
import { downloadFile, type B2Authorization } from '../services/backblaze';

const NOT_FOUND_OBJECT_KEY = '404.html';
const NOT_FOUND_CACHE_SECONDS = 60 * 60;

const FALLBACK_NOT_FOUND_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>404 - Page Not Found</title>
    <style>
      body { font-family: system-ui, sans-serif; text-align: center; margin-top: 100px; }
      h1 { color: #e74c3c; }
    </style>
  </head>
  <body>
    <h1>404 - Page Not Found</h1>
    <p>The requested file could not be found.</p>
  </body>
</html>`;

/**
 * Serves the bucket's custom `404.html` when available, otherwise a built-in
 * fallback page.
 */
export async function serveNotFound(
  config: AppConfig,
  authorization: B2Authorization,
): Promise<Response> {
  try {
    const response = await downloadFile(
      authorization,
      config.bucketName,
      NOT_FOUND_OBJECT_KEY,
    );

    if (response.ok) {
      return buildHtmlResponse(response.body, 404, NOT_FOUND_CACHE_SECONDS);
    }
  } catch (error) {
    console.error('Failed to fetch custom 404 page', error);
  }

  return buildHtmlResponse(FALLBACK_NOT_FOUND_HTML, 404, 0);
}
