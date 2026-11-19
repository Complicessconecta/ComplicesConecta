import {
  authenticate,
  getCorsHeaders,
  handleOptions,
  jsonResponse,
} from "../_shared/auth.ts";

const PINATA_JWT = Deno.env.get("PINATA_JWT") || "";
const PINATA_API_URL = "https://api.pinata.cloud";

// Closed list: each allowed method may only hit its matching path.
// The caller supplies `method` AND `path`; both must agree, so a caller
// cannot smuggle an arbitrary Pinata path through an allowed method.
const ALLOWED_PINATA_ROUTES: Record<string, string> = {
  "pinning/pinFileToIPFS": "/pinning/pinFileToIPFS",
  "pinning/unpin": "/pinning/unpin",
};

// JWT complement (2026-11-19): real multipart upload support.
//
// BEFORE: the only caller (NFTService.uploadImageToIPFS) built a FormData,
// nested it inside a JSON body, and this proxy forwarded
// `JSON.stringify(body)` with `Content-Type: application/json`.
// `JSON.stringify(new FormData())` is `{}`, so the file bytes NEVER reached
// Pinata through this path, even before C2.
//
// AFTER: the caller passes the FormData itself as the top-level body of
// `supabase.functions.invoke("pinata-proxy", { body: formData })`.
// Verified against the vendored @supabase/functions-js 2.4.1 source
// (bundled with @supabase/supabase-js 2.45.0 in supabase/functions/deno.json;
// the web client uses ^2.104.0, same behaviour): `invoke` checks
// `functionArgs instanceof FormData` at the TOP level only and, in that
// branch, sets NO Content-Type header and passes the FormData through
// untouched — fetch/the browser then sets
// `multipart/form-data; boundary=...` itself. A FormData nested inside a
// JSON object does NOT take that branch: it is JSON.stringified to `{}`.
// The repo's custom fetch wrapper (SecurityHelpers.createSecureFetch) passes
// `init` through to native fetch without touching the body or Content-Type,
// so the boundary survives. The routing fields (`method`, `path`,
// `apiBase`) travel as string fields INSIDE the same FormData, because
// `invoke` has no other channel for them (its options are only
// headers/method/region).
//
// This proxy branches on the request Content-Type:
// - `multipart/form-data` -> ONLY `pinning/pinFileToIPFS` (a file upload
//   makes no sense for `unpin`). The `file` part is required; the proxy
//   re-forwards a CLEAN FormData containing only `file`,
//   `pinataMetadata` and `pinataOptions` — nothing else the caller sent
//   (no `method`/`path`/`apiBase`) reaches Pinata.
// - anything else -> the legacy JSON branch (used by `pinning/unpin`,
//   which has no file). A multipart request for `unpin` is rejected 400.
// In both branches a missing PINATA_JWT is an explicit 500 (was: Pinata
// would answer 401 with an empty Bearer token and the cause was opaque).

Deno.serve(async (req: Request) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: getCorsHeaders(req),
    });
  }

  // C2: only a logged-in user may spend the server's Pinata JWT
  // (was: unauthenticated). Callers must send their session JWT.
  const auth = await authenticate(req);
  if ("response" in auth) return auth.response;

  if (!PINATA_JWT) {
    return jsonResponse(
      req,
      { error: "PINATA_JWT is not configured on the server" },
      500,
    );
  }

  try {
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      return await handleMultipartUpload(req);
    }

    return await handleJsonCall(req);
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});

/** Validate method/path against the closed allowlist. Returns an error
 *  Response to return directly, or null when the pair is allowed. */
function validateRoute(
  req: Request,
  method: unknown,
  path: unknown,
): Response | null {
  const expectedPath = ALLOWED_PINATA_ROUTES[method as string];
  if (!expectedPath) {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: getCorsHeaders(req),
    });
  }
  if (path !== expectedPath) {
    return jsonResponse(
      req,
      { error: `Invalid path for method ${method}: expected ${expectedPath}` },
      400,
    );
  }
  return null;
}

/**
 * Multipart branch: only `pinning/pinFileToIPFS`. Reads the routing fields
 * (`method`, `path`, `apiBase`) and the upload fields (`file`,
 * `pinataMetadata`, `pinataOptions`) from the incoming FormData, requires
 * the `file` part, and re-forwards a clean FormData with ONLY the three
 * upload fields to Pinata (no routing fields, no extra caller fields).
 */
async function handleMultipartUpload(req: Request): Promise<Response> {
  const formData = await req.formData();

  const method = formData.get("method");
  const path = formData.get("path");
  const apiBase = formData.get("apiBase");

  const routeError = validateRoute(req, method, path);
  if (routeError) return routeError;

  // Multipart is only for file uploads.
  if (method !== "pinning/pinFileToIPFS") {
    return jsonResponse(
      req,
      { error: "multipart/form-data is only accepted for pinFileToIPFS" },
      400,
    );
  }

  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return jsonResponse(
      req,
      { error: "file part is required for pinFileToIPFS" },
      400,
    );
  }

  const forward = new FormData();
  forward.append("file", file);
  const pinataMetadata = formData.get("pinataMetadata");
  if (typeof pinataMetadata === "string") {
    forward.append("pinataMetadata", pinataMetadata);
  }
  const pinataOptions = formData.get("pinataOptions");
  if (typeof pinataOptions === "string") {
    forward.append("pinataOptions", pinataOptions);
  }

  const base =
    typeof apiBase === "string" && apiBase ? apiBase : PINATA_API_URL;
  const url = `${base}${path as string}`;

  // No Content-Type header here: fetch sets multipart/form-data with its
  // own boundary for the re-built FormData.
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: forward,
  });

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    status: response.status,
  });
}

/**
 * JSON branch (unchanged behaviour, kept for `pinning/unpin`, which has no
 * file): `{ method, path, apiBase?, body }`, forwarded as JSON to Pinata.
 */
async function handleJsonCall(req: Request): Promise<Response> {
  const { method, path, apiBase, body } = await req.json();

  const routeError = validateRoute(req, method, path);
  if (routeError) return routeError;

  const base = typeof apiBase === "string" && apiBase ? apiBase : PINATA_API_URL;
  const url = `${base}${path}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    status: response.status,
  });
}
