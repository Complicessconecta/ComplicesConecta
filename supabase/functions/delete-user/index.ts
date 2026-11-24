import { serve } from "std/http/server.ts";
import {
  authenticate,
  getCorsHeaders,
  handleOptions,
  requireAdmin,
} from "../_shared/auth.ts";

serve(async (req: Request) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    // C2: only a logged-in admin may delete users (was: unauthenticated).
    const auth = await authenticate(req);
    if ("response" in auth) return auth.response;

    const denied = await requireAdmin(req, auth.user, auth.supabase);
    if (denied) return denied;

    const supabaseClient = auth.supabase;

    const { userId } = await req.json();

    if (!userId) {
      throw new Error("userId is required");
    }

    const { error } = await supabaseClient.auth.admin.deleteUser(userId);
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});
