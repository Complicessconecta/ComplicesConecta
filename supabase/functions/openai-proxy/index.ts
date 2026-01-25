// supabase/functions/openai-proxy/index.ts

import { serve } from "std/http/server.ts";
import { OpenAI } from "openai";

// IMPORTANT: Set this in your Supabase project's environment variables
// Command: supabase secrets set OPENAI_API_KEY <your-key>
const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") || "" });

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // Adjust for production
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { model, messages } = await req.json();

    if (!model || !messages) {
      return new Response(
        JSON.stringify({ error: "model and messages are required" }),
        {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    const chatCompletion = await openai.chat.completions.create({
      model,
      messages,
    });

    return new Response(JSON.stringify(chatCompletion), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
