import { createClient } from '@supabase/supabase-js';
import { appStorage } from './storage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail-soft during static build or CI checks when env variables are bound at deployment
  console.warn('[KTMS Config] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not defined in the environment.');
}

/**
 * Hardened Supabase Client Singleton
 * Bound strictly to public anonymous credentials. 
 * Service-role keys must NEVER be bundled in client code.
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: appStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
