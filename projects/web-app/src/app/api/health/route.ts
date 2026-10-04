import { handleRouteError, json, preflight } from "@/lib/server/http";
import { checkStorage } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

export function OPTIONS(): Response {
  return preflight();
}

export async function GET(): Promise<Response> {
  try {
    await checkStorage();
    return json({ status: "ok" });
  } catch (err) {
    return handleRouteError(err);
  }
}
