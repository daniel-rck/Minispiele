interface Env {
  ASSETS: Fetcher;
}

// Paths whose responses must not be cached by browsers / installed PWAs.
// Hash-named assets under /assets/ are content-addressed and keep their
// long-lived caches from the asset binding's defaults.
const NO_CACHE_PATHS = new Set<string>([
  '/',
  '/index.html',
  '/index.js', // service worker (vite-plugin-pwa injectManifest output)
  '/manifest.webmanifest',
  '/sw.js',
  '/registerSW.js',
]);

function needsNoCache(pathname: string): boolean {
  if (NO_CACHE_PATHS.has(pathname)) return true;
  if (pathname.endsWith('.html')) return true;
  return false;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/healthz') {
      return new Response('ok', {
        status: 200,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }

    const response = await env.ASSETS.fetch(request);
    if (needsNoCache(url.pathname)) {
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'no-cache, must-revalidate');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
    return response;
  },
};
