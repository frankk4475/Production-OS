import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const envAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if variables are valid and not placeholders or dead URLs
export const isSupabaseConfigured = 
  Boolean(envUrl && 
  envUrl !== 'YOUR_SUPABASE_URL' && 
  !envUrl.includes('ytwjenirjagqewvxyynh.supabase.co') &&
  envUrl.trim() !== '' &&
  envAnonKey && 
  envAnonKey !== 'YOUR_SUPABASE_ANON_KEY' && 
  envAnonKey.trim() !== '');

export const supabase = isSupabaseConfigured 
  ? createClient(envUrl, envAnonKey) 
  : null;
