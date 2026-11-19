// supabase/functions/stripe-webhook/index.ts
//
// DISABLED — returns 410 Gone. (C2 fix; see C2_FIX_SUMMARY.md.)
//
// Rationale: the previous file was not a webhook at all. It was a copy of
// the send-email handler: it parsed an email request body, only logged the
// email that "would be sent", and returned success — with no Stripe
// signature verification (`stripe.webhooks.constructEvent`), no event
// handling, and it did not even call `serve()`, so it could never have run
// as a deployed function. Nothing in `src/` calls this function (verified
// by grep at patch time), and no real Stripe webhook is validated anywhere
// in the repo.
//
// Owner decision still open: either DELETE this function (and remove it
// from the Supabase dashboard if deployed) or REWRITE it as a real Stripe
// webhook with signature verification against a STRIPE_WEBHOOK_SECRET.
// Until then, every request gets 410 Gone so a misconfigured Stripe
// dashboard fails loudly instead of silently "succeeding".

import { handleOptions, jsonResponse } from "../_shared/auth.ts";

Deno.serve((req: Request) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  return jsonResponse(
    req,
    {
      error: "Gone",
      message:
        "stripe-webhook is disabled: the previous implementation was a copy of send-email with no Stripe signature verification and no event handling, and nothing in the app calls it. Delete this function or rewrite it as a real Stripe webhook (see C2_FIX_SUMMARY.md).",
    },
    410,
  );
});
