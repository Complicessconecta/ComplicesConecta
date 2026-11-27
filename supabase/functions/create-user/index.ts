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
    // C2: only a logged-in admin may create users (was: unauthenticated).
    const auth = await authenticate(req);
    if ("response" in auth) return auth.response;

    const denied = await requireAdmin(req, auth.user, auth.supabase);
    if (denied) return denied;

    const supabaseClient = auth.supabase;

    const { email, password, profileType, name } = await req.json();

    // 1. Create user in Auth
    const { data: userData, error: userError } =
      await supabaseClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          display_name: name,
          profile_type: profileType,
        },
      });

    if (userError) throw userError;

    // 2. Update profile if necessary (triggers usually handle creation)
    if (userData.user) {
      // Wait a small moment for trigger? Or just update.
      // We'll attempt an update to ensure fields are set correctly
      const { error: _profileError } = await supabaseClient
        .from("profiles")
        .update({
          account_type: profileType,
          display_name: name,
          is_verified: false,
          is_premium: false,
        })
        .eq("id", userData.user.id);

      // If update returned 0 rows or error, it might mean trigger hasn't fired or failed.
      // But for now we assume auth creation is the critical part.
    }

    return new Response(JSON.stringify(userData), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
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
