import { createClient } from "@supabase/supabase-js";
import { env, hasSupabaseConfig } from "@/lib/config/env";

export const supabaseClient = hasSupabaseConfig
  ? createClient(env.supabaseUrl, env.supabaseAnonKey)
  : null;