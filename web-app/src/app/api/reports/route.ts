// RED skeleton: not implemented yet.
import { apiError, preflight } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export function OPTIONS(): Response {
  return preflight();
}

export async function POST(request: Request): Promise<Response> {
  void request;
  return apiError("internal_error");
}
