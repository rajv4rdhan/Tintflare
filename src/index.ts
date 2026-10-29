const B2_ACCOUNT_ID = '';
const B2_APPLICATION_KEY = '';
const B2_BUCKET_NAME = 'test01s';
 
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const key = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
 
    // ⚡ CACHING LAYER - Check cache first
    const cache = caches.default;
    const cacheKey = new Request(request.url, request);
 
    let cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
 
 
    const authHeader = `Basic ${btoa(`${B2_ACCOUNT_ID}:${B2_APPLICATION_KEY}`)}`;
    const authResp = await fetch(`https://api.backblazeb2.com/b2api/v2/b2_authorize_account`, {
      headers: {
        'Authorization': authHeader,
      },
    });
 
    if (!authResp.ok) {
      return new Response('Authentication failed', { status: 401 });
    }
 
    const authData = await authResp.json();
 
    const downloadUrl = `${authData.downloadUrl}/file/${B2_BUCKET_NAME}/${key}`;
 
    const resp = await fetch(downloadUrl, {
      headers: {
        'Authorization': authData.authorizationToken,
      },
    });
 
    if (!resp.ok) {
      return await serve404Page(authData);
    }
 
    const response = new Response(resp.body, {
      headers: {
        'Content-Type': resp.headers.get('Content-Type'),
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
        'ETag': resp.headers.get('ETag') || `"${Date.now()}"`, // Add ETag for better caching
        'Last-Modified': resp.headers.get('Last-Modified') || new Date().toUTCString(),
      },
    });
 
    // ⚡ CACHE THE RESPONSE - Store in Cloudflare cache for next time
    const responseToCache = response.clone();
    ctx.waitUntil(cache.put(cacheKey, responseToCache));
    console.log('💾 Cached response for:', key);
 
    return response;
  },
};
 
async function serve404Page(authData) {
  try {
    const notFoundUrl = `${authData.downloadUrl}/file/${B2_BUCKET_NAME}/404.html`;
 
    const notFoundResp = await fetch(notFoundUrl, {
      headers: {
        'Authorization': authData.authorizationToken,
      },
    });
 
    if (notFoundResp.ok) {
      return new Response(notFoundResp.body, {
        status: 404,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  } catch (error) {
    console.log('Error fetching 404.html:', error);
  }
 
  // Fallback to simple 404 message if 404.html doesn't exist
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>404 - Page Not Found</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; margin-top: 100px; }
        h1 { color: #e74c3c; }
      </style>
    </head>
    <body>
      <h1>404 - Page Not Found</h1>
      <p>The requested file could not be found.</p>
    </body>
    </html>
  `, {
    status: 404,
    headers: {
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*',
    },
  });
}