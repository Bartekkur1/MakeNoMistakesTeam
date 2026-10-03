// RED skeleton (plan 01-05 Task 2): not implemented yet.
import { apiError, preflight } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export function OPTIONS(): Response {
  return preflight();
}

export async function POST(_request: Request, _ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  return apiError("internal_error");
}
