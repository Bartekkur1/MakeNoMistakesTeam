// The only module in web-app/src that imports @supabase/supabase-js (D-02, D-03).
// Server-side only: it reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, which must never carry
// a browser-exposed prefix and are never logged. The client is created lazily on the first
// request, so `next build` never touches storage.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { StorageUnavailableError } from "./errors";

let client: SupabaseClient | null = null;

function readEnv(name: "SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY"): string | null {
  const value = process.env[name];
  if (typeof value !== "string" || value.trim() === "") return null;
  return value.trim();
}

export function getSupabase(): SupabaseClient {
  const url = readEnv("SUPABASE_URL");
  const key = readEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw new StorageUnavailableError("storage not configured");
  }
  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return client;
}

// Cheapest possible round trip to prove storage answers.
export async function checkStorage(): Promise<void> {
  try {
    const { error } = await getSupabase().from("reports").select("id").limit(1);
    if (error) {
      throw new StorageUnavailableError("storage query failed", { cause: error });
    }
  } catch (err) {
    if (err instanceof StorageUnavailableError) throw err;
    throw new StorageUnavailableError("storage query threw", { cause: err });
  }
}
