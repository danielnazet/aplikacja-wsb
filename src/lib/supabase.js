import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

// Client dla normalnych operacji
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client z uprawnieniami administratora
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey); 