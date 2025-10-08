// supabase/functions/intake/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1";

type UUID = string;

type NewLogInput = {
  vehicle_id: UUID;
  date: string;               // 'YYYY-MM-DD'
  mileage: number | null;
  vendor_name: string | null;
  location: string | null;
  invoice_number: string | null;
  labor_cost: number | null;
  parts_cost: number | null;
  taxes: number | null;
  notes: string | null;
};

type NewItemInput = {
  type: string;
  description?: string | null;
  status?: "completed" | "upcoming" | "overdue";
  cost?: number | null;
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,  // service role (server-only)
  { auth: { persistSession: false } }
);

function json(res: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(res), {
    ...init,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",                         // simple CORS (tighten if you prefer)
      "access-control-allow-headers": "content-type, authorization",
      ...init.headers,
    },
  });
}

function notFound(msg = "Not found") {
  return json({ error: msg }, { status: 404 });
}
function badRequest(msg = "Bad request") {
  return json({ error: msg }, { status: 400 });
}

async function getLink(slug: string) {
  const { data, error } = await supabaseAdmin
    .from("intake_links")
    .select("id, user_id, vehicle_id, slug, expires_at, max_uses, used_count, require_pin, pin_hash, notes")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function isExpired(expires_at: string) {
  return new Date(expires_at).getTime() < Date.now();
}

async function sha256Hex(input: string) {
  const enc = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "content-type, authorization",
        "access-control-allow-methods": "GET, POST, OPTIONS",
      },
    });
  }

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean); // e.g. ["intake", ":slug", "submit"]
  if (parts[0] !== "intake") return notFound();

  const slug = parts[1];
  if (!slug) return notFound("Missing slug");

  // GET /intake/:slug  → redacted meta for the public form
  if (req.method === "GET" && parts.length === 2) {
    const link = await getLink(slug);
    if (!link) return notFound();
    if (isExpired(link.expires_at)) return notFound("Link expired");
    if (link.used_count >= link.max_uses) return notFound("Link exhausted");

    // fetch minimal vehicle info for header
    const { data: vehicle } = await supabaseAdmin
      .from("vehicles")
      .select("id, year, make, model")
      .eq("id", link.vehicle_id)
      .maybeSingle();

    return json({
      vehicle: vehicle ?? null,
      require_pin: link.require_pin,
      notes: link.notes ?? null,
    });
  }

  // POST /intake/:slug/verify  { pin }
  if (req.method === "POST" && parts[2] === "verify") {
    const { pin } = await req.json();
    const link = await getLink(slug);
    if (!link) return notFound();
    if (!link.require_pin) return json({ ok: true }); // nothing to verify

    if (!pin || typeof pin !== "string") return badRequest("PIN required");
    const pinHash = await sha256Hex(pin.trim());
    const ok = !!link.pin_hash && link.pin_hash === pinHash;
    return json({ ok });
  }

  // POST /intake/:slug/submit  { log: NewLogInput, items: NewItemInput[], pin?: string }
  if (req.method === "POST" && parts[2] === "submit") {
    const body = await req.json();
    const { log, items, pin } = body as { log: NewLogInput; items: NewItemInput[]; pin?: string };

    // validate
    if (!log || typeof log.vehicle_id !== "string" || typeof log.date !== "string") {
      return badRequest("Invalid payload");
    }
    if (!Array.isArray(items)) return badRequest("Invalid items");

    const link = await getLink(slug);
    if (!link) return notFound();
    if (isExpired(link.expires_at)) return notFound("Link expired");
    if (link.used_count >= link.max_uses) return notFound("Link exhausted");

    // PIN check
    if (link.require_pin) {
      if (!pin) return badRequest("PIN required");
      const pinHash = await sha256Hex(pin.trim());
      if (!link.pin_hash || pinHash !== link.pin_hash) return badRequest("Invalid PIN");
    }

    // ensure vehicle matches link
    if (log.vehicle_id !== link.vehicle_id) {
      return badRequest("Vehicle mismatch");
    }

    // 1) insert log
    const { data: insertedLog, error: logErr } = await supabaseAdmin
      .from("maintenance_logs")
      .insert([{
        user_id: link.user_id,
        vehicle_id: log.vehicle_id,
        date: log.date,
        mileage: log.mileage ?? null,
        vendor_name: log.vendor_name ?? null,
        location: log.location ?? null,
        invoice_number: log.invoice_number ?? null,
        labor_cost: log.labor_cost ?? null,
        parts_cost: log.parts_cost ?? null,
        taxes: log.taxes ?? null,
        notes: log.notes ?? null,
        source: "intake_link",
      }])
      .select("id")
      .single();
    if (logErr || !insertedLog) return json({ error: "Failed to insert log" }, { status: 500 });

    // 2) insert items (optional)
    if (items.length > 0) {
      const rows = items.map((it) => ({
        log_id: insertedLog.id,
        type: it.type,
        description: it.description ?? null,
        status: it.status ?? "completed",
        cost: it.cost ?? null,
      }));
      const { error: itemsErr } = await supabaseAdmin
        .from("maintenance_items")
        .insert(rows);
      if (itemsErr) {
        return json({ error: "Failed to insert items" }, { status: 500 });
      }
    }

    // 3) increment used_count
    await supabaseAdmin
      .from("intake_links")
      .update({ used_count: link.used_count + 1 })
      .eq("id", link.id);

    return json({ ok: true });
  }

  return notFound();
});
