import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://zbzckatrmpdlpngypzgd.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiemNrYXRybXBkbHBuZ3lwemdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNTEwNzAsImV4cCI6MjA5NzcyNzA3MH0.DIXNc4CcrC0vkxMyNJkdgGskaNrYfsxhdccEZbgygLk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
