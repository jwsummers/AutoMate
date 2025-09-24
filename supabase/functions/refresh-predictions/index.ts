
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const allowedOrigins = [
  "https://automatenance.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:8080",
];
const cors = (o: string) => ({
  "Access-Control-Allow-Origin": allowedOrigins.includes(o) ? o : allowedOrigins[0],
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
});

type PlanKey = "free" | "pro";
const TOKEN_BUDGET: Record<PlanKey, { per_day_calls: number }> = {
  free: { per_day_calls: 0 },
  pro:  { per_day_calls: 50 },
};

interface VehicleRow {
  id: string;
  make: string;
  model: string;
  year: number | null;
  mileage: number | null;
}

interface MaintRow {
  id: string;
  vehicle_id: string;
  type: string;
  date: string;
  mileage: number | null;
  notes: string | null;
  description: string | null;
}

interface AiCacheRow {
  key: string;
  user_id: string;
  value: Record<string, unknown> | null;
  updated_at: string;
  ttl_seconds: number;
}

interface RagDoc {
  text: string;
  source: string;
  url: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
}

type Urgency = "high" | "medium" | "low";

interface Suggestion {
  title: string;
  description: string;
  predicted_date?: string;
  predicted_mileage?: number | null;
  confidence?: number;
  urgency?: Urgency;
  refs?: string[];
}

interface PredictionInsert {
  user_id: string;
  vehicle_id: string;
  title: string;
  description: string;
  predicted_date: string | null;
  predicted_mileage: number | null;
  confidence: number;
  urgency: Urgency;
  basis: {
    source: "ai" | "local";
    features?: Record<string, unknown>;
    rag_refs?: string[];
  };
  inputs_hash: string;
}

serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(origin) });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const OPENAI_KEY   = Deno.env.get("OPENAI_API_KEY") ?? "";

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: userData, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors(origin), "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    // Pro check
    const { data: sub } = await admin
      .from("subscriptions")
      .select("status, ai_predictions")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const isPro = !!(sub && sub.status === "active" && sub.ai_predictions);
    if (!isPro) {
      return new Response(JSON.stringify({ error: "Pro required" }), {
        status: 403, headers: { ...cors(origin), "Content-Type": "application/json" },
      });
    }

    // Per-day limiter via ai_cache
    const dayKey = `refresh_calls:day:${new Date().toISOString().slice(0,10)}:${user.id}`;
    const { data: dayRow } = await admin
      .from<AiCacheRow>("ai_cache")
      .select("*")
      .eq("key", dayKey)
      .eq("user_id", user.id)
      .maybeSingle();

    let calls = 0;
    if (dayRow?.value && typeof dayRow.value.count === "number") {
      calls = Number(dayRow.value.count);
    }
    const plan: PlanKey = "pro";
    if (calls >= TOKEN_BUDGET[plan].per_day_calls) {
      return new Response(JSON.stringify({ error: "Daily refresh limit reached" }), {
        status: 429, headers: { ...cors(origin), "Content-Type": "application/json" },
      });
    }
    await admin.from("ai_cache").upsert({
      key: dayKey, user_id: user.id, value: { count: calls + 1 }, ttl_seconds: 86400,
    });

    // Body
    let body: unknown = {};
    try {
      body = await req.json();
    } catch (_e) {
      // ignore bad JSON; treat as empty
    }
    const vehicleId = (body as { vehicleId?: string }).vehicleId;

    // Load data
    const { data: vehicles } = await admin
      .from<VehicleRow>("vehicles")
      .select("id, make, model, year, mileage")
      .eq("user_id", user.id);

    if (!vehicles || vehicles.length === 0) {
      return new Response(JSON.stringify({ ok: true, updated: 0 }), {
        headers: { ...cors(origin), "Content-Type": "application/json" },
      });
    }

    const targetVehicles = vehicleId ? vehicles.filter((v) => v.id === vehicleId) : vehicles;

    const { data: maint } = await admin
      .from<MaintRow>("maintenance_records")
      .select("id, vehicle_id, type, date, mileage, notes, description")
      .eq("user_id", user.id);

    const byVehicle = new Map<string, MaintRow[]>();
    for (const v of targetVehicles) byVehicle.set(v.id, []);
    for (const m of (maint ?? [])) {
      if (byVehicle.has(m.vehicle_id)) byVehicle.get(m.vehicle_id)!.push(m);
    }

    let updated = 0;

    for (const v of targetVehicles) {
      const records = (byVehicle.get(v.id) ?? []).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const features = buildFeatures(v, records);
      const localSuggestions = baselinePredict(features);

      // Cache key on inputs
      const inputs = JSON.stringify({ v, features });
      const inputsHash = await hash(inputs);

      const cacheKey = `pred:v:${v.id}:h:${inputsHash}`;
      const { data: cached } = await admin
        .from<AiCacheRow>("ai_cache")
        .select("value, updated_at, ttl_seconds")
        .eq("key", cacheKey)
        .eq("user_id", user.id)
        .maybeSingle();

      const isCacheFresh =
        cached &&
        Date.now() - new Date(cached.updated_at).getTime() < (cached.ttl_seconds * 1000);

      let aiResult: Suggestion[] | null = null;

      if (OPENAI_KEY && !isCacheFresh) {
        // tiny RAG (optional)
        const { data: ragDocs } = await admin
          .from<RagDoc>("ai_docs")
          .select("text, source, url, make, model, year")
          .limit(3)
          .in("make", [v.make, null as unknown as string])
          .in("model", [v.model, null as unknown as string])
          .in("year", [v.year, null as unknown as number]);

        const context = (ragDocs ?? [])
          .map((d) => `Source:${d.source}${d.url ? ` (${d.url})` : ""}\n${truncate(d.text, 700)}`)
          .join("\n---\n");

        const prompt = buildPrompt(v, features, localSuggestions, context);

        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0.4,
            max_tokens: 500,
            messages: [
              {
                role: "system",
                content:
                  "You are Auto-Assist, a cautious maintenance advisor. Use provided context and user history. Provide non-binding suggestions. Do NOT claim manufacturer-authoritative schedules.",
              },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (resp.ok) {
          const out = await resp.json();
          aiResult = safeParseSuggestions(extractMessage(out));
          await admin.from("ai_cache").upsert({
            key: cacheKey,
            user_id: user.id,
            value: { suggestions: aiResult },
            ttl_seconds: 86400,
          });
        }
      } else if (cached?.value && (cached.value as { suggestions?: Suggestion[] }).suggestions) {
        aiResult = (cached.value as { suggestions: Suggestion[] }).suggestions;
      }

      const final = (aiResult && aiResult.length ? aiResult : localSuggestions).slice(0, 6);

      // Replace predictions for this vehicle
      await admin
        .from("maintenance_predictions")
        .delete()
        .eq("user_id", user.id)
        .eq("vehicle_id", v.id);

      const rows: PredictionInsert[] = final.map((p) => ({
        user_id: user.id,
        vehicle_id: v.id,
        title: p.title,
        description: p.description,
        predicted_date: p.predicted_date ?? null,
        predicted_mileage: p.predicted_mileage ?? null,
        confidence: clampInt(p.confidence ?? 60, 1, 99),
        urgency: p.urgency ?? computeUrgency(p),
        basis: {
          source: aiResult ? "ai" : "local",
          features,
          rag_refs: p.refs ?? [],
        },
        inputs_hash: inputsHash,
      }));

      const { error: upErr } = await admin.from("maintenance_predictions").upsert(rows);
      if (!upErr) updated += rows.length;
    }

    return new Response(JSON.stringify({ ok: true, updated }), {
      headers: { ...cors(origin), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("refresh-predictions error:", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500, headers: { ...cors(origin), "Content-Type": "application/json" },
    });
  }
});

/** Helpers */

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}
function clampInt(v: number, lo: number, hi: number) {
  return Math.min(Math.max(Math.round(v), lo), hi);
}

function safeParseSuggestions(s: string | null): Suggestion[] {
  if (!s) return [];
  try {
    const j = JSON.parse(s);
    if (!Array.isArray(j)) return [];
    return j
      .map((x) => ({
        title: String(x.title ?? ""),
        description: String(x.description ?? ""),
        predicted_date: typeof x.predicted_date === "string" ? x.predicted_date : undefined,
        predicted_mileage:
          typeof x.predicted_mileage === "number" ? x.predicted_mileage : undefined,
        confidence: typeof x.confidence === "number" ? x.confidence : undefined,
        urgency: (["high", "medium", "low"] as const).includes(x.urgency)
          ? x.urgency
          : undefined,
        refs: Array.isArray(x.refs) ? x.refs.filter((r: unknown) => typeof r === "string") : [],
      }))
      .filter((x: Suggestion) => x.title && x.description);
  } catch {
    return [];
  }
}

