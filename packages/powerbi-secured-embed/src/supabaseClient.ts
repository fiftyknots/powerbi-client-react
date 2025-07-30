import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please copy .env.example to .env and configure your Supabase project details.');
}

console.debug(`SUPABASE_URL: ${supabaseUrl}`);
console.debug(`SUPABBASE_ANON_KEY: ${supabaseAnonKey}`);
export const supabase = createClient(supabaseUrl, supabaseAnonKey);