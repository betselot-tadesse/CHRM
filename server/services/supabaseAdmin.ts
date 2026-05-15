import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Supabase configuration missing in server environment. Backend interactions with Supabase will fail.");
}

// Only initialize the client if URL is present. Otherwise construct a dummy or throw gracefully when methods are called
// But since supabaseAdmin is exported globally, we can provide a Proxy that throws dynamically instead of crashing on load.

export const supabaseAdmin = supabaseUrl ? createClient(
  supabaseUrl,
  supabaseServiceKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) : new Proxy({} as any, {
  get: function(target, prop) {
    if (prop === 'from') {
       return () => ({
          select: () => ({ eq: () => ({ single: () => ({ data: null, error: new Error('Supabase Not Configured') }) }) })
       });
    }
    throw new Error('Supabase environment details are missing. Backend services are disabled.');
  }
});
