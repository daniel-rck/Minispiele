import { json, routeRequest } from "./base.ts";

export interface Env {
  ASSETS: Fetcher;
}

// Static assets (SPA fallback included), /healthz and security headers come
// from the owned base.ts; caching headers for assets from public/_headers.
export default {
  fetch: (request, env, ctx) => routeRequest(request, env, ctx, handleApi),
} satisfies ExportedHandler<Env>;

/** Everything under `/api`. Minispiele has no API: every route is a JSON 404. */
async function handleApi(_request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
  return json({ error: "not_found" }, 404);
}
