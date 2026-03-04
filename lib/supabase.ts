import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL is missing! Check your .env.local file.');
}
if (!supabaseAnonKey) {
  console.error('ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing! Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
