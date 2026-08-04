import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://ytwjenirjagqewvxyynh.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_bMV6DSxkKi1HiS2PWKkirQ_1DUFkUsE';

const getSavedUrl = () => {
  try {
    const custom = localStorage.getItem('prod_supabase_url');
    if (custom && custom.trim() !== '') return custom.trim();
  } catch (e) {}
  return import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
};

const getSavedKey = () => {
  try {
    const custom = localStorage.getItem('prod_supabase_anon_key');
    if (custom && custom.trim() !== '') return custom.trim();
  } catch (e) {}
  return import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
};

const envUrl = getSavedUrl();
const envAnonKey = getSavedKey();

// Check if variables are valid and not placeholders
export const isSupabaseConfigured = 
  Boolean(envUrl && 
  envUrl !== 'YOUR_SUPABASE_URL' && 
  envUrl.trim() !== '' &&
  envAnonKey && 
  envAnonKey !== 'YOUR_SUPABASE_ANON_KEY' && 
  envAnonKey.trim() !== '');

let clientInstance = null;
if (isSupabaseConfigured) {
  try {
    clientInstance = createClient(envUrl, envAnonKey);
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
    clientInstance = null;
  }
}

export const supabase = clientInstance;
