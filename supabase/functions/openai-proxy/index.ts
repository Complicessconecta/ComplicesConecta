// supabase/functions/openai-proxy/index.ts

import { serve } from "std/http/server.ts";
import { OpenAI } from "openai";
import {
  authenticate,
  getCorsHeaders,
  handleOptions,
} from "../_shared/auth.ts";

// IMPORTANT: Set this in your Supabase project's environment variables
// Command: supabase secrets set OPENAI_API_KEY <your-key>
const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") || "" });

// JWT complement (2026-11-19): closed model allowlist. Default is exactly
// the two models the repo actually calls (verified by grep in src/):
// - "gpt-4o-mini" (EmotionalAIService)
// - "gpt-4-turbo-preview" (ConsentVerificationService, ChatSummaryService)
// Any other model -> 400. Override with the ALLOWED_OPENAI_MODELS secret
// (comma-separated) if a new model is genuinely needed. The local
// WebLLM models (phi-3, llama-3.2 in AIIntegrationService / AIWorker) do
// NOT go through this proxy and are unaffected.
//
// Spend limits: NOT implemented here. There is no per-user/per-day usage
// table in the repo and inventing one (schema + RLS + counters) is out of
// scope for this patch — still open, needs an owner decision on where the
// counters live. Any authenticated user can still call the allowlisted
// models without a cap.
const ALLOWED_OPENAI_MODELS = (
  Deno.env.get("ALLOWED_OPENAI_MODELS") || "gpt-4o-mini, gpt-4-turbo-preview"
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

// Optional chat-completion params the repo's callers use. Only these three
// are forwarded, each validated; anything else in the request is ignored
// (never passed through blindly to the OpenAI SDK).
function parseOptionalParams(body: Record<string, unknown>): {
  params: Record<string, unknown>;
  error?: string;
} {
  const params: Record<string, unknown> = {};

  if (body.temperature !== undefined) {
    if (
      typeof body.temperature !== "number" ||
      body.temperature < 0 ||
      body.temperature > 2
    ) {
      return { params, error: "temperature must be a number between 0 and 2" };
    }
    params.temperature = body.temperature;
  }

  if (body.max_tokens !== undefined) {
    if (
      typeof body.max_tokens !== "number" ||
      !Number.isInteger(body.max_tokens) ||
      body.max_tokens < 1 ||
      body.max_tokens > 4096
    ) {
      return {
        params,
        error: "max_tokens must be an integer between 1 and 4096",
      };
    }
    params.max_tokens = body.max_tokens;
  }

  if (body.response_format !== undefined) {
    const rf = body.response_format as Record<string, unknown> | null;
    if (
      !rf ||
      typeof rf !== "object" ||
      (rf.type !== "json_object" && rf.type !== "text")
    ) {
      return {
        params,
        error:
          'response_format must be { type: "json_object" } or { type: "text" }',
      };
    }
    params.response_format = { type: rf.type };
  }

  return { params };
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    // C2: only a logged-in user may spend the server's OpenAI key
    // (was: unauthenticated). No per-user spend limit yet — see header.
    const auth = await authenticate(req);
    if ("response" in auth) return auth.response;

    const body = await req.json();
    const { model, messages } = body;

    if (!model || !messages) {
      return new Response(
        JSON.stringify({ error: "model and messages are required" }),
        {
          status: 400,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (!ALLOWED_OPENAI_MODELS.includes(model)) {
      return new Response(
        JSON.stringify({
          error: `model not allowed: ${model}. Allowed: ${ALLOWED_OPENAI_MODELS.join(", ")}`,
        }),
        {
          status: 400,
          headers: {
            ...getCorsHeaders(req),
            "Content-Type": "application/json",
          },
        },
      );
    }

    const { params, error: paramsError } = parseOptionalParams(body);
    if (paramsError) {
      return new Response(JSON.stringify({ error: paramsError }), {
        status: 400,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      });
    }

    const chatCompletion = await openai.chat.completions.create({
      model,
      messages,
      ...params,
    });

    return new Response(JSON.stringify(chatCompletion), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      },
    );
  }
});
