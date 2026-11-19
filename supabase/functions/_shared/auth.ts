// supabase/functions/_shared/auth.ts
//
// Shared authentication + CORS helpers for Supabase Edge Functions.
// Introduced by the C2 fix (see C2_FIX_SUMMARY.md and the forensic audit
// ANALISIS_FORENSE.md §C2): the functions that use a service_role key must
// verify the caller before acting.
//
// Rules implemented here:
// - authenticate(): the caller must send `Authorization: Bearer <user JWT>`.
//   The token is validated with `supabase.auth.getUser(token)` on a
//   service_role client. Missing token -> 401, invalid token -> 401.
// - requireAdmin(): the caller must have an ACTIVE row in the existing
//   `admin_users` table (`user_id = <caller id>` AND `is_active = true`),
//   otherwise 403. It does NOT use `rpc("is_admin")`: that function reads
//   `auth.uid()`, which is null on a service_role client, so it would
//   always deny (or misbehave) here.
// - CORS: the request `Origin` is echoed ONLY if it is listed in the
//   `ALLOWED_ORIGINS` secret (comma-separated list). If the secret is unset
//   or the origin is not listed, no `Access-Control-Allow-Origin` header is
//   sent (fail closed). No origin is hardcoded anywhere. The old wildcard
//   `"*"` must not come back.

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

export interface AuthSuccess {
  user: User;
  /** Service-role client, already authenticated as the validated user. */
  supabase: SupabaseClient;
}

export interface AuthFailure {
  /** Ready-to-return 401 response (already carries CORS headers). */
  response: Response;
}

/** Build the CORS headers for this request (fail closed, see header). */
export function getCorsHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  const origin = req.headers.get("origin");
  const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (
    origin &&
    allowedOrigins.some((o) => o.toLowerCase() === origin.toLowerCase())
  ) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

/**
 * Answer a CORS preflight request. Returns the preflight Response, or null
 * when this is not an OPTIONS request (caller continues normally).
 */
export function handleOptions(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }
  return null;
}

/** JSON response carrying this request's CORS headers. */
export function jsonResponse(
  req: Request,
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

function unauthorized(req: Request, message: string): AuthFailure {
  return { response: jsonResponse(req, { error: message }, 401) };
}

/**
 * Validate the caller's user JWT. Returns `{ user, supabase }` on success,
 * or `{ response }` (a 401) on failure — callers must return that response:
 *
 *   const auth = await authenticate(req);
 *   if ("response" in auth) return auth.response;
 */
export async function authenticate(
  req: Request,
): Promise<AuthSuccess | AuthFailure> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) {
    return unauthorized(req, "Missing Supabase env");
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!token) {
    return unauthorized(req, "Missing Authorization");
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(
    token,
  );
  if (userError || !userData?.user) {
    return unauthorized(req, "Invalid token");
  }

  return { user: userData.user, supabase };
}

/**
 * Require an active admin row for the already-authenticated user.
 * Returns null when the user is an active admin, otherwise a ready-to-return
 * 403 Response (callers must return it):
 *
 *   const denied = await requireAdmin(req, auth.user, auth.supabase);
 *   if (denied) return denied;
 */
export async function requireAdmin(
  req: Request,
  user: User,
  supabase: SupabaseClient,
): Promise<Response | null> {
  const { data, error } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return jsonResponse(req, { error: "Forbidden" }, 403);
  }
  return null;
}
