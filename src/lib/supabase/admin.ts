import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { requireSupabaseConfig } from "@/lib/supabase/config";

export function createAdminClient() {
  const { url } = requireSupabaseConfig();
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("The server-only Supabase admin connection is not configured.");
  }

  return createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
