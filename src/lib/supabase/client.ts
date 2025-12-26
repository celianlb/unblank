import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env } from '@/config/env';

/**
 * Creates a Supabase client for client-side usage
 * Uses the anon key and relies on browser cookies for auth
 */
export function createClient() {
  return createSupabaseClient(env.supabase.url, env.supabase.anonKey);
}
