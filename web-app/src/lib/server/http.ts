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

// Reads the request body up to maxBytes. Returns null as soon as more than maxBytes have
// arrived and cancels the rest of the stream, so memory use stays bounded by the cap.
async function readCappedBody(request: Request, maxBytes: number): Promise<Uint8Array | null> {
  if (!request.body) return new Uint8Array(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function readJsonBody(request: Request): Promise<JsonBodyResult> {
  const declared = request.headers.get("content-length");
  if (declared !== null && declared.trim() !== "") {
    const length = Number(declared);
    if (Number.isFinite(length) && length > LIMITS.maxBodyBytes) {
      return { ok: false, response: apiError("payload_too_large") };
    }
  }

  // The body is read chunk by chunk and the cap is checked on the bytes received so far, so a
  // body without Content-Length (Transfer-Encoding: chunked) or with a false one is never
  // buffered past LIMITS.maxBodyBytes. request.text() would buffer the whole stream first.
  const bytes = await readCappedBody(request, LIMITS.maxBodyBytes);
  if (bytes === null) {
    return { ok: false, response: apiError("payload_too_large") };
  }
  const text = new TextDecoder().decode(bytes);

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
