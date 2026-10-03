// Routes the panel's fetch calls to the real route handlers in-process, so panel tests drive the
// same code the browser would reach. The fake Supabase (tests/helpers/fake-supabase.ts, mocked in
// each test file) stays the only storage: nothing leaves the test process (D-06).

import { vi } from "vitest";
import * as login from "@/app/api/auth/login/route";
import * as me from "@/app/api/auth/me/route";
import * as reports from "@/app/api/reports/route";
import * as reportDetail from "@/app/api/reports/[id]/route";
import * as comments from "@/app/api/reports/[id]/comments/route";
import * as transitions from "@/app/api/reports/[id]/transitions/route";

export interface LoggedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
}

// Every request panelFetch received since the last installPanelFetch(), in call order.
export const fetchLog: LoggedRequest[] = [];

type IdContext = { params: Promise<{ id: string }> };

function idContext(id: string): IdContext {
  return { params: Promise.resolve({ id: decodeURIComponent(id) }) };
}

export async function panelFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const request = new Request(new URL(String(input), "http://localhost"), init);
  fetchLog.push({
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.body === null ? null : await request.clone().text(),
  });

  const { pathname } = new URL(request.url);
  const method = request.method;

  if (pathname === "/api/auth/login" && method === "POST") return login.POST(request);
  if (pathname === "/api/auth/me" && method === "GET") return me.GET(request);
  if (pathname === "/api/reports" && method === "GET") return reports.GET(request);

  const detail = /^\/api\/reports\/([^/]+)$/.exec(pathname);
  if (detail && method === "GET") return reportDetail.GET(request, idContext(detail[1]));

  const transition = /^\/api\/reports\/([^/]+)\/transitions$/.exec(pathname);
  if (transition && method === "POST") return transitions.POST(request, idContext(transition[1]));

  const comment = /^\/api\/reports\/([^/]+)\/comments$/.exec(pathname);
  if (comment && method === "POST") return comments.POST(request, idContext(comment[1]));

  return new Response("Not Found", { status: 404 });
}

// Replaces the global fetch with panelFetch and clears the log. Callers run
// vi.unstubAllGlobals() in afterEach.
export function installPanelFetch(): void {
  fetchLog.length = 0;
  vi.stubGlobal("fetch", panelFetch);
}

// A fetch stub that always answers the same response. A string body is sent verbatim,
// anything else as JSON.
export function respondWith(status: number, body: unknown, contentType = "application/json"): void {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  vi.stubGlobal(
    "fetch",
    async (): Promise<Response> => new Response(text, { status, headers: { "content-type": contentType } }),
  );
}

// A fetch stub that fails like a dropped connection.
export function failFetch(): void {
  vi.stubGlobal("fetch", async (): Promise<Response> => {
    throw new TypeError("fetch failed");
  });
}
