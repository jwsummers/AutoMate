// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Read from Vite env. These MUST be present in .env.local
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Fail fast instead of silently causing retry storms
if (!url || !anon) {
  // eslint-disable-next-line no-console
  console.error('Missing Supabase env:', { hasUrl: Boolean(url), hasAnonKey: Boolean(anon) });
  throw new Error(
    'Supabase env missing. Create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart dev server.'
  );
}

export const supabase = createClient<Database>(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  // Optional: add a header to help you identify app traffic in logs
  // global: { headers: { 'x-app': 'automate-web' } },
});
