// Shared HTTP helpers for every route handler: CORS, JSON responses, the contract error
// envelope, body reading with the size cap, and the mapping of infrastructure errors.
// The console calls below are the only ones in web-app/src. They print an error code or an
// error name, never request bodies, e-mails, tokens, report content, env values or cause messages.

import {
  API_ERROR_HTTP_STATUS,
  API_ERROR_MESSAGES_PL,
  LIMITS,
  type ApiErrorCode,
  type FieldError,
} from "@/lib/contract/types";
import { AuthNotConfiguredError, StorageUnavailableError } from "./errors";

export const CORS_HEADERS: Readonly<Record<string, string>> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { ...CORS_HEADERS, "Cache-Control": "no-store" },
  });
}

export function apiError(code: ApiErrorCode, details?: FieldError[]): Response {
  const error: { code: ApiErrorCode; message: string; details?: FieldError[] } = {
    code,
    message: API_ERROR_MESSAGES_PL[code],
  };
  if (details && details.length > 0) {
    error.details = details;
  }
  return json({ error }, API_ERROR_HTTP_STATUS[code]);
}

export function preflight(): Response {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS } });
}

export type JsonBodyResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; response: Response };

export async function readJsonBody(request: Request): Promise<JsonBodyResult> {
  const declared = request.headers.get("content-length");
  if (declared !== null && declared.trim() !== "") {
    const length = Number(declared);
    if (Number.isFinite(length) && length > LIMITS.maxBodyBytes) {
      return { ok: false, response: apiError("payload_too_large") };
    }
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > LIMITS.maxBodyBytes) {
    return { ok: false, response: apiError("payload_too_large") };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, response: apiError("invalid_json") };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, response: apiError("invalid_json") };
  }
  return { ok: true, value: parsed as Record<string, unknown> };
}

function causeCode(err: Error): string | undefined {
  const cause: unknown = err.cause;
  if (cause !== null && typeof cause === "object" && "code" in cause) {
    const code: unknown = (cause as { code: unknown }).code;
    if (typeof code === "string") return code;
  }
  return undefined;
}

export function handleRouteError(err: unknown): Response {
  if (err instanceof StorageUnavailableError) {
    const code = causeCode(err);
    if (code) {
      console.error("[api] storage_unavailable", code);
    } else {
      console.error("[api] storage_unavailable");
    }
    return apiError("storage_unavailable");
  }
  if (err instanceof AuthNotConfiguredError) {
    console.error("[api] auth_not_configured");
    return apiError("internal_error");
  }
  const name = err instanceof Error ? err.name : typeof err;
  console.error("[api] internal_error", name);
  return apiError("internal_error");
}
