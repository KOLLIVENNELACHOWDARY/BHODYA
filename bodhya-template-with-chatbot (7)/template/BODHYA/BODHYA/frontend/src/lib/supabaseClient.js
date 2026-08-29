import { createClient } from "@supabase/supabase-js";

// Safe fallbacks so the app renders even before Supabase keys are set
// (replace with your team's real values in .env — never commit .env)
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co",
  import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-anon-key"
);
