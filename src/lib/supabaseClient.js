import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  console.warn('Supabase env vars ausentes — configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em .env.local');
}

// createClient throws synchronously on an invalid URL, which would crash the
// whole module graph before the app can even render a "not configured" state —
// fall back to a placeholder URL so the app boots; real calls just fail until
// the env vars are set.
export const supabase = createClient(
  isSupabaseConfigured ? url : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? anonKey : 'placeholder-anon-key',
);