function extractMessage(openai: unknown): string | null {
  try {
    const o = openai as { choices?: Array<{ message?: { content?: string } }> };
    return o?.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

async function hash(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function buildFeatures(v: VehicleRow, records: MaintRow[]) {
  const byType = new Map<string, MaintRow[]>();

  for (const r of records) {
    const t = String(r.type || "").toLowerCase();
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t)!.push(r);
  }

  const feats: {
    last_mileage: number | null;
    avg_days_by_type: Record<string, number | null>;
    avg_miles_by_type: Record<string, number | null>;
    last_date_by_type: Record<string, string | null>;
    last_mileage_by_type: Record<string, number | null>;
  } = {
    last_mileage: v.mileage ?? null,
    avg_days_by_type: {},
    avg_miles_by_type: {},
    last_date_by_type: {},
    last_mileage_by_type: {},
  };

  const avg = (xs: number[]): number | null =>
    xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null;

  for (const [t, arr] of byType) {
    // sort oldest → newest for delta math
    arr.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const deltasDays: number[] = [];
    const deltasMiles: number[] = [];

    for (let i = 1; i < arr.length; i++) {
      const curDate = new Date(arr[i].date).getTime();
      const prevDate = new Date(arr[i - 1].date).getTime();
      deltasDays.push((curDate - prevDate) / 86_400_000);

      const curMiles = arr[i]?.mileage;
      const prevMiles = arr[i - 1]?.mileage;
      if (typeof curMiles === "number" && typeof prevMiles === "number") {
        deltasMiles.push(curMiles - prevMiles);
      }
    }

    feats.avg_days_by_type[t] = avg(deltasDays);
    feats.avg_miles_by_type[t] = avg(deltasMiles);

    const last = arr[arr.length - 1];
    feats.last_date_by_type[t] = last ? last.date : null;
    feats.last_mileage_by_type[t] = typeof last?.mileage === "number" ? last.mileage : null;
  }

  return feats;
}


function baselinePredict(features: ReturnType<typeof buildFeatures>): Suggestion[] {
  const out: Suggestion[] = [];
  for (const [type, avgDays] of Object.entries(features.avg_days_by_type)) {
    const lastDate = features.last_date_by_type[type];
    if (!avgDays || !lastDate) continue;
    const dt = new Date(lastDate);
    dt.setDate(dt.getDate() + Number(avgDays));
    out.push({
      title: niceTitle(type),
      description: `Based on your history, this typically occurs every ~${avgDays} days.`,
      predicted_date: dt.toISOString().slice(0, 10),
      predicted_mileage:
        features.last_mileage_by_type?.[type] && features.avg_miles_by_type?.[type]
          ? (features.last_mileage_by_type[type] ?? 0) + (features.avg_miles_by_type[type] ?? 0)
          : null,
      confidence: 60,
      urgency: "medium",
    });
  }
  return out.slice(0, 6);
}

function niceTitle(t: string): string {
  const s = t.toLowerCase();
  if (s.includes("oil")) return "Oil Change";
  if (s.includes("brake")) return "Brake Service";
  if (s.includes("tire") && s.includes("rotat")) return "Tire Rotation";
  if (s.includes("air") && s.includes("filter")) return "Air Filter Replacement";
  return "Maintenance";
}

function computeUrgency(p: Suggestion): Urgency {
  try {
    if (p.predicted_date && new Date(p.predicted_date) <= new Date()) return "high";
    return (p.confidence ?? 60) >= 75 ? "medium" : "low";
  } catch {
    return "low";
  }
}

function buildPrompt(
  v: VehicleRow,
  features: ReturnType<typeof buildFeatures>,
  local: Suggestion[],
  context: string
): string {
  return [
    "You will output STRICT JSON array of items:",
    "{title, description, predicted_date?, predicted_mileage?, confidence (1-99), urgency ('high'|'medium'|'low'), refs?: string[]}",
    "Use only provided context. Non-binding advice; do not present as manufacturer schedule.",
    "",
    `VEHICLE: ${v.year ?? "?"} ${v.make} ${v.model}, mileage=${v.mileage ?? "unknown"}`,
    `FEATURES: ${JSON.stringify(features)}`,
    `LOCAL_SUGGESTIONS: ${JSON.stringify(local).slice(0, 1500)}`,
    context ? `CONTEXT:\n${context}` : "CONTEXT: (none)",
  ].join("\n");
}
