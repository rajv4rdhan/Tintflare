import type { AppConfig } from '../config';
import { buildHtmlResponse } from '../lib/http';
import { fetchFile } from '../services/backblaze';

const NOT_FOUND_KEY = '404.html';
const NOT_FOUND_MAX_AGE = 60 * 60;

const FALLBACK_404 = `<!DOCTYPE html>
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

export async function serveNotFound(config: AppConfig): Promise<Response> {
  try {
    const response = await fetchFile(config, NOT_FOUND_KEY);
    if (response.ok) {
      return buildHtmlResponse(response.body, 404, NOT_FOUND_MAX_AGE);
    }
  } catch (error) {
    console.error('Failed to fetch 404.html', error);
  }

  return buildHtmlResponse(FALLBACK_404, 404, 0);
}
