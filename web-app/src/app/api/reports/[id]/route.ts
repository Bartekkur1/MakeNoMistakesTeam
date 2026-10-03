// RED skeleton: not implemented yet.
import { apiError, preflight } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export function OPTIONS(): Response {
  return preflight();
}

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  void request;
  void ctx;
  return apiError("internal_error");
}
