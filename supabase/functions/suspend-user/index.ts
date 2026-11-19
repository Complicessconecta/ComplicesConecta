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
    // C2: only a logged-in admin may suspend/reactivate users (was: unauthenticated).
    const auth = await authenticate(req);
    if ("response" in auth) return auth.response;

    const denied = await requireAdmin(req, auth.user, auth.supabase);
    if (denied) return denied;

    const supabaseClient = auth.supabase;

    const { userId, action, reason } = await req.json(); // action: 'suspend' | 'activate'

    if (action === "suspend") {
      // Ban user in Auth (100 years)
      const { error: banError } =
        await supabaseClient.auth.admin.updateUserById(userId, {
          ban_duration: "876000h",
        });
      if (banError) throw banError;

      // Update profile
      const { error: profileError } = await supabaseClient
        .from("profiles")
        .update({
          suspended: true,
          suspended_at: new Date().toISOString(),
          suspended_reason: reason,
        })
        .eq("id", userId);
      if (profileError) throw profileError;
    } else if (action === "activate") {
      // Unban user
      const { error: unbanError } =
        await supabaseClient.auth.admin.updateUserById(userId, {
          ban_duration: "0",
        });
      if (unbanError) throw unbanError;

      // Update profile
      const { error: profileError } = await supabaseClient
        .from("profiles")
        .update({
          suspended: false,
          suspended_at: undefined,
          suspended_reason: undefined,
        })
        .eq("id", userId);
      if (profileError) throw profileError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 400,
    });
  }
});
