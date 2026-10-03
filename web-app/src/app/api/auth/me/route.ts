// RED skeleton: not implemented yet.
import { apiError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export function OPTIONS(): Response {
  return apiError("internal_error");
}

export async function GET(request: Request): Promise<Response> {
  void request;
  return apiError("internal_error");
}
