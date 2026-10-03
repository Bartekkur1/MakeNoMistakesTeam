// The only module in web-app/src that imports @supabase/supabase-js (D-02, D-03).
// Server-side only: it reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, which must never carry
// a browser-exposed prefix and are never logged. The client is created lazily on the first
// request, so `next build` never touches storage.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { StorageUnavailableError } from "./errors";

let client: SupabaseClient | null = null;

// Every PostgREST request (table query or RPC) is aborted after this long. A route makes at most
// two storage calls one after another, so even the worst case stays well below the Heroku router
// limit (30 s, H12): a stalled database ends as the contract's JSON 503 storage_unavailable with
// CORS headers instead of the router's HTML error page. The aborted call returns an error, which
// run() in reports.ts and checkStorage() below turn into StorageUnavailableError.
export const STORAGE_TIMEOUT_MS = 8000;

// PostgREST options for the server client:
// - timeout: the per-request abort above;
// - retry off: supabase-js would otherwise retry GETs on network errors and on 503/520 answers
//   (up to 3 times, with 1-4 s backoff or the server's Retry-After), which can push one call past
//   the router limit. The contract leaves retrying a 503 to the client, by hand.
export const STORAGE_DB_OPTIONS = { timeout: STORAGE_TIMEOUT_MS, retry: false } as const;

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
      db: { ...STORAGE_DB_OPTIONS },
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
