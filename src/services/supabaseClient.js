import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://ytwjenirjagqewvxyynh.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_bMV6DSxkKi1HiS2PWKkirQ_1DUFkUsE';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

// Check if variables are valid and not placeholders
export const isSupabaseConfigured = 
  Boolean(supabaseUrl && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseUrl.trim() !== '' &&
  supabaseAnonKey && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' && 
  supabaseAnonKey.trim() !== '');

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
