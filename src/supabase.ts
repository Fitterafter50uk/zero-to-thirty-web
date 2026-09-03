import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  'https://huehhscqqnriuywzsbmc.supabase.co';

const SUPABASE_ANON_KEY =
  'sb_publishable_vGH8hLkZPSsbyZ8rpVHHew_LXFYkRlw';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);