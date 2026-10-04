// Every published contract example (.planning/shared/examples) reproduced by the real route
// handlers on the seeded fake, byte for byte (ROADMAP criterion 2 offline, D-05). When a case
// fails, fix the implementation: the examples belong to the approved contract (plan 01-02).

import { readdirSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as health from "@/app/api/health/route";
import * as login from "@/app/api/auth/login/route";
import * as me from "@/app/api/auth/me/route";
import * as reports from "@/app/api/reports/route";
import * as reportDetail from "@/app/api/reports/[id]/route";
import * as comments from "@/app/api/reports/[id]/comments/route";
import * as transitions from "@/app/api/reports/[id]/transitions/route";
import type { ApiErrorCode, FieldError } from "@/lib/contract/types";
import { verifyToken } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";
import { apiRequest, authHeaders } from "../helpers/auth";
import { loadExample, seedFakeWithDataset, type ExampleFile } from "../helpers/dataset";
import { fakeSupabase } from "../helpers/fake-supabase";

vi.mock("@supabase/supabase-js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@supabase/supabase-js")>();
  const { fakeSupabase: fake } = await import("../helpers/fake-supabase");
  return { ...actual, createClient: () => fake.client };
});

type Handler = (request: Request, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

const ROUTES: Record<string, Record<string, Handler>> = {
  "/api/health": { GET: health.GET as unknown as Handler },
  "/api/auth/login": { POST: login.POST as unknown as Handler },
  "/api/auth/me": { GET: me.GET as unknown as Handler },
  "/api/reports": { GET: reports.GET as unknown as Handler, POST: reports.POST as unknown as Handler },
  "/api/reports/{id}": { GET: reportDetail.GET },
  "/api/reports/{id}/transitions": { POST: transitions.POST },
  "/api/reports/{id}/comments": { POST: comments.POST },
};

const EXAMPLES_DIR = new URL("../../../../.planning/shared/examples/", import.meta.url);
const ROUTE_EXAMPLES = readdirSync(EXAMPLES_DIR)
  .filter((name) => name.endsWith(".json") && name !== "demo-dataset.json" && name !== "errors.json")
  .sort();

const NOW = "2026-10-03T12:00:00.000Z";

// The {id} path segment of a concrete path for a route template.
function pathId(route: string, path: string): string {
  const pattern = new RegExp(`^${route.replace("{id}", "([^/?]+)")}(?:\\?.*)?$`);
  const match = pattern.exec(path);
  if (!match) throw new Error(`path ${path} does not match route ${route}`);
  return match[1] ?? "";
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  seedFakeWithDataset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("published route examples", () => {
  it("has 11 route examples", () => {
    expect(ROUTE_EXAMPLES).toHaveLength(11);
  });

  it.each(ROUTE_EXAMPLES)("reproduces %s", async (name) => {
    const example = loadExample<ExampleFile>(name);
    const handler = ROUTES[example.route]?.[example.method];
    expect(handler, `handler for ${example.method} ${example.route}`).toBeDefined();

    const expected = example.response.body as Record<string, unknown>;
    if (example.method === "POST" && example.route.startsWith("/api/reports")) {
      // The new report, history entry or comment: pin its time and id to the example's.
      const created = (expected.entry ?? expected) as { id: string; created_at: string };
      fakeSupabase.setClock(created.created_at);
      fakeSupabase.queueIds(created.id);
    }

    const request = apiRequest(example.method, example.path, {
      body: example.request === null ? undefined : example.request,
      headers: example.auth === null ? {} : authHeaders(example.auth.email, example.auth.scope),
    });
    const id = example.route.includes("{id}") ? pathId(example.route, example.path) : "";
    const res = await handler(request, { params: Promise.resolve({ id }) });

    expect(res.status).toBe(example.response.status);
    const actual = (await res.json()) as Record<string, unknown>;
    if (example.route === "/api/auth/login") {
      expect(typeof actual.token).toBe("string");
      expect(verifyToken(String(actual.token))).not.toBeNull();
      actual.token = expected.token;
    }
    expect(actual).toEqual(expected);
    expect(JSON.stringify(actual)).toBe(JSON.stringify(expected));
  });
});

interface ErrorExample {
  status: number;
  code: ApiErrorCode;
  body: { error: { code: ApiErrorCode; message: string; details?: FieldError[] } };
}

const ERROR_EXAMPLES = loadExample<{ errors: ErrorExample[] }>("errors.json").errors;

describe("published error examples", () => {
  it("has one entry per error code", () => {
    expect(ERROR_EXAMPLES).toHaveLength(10);
  });

  it.each(ERROR_EXAMPLES.map((entry) => [entry.code, entry] as const))("reproduces %s", async (_code, entry) => {
    const res = apiError(entry.code, entry.body.error.details);
    expect(res.status).toBe(entry.status);
    const body = await res.json();
    expect(body).toEqual(entry.body);
    expect(JSON.stringify(body)).toBe(JSON.stringify(entry.body));
  });
});
