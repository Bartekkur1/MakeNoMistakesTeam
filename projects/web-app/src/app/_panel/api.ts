// The panel's API client. Same origin as the API, so paths are relative and there is no CORS.
// The token travels only in the Authorization header, never in a URL (CONTRACT "Zasady ogólne").
// Every failure carries a contract error code and the contract's Polish message; the server's
// own message text is never shown. Plan 02-02 adds fetchReports on top of apiCall.

import {
  API_ERROR_CODES,
  API_ERROR_MESSAGES_PL,
  type ApiErrorCode,
  type FieldError,
  LIMITS,
  type LoginResponse,
  type ReportComment,
  type ReportDetail,
  type ReportListResponse,
  type ReportState,
  type RobloxAccount,
  type RobloxAccountListResponse,
  type TransitionAction,
  type TransitionResponse,
} from "@/lib/contract/types";
import { ERRORS } from "./content";

export type ApiFailure =
  | { ok: false; kind: "http"; status: number; code: ApiErrorCode; message: string; details: FieldError[] }
  | { ok: false; kind: "network" };

export type ApiResult<T> = { ok: true; value: T } | ApiFailure;

export interface ApiCallOptions {
  method: "GET" | "POST";
  token?: string;
  body?: unknown;
}

// Fallback code when the response has no usable error envelope.
const CODE_BY_STATUS: Record<number, ApiErrorCode> = {
  401: "unauthorized",
  403: "forbidden",
  404: "report_not_found",
  409: "invalid_transition",
  413: "payload_too_large",
  503: "storage_unavailable",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === "string" && (API_ERROR_CODES as readonly string[]).includes(value);
}

function httpFailure(status: number, code: ApiErrorCode, details: FieldError[] = []): ApiFailure {
  return { ok: false, kind: "http", status, code, message: API_ERROR_MESSAGES_PL[code], details };
}

function envelopeDetails(error: Record<string, unknown>): FieldError[] {
  if (!Array.isArray(error.details)) return [];
  return error.details
    .filter((entry): entry is FieldError => isRecord(entry) && typeof entry.field === "string" && typeof entry.message === "string")
    .map((entry) => ({ field: entry.field, message: entry.message }));
}

function failureFromResponse(status: number, payload: unknown): ApiFailure {
  const error = isRecord(payload) && isRecord(payload.error) ? payload.error : null;
  const code = error && isApiErrorCode(error.code) ? error.code : (CODE_BY_STATUS[status] ?? "internal_error");
  return httpFailure(status, code, error ? envelopeDetails(error) : []);
}

// A stalled connection (mobile hand-over, a proxy) would otherwise keep a request, and the modal
// transition dialog with it, pending for minutes. After this long the request is aborted and
// reported as a network failure, whose copy already says the result is unconfirmed.
export const REQUEST_TIMEOUT_MS = 20_000;

// Undefined in a browser without AbortSignal.timeout: the request then simply has no timeout.
function timeoutSignal(): AbortSignal | undefined {
  return typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
    ? AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    : undefined;
}

export async function apiCall<T>(path: string, options: ApiCallOptions): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }
  let body: string | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(path, { method: options.method, headers, body, cache: "no-store", signal: timeoutSignal() });
  } catch {
    // A dropped connection and a timeout look the same: the result is unknown.
    return { ok: false, kind: "network" };
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (response.ok) {
    return payload === null ? httpFailure(response.status, "internal_error") : { ok: true, value: payload as T };
  }
  return failureFromResponse(response.status, payload);
}

// Demo login (D-05): step 1 only collects the e-mail; this single call sends both fields.
export function loginRequest(email: string, code: string): Promise<ApiResult<LoginResponse>> {
  return apiCall<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { email: email.trim(), code: code.trim(), scope: "panel" },
  });
}

export interface FetchReportsOptions {
  limit?: number;
  cursor?: string | null;
  state?: ReportState | null;
}

// One page of the reports this account may see, newest first (created_at desc, then id desc).
// The server decides visibility; the panel keeps the API order and never re-sorts. The cursor is
// passed back verbatim.
export function fetchReports(token: string, options: FetchReportsOptions): Promise<ApiResult<ReportListResponse>> {
  const params = new URLSearchParams();
  params.set("limit", String(options.limit ?? LIMITS.pageDefault));
  if (options.cursor != null) params.set("cursor", options.cursor);
  if (options.state != null) params.set("state", options.state);
  return apiCall<ReportListResponse>(`/api/reports?${params.toString()}`, { method: "GET", token });
}

// One report with its history and comments (panel scope). An unknown, malformed or foreign id
// answers 404 report_not_found. The id is encoded as one path segment.
export function fetchReport(token: string, id: string): Promise<ApiResult<ReportDetail>> {
  return apiCall<ReportDetail>(`/api/reports/${encodeURIComponent(id)}`, { method: "GET", token });
}

// Adds a comment to the parent-teacher thread (D-03). Not idempotent (CONTRACT): a repeated POST
// may save the comment twice, so this sends exactly once and never retries on its own.
export function postComment(token: string, id: string, body: string): Promise<ApiResult<ReportComment>> {
  return apiCall<ReportComment>(`/api/reports/${encodeURIComponent(id)}/comments`, {
    method: "POST",
    token,
    body: { body },
  });
}

// Moves the report through the workflow (D-12): { action, comment } where the comment is the
// trimmed note or null. The server decides (403 when the role may never do it, 409 when not from
// the current state). A repeated or concurrent transition gets 409, so a retry by the user is
// safe, but nothing is resent automatically.
export function postTransition(
  token: string,
  id: string,
  action: TransitionAction,
  comment: string | null,
): Promise<ApiResult<TransitionResponse>> {
  return apiCall<TransitionResponse>(`/api/reports/${encodeURIComponent(id)}/transitions`, {
    method: "POST",
    token,
    body: { action, comment },
  });
}

// The text to show for a failure. validation_error shows the first field message; callers that
// own the fields (the login form) map details to their own copy instead.
export function errorMessage(failure: ApiFailure, networkMessage: string = ERRORS.networkLoad): string {
  if (failure.kind === "network") return networkMessage;
  const internal = API_ERROR_MESSAGES_PL.internal_error + ERRORS.retrySuffix;
  if (failure.code === "internal_error") return internal;
  if (failure.code === "validation_error") return failure.details[0]?.message ?? internal;
  return API_ERROR_MESSAGES_PL[failure.code];
}

// A session expiry (401 unauthorized). A wrong login (401 invalid_credentials) is not one.
export function isUnauthorized(result: ApiResult<unknown>): boolean {
  return !result.ok && result.kind === "http" && result.code === "unauthorized";
}


// The Roblox nicks the parent linked to their children (parent accounts only).
export function fetchRobloxAccounts(token: string): Promise<ApiResult<RobloxAccountListResponse>> {
  return apiCall<RobloxAccountListResponse>("/api/roblox-accounts", { method: "GET", token });
}

// Links (or relinks) a nick to a child. Idempotent: saving the same nick twice changes nothing.
export function saveRobloxAccount(token: string, childId: string, robloxUsername: string): Promise<ApiResult<RobloxAccount>> {
  return apiCall<RobloxAccount>("/api/roblox-accounts", {
    method: "POST",
    token,
    body: { child_id: childId, roblox_username: robloxUsername },
  });
}
