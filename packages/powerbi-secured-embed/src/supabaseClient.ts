import { createClient } from '@supabase/supabase-js';

// These should be replaced with your actual Supabase project URL and anon key
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

console.debug(`SUPABASE_URL: ${supabaseUrl}`);
console.debug(`SUPABBASE_ANON_KEY: ${supabaseAnonKey}`);
export const supabase = createClient(supabaseUrl, supabaseAnonKey);