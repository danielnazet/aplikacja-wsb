import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL is required');
if (!supabaseAnonKey) throw new Error('VITE_SUPABASE_ANON_KEY is required');
if (!supabaseServiceKey) throw new Error('VITE_SUPABASE_SERVICE_KEY is required');

// Singleton pattern
let supabase = null;
let supabaseAdmin = null;

export const getSupabase = () => {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabase;
};

export const getSupabaseAdmin = () => {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin;
}; 
