import { supabase } from "@/integrations/supabase/client";

/** Thrown when an Edge Function call exceeds the configured timeout. */
export class TimeoutError extends Error {
  constructor(message = "Function timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

type InvokeArgs<TReq> = {
  fn: string;
  body?: TReq;
  /** Reject if the call takes longer than this. Default: 15s */
  timeoutMs?: number;
  /**
   * Optional manual key for de-duping concurrent calls.
   * Defaults to `${fn}:${JSON.stringify(body)}`
   */
  cacheKey?: string;
};

const inflight = new Map<string, Promise<unknown>>();

/**
 * Single-flight + timeout wrapper around supabase.functions.invoke.
 * Prevents duplicate concurrent calls with identical args and rejects on timeout.
 */
export async function safeInvoke<TRes = unknown, TReq = unknown>(
  args: InvokeArgs<TReq>
): Promise<TRes> {
  const { fn, body, timeoutMs = 15_000, cacheKey } = args;
  const key = cacheKey ?? `${fn}:${JSON.stringify(body ?? {})}`;

  const existing = inflight.get(key) as Promise<TRes> | undefined;
  if (existing) return existing;

  let timer: ReturnType<typeof setTimeout>;

  // Only ONE generic type param (response type) is supported
  const actual = supabase.functions
    .invoke<TRes>(fn, { body: (body ?? {}) as Record<string, unknown> })
    .then(({ data, error }) => {
      if (error) throw error;
      return data as TRes;
    });

  const timeoutPromise = new Promise<TRes>((_, reject) => {
    timer = setTimeout(
      () => reject(new TimeoutError(`${fn} exceeded ${timeoutMs}ms`)),
      timeoutMs
    );
  });

  const p = Promise.race([actual, timeoutPromise])
    .finally(() => {
      clearTimeout(timer!);
      inflight.delete(key);
    }) as Promise<TRes>;

  inflight.set(key, p);
  return p;
}
