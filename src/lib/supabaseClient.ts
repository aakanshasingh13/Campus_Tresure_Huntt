import { createClient } from '@supabase/supabase-js';

// Resolve Supabase URL safely across browser (Vite), mobile (Expo), and Node (Express) environments
const getEnvVar = (viteKey: string, expoKey: string, fallback: string): string => {
  // Vite client-side
  try {
    const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : null;
    if (metaEnv && metaEnv[viteKey]) {
      return metaEnv[viteKey];
    }
  } catch (_) {}

  // Node.js or Expo environment
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env[expoKey]) return process.env[expoKey] as string;
      if (process.env[viteKey]) return process.env[viteKey] as string;
      if (process.env.SUPABASE_URL && viteKey.includes('URL')) return process.env.SUPABASE_URL;
      if (process.env.SUPABASE_ANON_KEY && viteKey.includes('KEY')) return process.env.SUPABASE_ANON_KEY;
    }
  } catch (_) {}

  return fallback;
};

export const SUPABASE_URL = getEnvVar(
  'VITE_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_URL',
  'https://vtamiythwdqhgcwcupnq.supabase.co'
);

export const SUPABASE_KEY = getEnvVar(
  'VITE_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_SUPABASE_KEY',
  'sb_publishable_Bf1Z77nJh_gb7ziGtTHhLg_niGWMb4z'
);

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
