// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://txxfaccdpvoacifuumya.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4eGZhY2NkcHZvYWNpZnV1bXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDM2NTc1NzgsImV4cCI6MjAxOTIzMzU3OH0.ZPmGrBqGqOXVhWUYHDuZo6NKX0clQAdAIF-GQWF_-YE";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);