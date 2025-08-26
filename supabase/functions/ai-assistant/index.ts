// supabase/functions/ai-assistant/index.ts
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const allowedOrigins = [
  "https://automatenance.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
];
function corsFor(origin: string) {
  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

type PlanKey = "free" | "pro";
const PLAN_LIMITS: Record<PlanKey, { per_min: number; per_day: number }> = {
  free: { per_min: 2,  per_day: 20  },  // adjust as you like
  pro:  { per_min: 20, per_day: 500 },  // adjust as you like
};

serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const cors = corsFor(origin);

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  try {
    // Service-role client so we can read subscriptions + call RPC atomically.
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verify the caller (uses their Bearer token)
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized (no token)" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Parse JSON body safely
    let body: unknown;
    try { body = await req.json(); } catch { body = {}; }
    const { message, history = [] } = (body ?? {}) as { message?: string; history?: Array<{role: string; content: string}> };

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Enforce message/history bounds to avoid abuse
    const MAX_MSG_CHARS = 2000;
    const MAX_HISTORY   = 20;
    const safeMessage   = message.slice(0, MAX_MSG_CHARS);
    const safeHistory   = Array.isArray(history) ? history.slice(-MAX_HISTORY) : [];

    // Determine plan from subscriptions (enforce server-side)
    // Expect your `subscriptions` table to have: user_id, status, ai_access (boolean)
    const { data: sub, error: subErr } = await admin
      .from("subscriptions")
      .select("status, ai_access")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subErr) {
      console.error("subscriptions lookup error:", subErr);
      return new Response(JSON.stringify({ error: "Subscription lookup failed" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const isPro: boolean = !!(sub && sub.status === "active" && sub.ai_access === true);
    const plan: PlanKey = isPro ? "pro" : "free";
    if (!isPro) {
      return new Response(JSON.stringify({ error: "Pro subscription required" }), {
        status: 403, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // --- Rate limiting (atomic via RPC) ---
    // SQL for the RPC is below in section B.
    // We keep a row per (user_id, bucket='chat', window_start)
    const bucket = "chat";

    // minute window
    const { data: minCount, error: minErr } = await admin.rpc("increment_ai_usage", {
      p_user: userId,
      p_bucket: bucket,
      p_window: "minute",
    });
    if (minErr) {
      console.error("minute limiter error:", minErr);
      return new Response(JSON.stringify({ error: "Rate limiter failed" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if ((minCount as number) > PLAN_LIMITS[plan].per_min) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded (per minute)" }), {
        status: 429, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // day window
    const { data: dayCount, error: dayErr } = await admin.rpc("increment_ai_usage", {
      p_user: userId,
      p_bucket: bucket,
      p_window: "day",
    });
    if (dayErr) {
      console.error("day limiter error:", dayErr);
      return new Response(JSON.stringify({ error: "Rate limiter failed" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if ((dayCount as number) > PLAN_LIMITS[plan].per_day) {
      return new Response(JSON.stringify({ error: "Daily rate limit exceeded" }), {
        status: 429, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // If no OpenAI key set, return a mock response (still rate-limited above)
    if (!OPENAI_KEY) {
      const msg = "Auto-Assist is not configured (OPENAI_API_KEY missing).";
      return new Response(JSON.stringify({ response: msg, isMock: true }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Build OpenAI messages (truncated)
    const messages = [
      {
        role: "system",
        content:
          "You are Auto-Assist AI, a specialized vehicle maintenance assistant. Provide helpful, accurate advice about vehicle maintenance, troubleshooting, and repairs. Be concise but thorough. If you don't know something, be honest about it. Always prioritize safety.",
      },
      ...safeHistory,
      { role: "user", content: safeMessage },
    ];

    // Call OpenAI
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!resp.ok) {
      let detail = "";
      try { detail = (await resp.json())?.error?.message || ""; } catch {}
      const errMsg = `OpenAI error ${resp.status}${detail ? `: ${detail}` : ""}`;
      const status = resp.status === 429 ? 429 : 502;
      return new Response(JSON.stringify({ error: errMsg }), {
        status,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const content: string =
      data?.choices?.[0]?.message?.content ?? "[No AI response returned]";

    return new Response(JSON.stringify({ response: content }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-assistant unhandled error:", e);
    const msg =
      e && typeof e === "object" && "message" in e
        ? String((e as { message: unknown }).message)
        : "Server error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
