import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  'https://cfvhdjkgnwvwpftgmddt.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_j4gkPSFYBV-kB-fOActqyg_zPa0X2fK';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);