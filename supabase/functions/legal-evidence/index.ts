import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const parseCsvEnv = (value: string | undefined): string[] => {
  return (value || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase env" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7)
      : "";

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(
      token,
    );
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const requester = userData.user;
    const requesterEmail = (requester.email || "").toLowerCase();

    const exemptEmails = parseCsvEnv(Deno.env.get("LEGAL_AUDIT_EXEMPT_EMAILS"));
    const isAuditExempt = exemptEmails.includes(requesterEmail);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", requester.id)
      .maybeSingle();

    const role = (profileData as any)?.role as string | undefined;
    const isAllowedRole = role === "admin" || role === "moderator";

    if (!isAuditExempt && !isAllowedRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const url = new URL(req.url);
    const targetUserId = url.searchParams.get("user_id");
    const documentSlug = url.searchParams.get("document_slug");
    const limitParam = url.searchParams.get("limit");
    const limit = Math.min(Math.max(parseInt(limitParam || "50", 10) || 50, 1), 200);

    let query = supabase
      .from("legal_consents")
      .select(
        "id,user_id,document_slug,document_version,accepted_at,ip,user_agent,device_info,evidence_encrypted,created_at",
      )
      .order("accepted_at", { ascending: false })
      .limit(limit);

    if (targetUserId) query = query.eq("user_id", targetUserId);
    if (documentSlug) query = query.eq("document_slug", documentSlug);

    const { data: consents, error: consentsError } = await query;
    if (consentsError) {
      return new Response(JSON.stringify({ error: consentsError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!isAuditExempt) {
      const ipHeader =
        req.headers.get("x-forwarded-for") ||
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-real-ip") ||
        null;
      const ip = ipHeader ? ipHeader.split(",")[0].trim() : null;
      const userAgent = req.headers.get("user-agent") || null;

      const reason = req.headers.get("x-audit-reason") || null;

      await supabase.from("legal_access_audit").insert({
        accessed_by: requester.id,
        action: "read_legal_consents",
        target_table: "legal_consents",
        target_id: null,
        reason,
        ip,
        user_agent: userAgent,
      });
    }

    return new Response(JSON.stringify({ data: consents, audit_exempt: isAuditExempt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
