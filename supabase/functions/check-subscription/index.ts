import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const allowedOrigins = [
  "https://automatenance.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
];

function getCorsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
      ? origin
      : allowedOrigins[0],
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

type SubResponse = {
  subscribed: boolean;
  plan: "free" | "pro" | "premium" | "pro-override";
  vehicles_limit: number;     // -1 = unlimited
  maintenance_limit: number;  // -1 = unlimited
  ai_access: boolean;
  ai_predictions: boolean;
  current_period_end?: string | null;
};

serve(async (req) => {
  const reqOrigin = req.headers.get("origin") || "";
  const corsHeaders = getCorsHeaders(reqOrigin);

  // Debug
  console.log("check-subscription - Origin:", reqOrigin, "Method:", req.method);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Env
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";

  // Optional: map real Stripe price IDs via env (falls back to placeholders)
  const PRICE_PRO = Deno.env.get("STRIPE_PRICE_PRO") || "price_pro";
  const PRICE_PREMIUM = Deno.env.get("STRIPE_PRICE_PREMIUM") || "price_premium";

  try {
    // --- Auth: verify caller ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized (missing Authorization)" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const token = authHeader.replace("Bearer ", "");

    // Service role client (no RLS)
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    // --- A) Developer override via app_metadata.pro_override ---
    const proOverride = Boolean(user.app_metadata?.pro_override);
    if (proOverride) {
      const resp: SubResponse = {
        subscribed: true,
        plan: "pro-override",
        vehicles_limit: -1,
        maintenance_limit: -1,
        ai_access: true,
        ai_predictions: true,
        current_period_end: null,
      };

      // Best-effort upsert into subscriptions to keep UI consistent
      try {
        await admin.from("subscriptions").upsert(
          {
            user_id: user.id,
            plan: "pro-override",
            status: "override",
            stripe_customer_id: null,
            stripe_subscription_id: null,
            current_period_end: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      } catch (e) {
        console.warn("subscriptions upsert (override) warning:", e);
      }

      return new Response(JSON.stringify(resp), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- B) If no Stripe configured, default to FREE (no override) ---
    if (!STRIPE_SECRET_KEY) {
      const resp: SubResponse = {
        subscribed: false,
        plan: "free",
        vehicles_limit: 1,
        maintenance_limit: 25,
        ai_access: false,
        ai_predictions: false,
      };
      return new Response(JSON.stringify(resp), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- C) Stripe-backed plans ---
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

    // Look up by email (simple path). If you store stripe_customer_id, prefer that.
    const customers = await stripe.customers.list({ email: user.email ?? undefined, limit: 1 });
    if (customers.data.length === 0) {
      const resp: SubResponse = {
        subscribed: false,
        plan: "free",
        vehicles_limit: 1,
        maintenance_limit: 25,
        ai_access: false,
        ai_predictions: false,
      };
      return new Response(JSON.stringify(resp), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customer = customers.data[0];

    // Active subscriptions only
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "active",
      expand: ["data.items.data.price.product"],
    });

    if (subs.data.length === 0) {
      const resp: SubResponse = {
        subscribed: false,
        plan: "free",
        vehicles_limit: 1,
        maintenance_limit: 25,
        ai_access: false,
        ai_predictions: false,
      };
      return new Response(JSON.stringify(resp), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sub = subs.data[0];
    const priceId = sub.items.data[0].price.id;

    // Map Stripe price → plan
    let resp: SubResponse = {
      subscribed: true,
      plan: "free",
      vehicles_limit: 1,
      maintenance_limit: 25,
      ai_access: false,
      ai_predictions: false,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    };

    if (priceId === PRICE_PRO) {
      resp = {
        subscribed: true,
        plan: "pro",
        vehicles_limit: 5,
        maintenance_limit: 500,
        ai_access: true,
        ai_predictions: true,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      };
    } else if (priceId === PRICE_PREMIUM) {
      resp = {
        subscribed: true,
        plan: "premium",
        vehicles_limit: -1,
        maintenance_limit: -1,
        ai_access: true,
        ai_predictions: true,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      };
    }

    // Persist a snapshot (best-effort)
    try {
      await admin.from("subscriptions").upsert(
        {
          user_id: user.id,
          stripe_customer_id: customer.id,
          stripe_subscription_id: sub.id,
          plan: resp.plan,
          status: sub.status,
          current_period_end: resp.current_period_end,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    } catch (e) {
      console.warn("subscriptions upsert warning:", e);
    }

    return new Response(JSON.stringify(resp), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("check-subscription error:", error);
    return new Response(
      JSON.stringify({
        error: (error as { message?: string })?.message ?? "Failed to check subscription",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
