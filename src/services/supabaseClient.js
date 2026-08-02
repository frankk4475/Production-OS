import { createClient } from '@supabase/supabase-js';

const getSavedUrl = () => {
  try {
    const custom = localStorage.getItem('prod_supabase_url');
    if (custom && custom.trim() !== '') return custom.trim();
  } catch (e) {}
  return import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
};

const getSavedKey = () => {
  try {
    const custom = localStorage.getItem('prod_supabase_anon_key');
    if (custom && custom.trim() !== '') return custom.trim();
  } catch (e) {}
  return import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
};

const envUrl = getSavedUrl();
const envAnonKey = getSavedKey();

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
