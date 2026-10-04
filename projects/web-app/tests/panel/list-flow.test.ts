// The report list, end to end (PAN-01, D-09, D-10): the panel's own API client reads the first
// page through the real list route on the fake Supabase, each account gets only its own reports in
// the API order, a rejected token counts as a session expiry, and a row renders the state label,
// the Warsaw date, the child, source and attack type and links to the detail.

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchReports, isUnauthorized, loginRequest } from "@/app/_panel/api";
import { LIST } from "@/app/_panel/content";
import { initialListState, listReducer } from "@/app/_panel/list-state";
import { ReportRow } from "@/app/_panel/ReportRow";
import type { LoginResponse } from "@/lib/contract/types";
import { seedFakeWithDataset } from "../helpers/dataset";
import { fetchLog, installPanelFetch } from "../helpers/panel-fetch";

vi.mock("@supabase/supabase-js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@supabase/supabase-js")>();
  const { fakeSupabase: fake } = await import("../helpers/fake-supabase");
  return { ...actual, createClient: () => fake.client };
});

const P1 = "rodzic.ola@bezpiecznaaura.example";
const T1 = "nauczyciel.5a@bezpiecznaaura.example";
const T2 = "nauczyciel.6b@bezpiecznaaura.example";

const reportId = (n: number) => `00000000-0000-4000-8000-0000000d000${n}`;

async function loginAs(email: string): Promise<LoginResponse> {
  const result = await loginRequest(email, "0000");
  if (!result.ok) throw new Error(`login failed for ${email}`);
  return result.value;
}

beforeEach(() => {
  seedFakeWithDataset();
  installPanelFetch();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("panel list flow", () => {
  it("gives a parent the first page of their own reports newest first, with the token only in the header", async () => {
    const { token } = await loginAs(P1);
    fetchLog.length = 0;

    const result = await fetchReports(token, {});

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.reports.map((report) => report.id)).toEqual([reportId(3), reportId(2), reportId(1)]);
    expect(result.value.next_cursor).toBeNull();

    expect(fetchLog).toHaveLength(1);
    const [request] = fetchLog;
    const url = new URL(request.url);
    expect(request.method).toBe("GET");
    expect(`${url.pathname}${url.search}`).toBe("/api/reports?limit=20");
    expect(request.headers.authorization).toBe(`Bearer ${token}`);
    expect(`${url.pathname}${url.search}`).not.toContain(token);
  });

  it("gives a teacher only the teacher-visible reports of their class", async () => {
    const { token } = await loginAs(T1);

    const result = await fetchReports(token, {});

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.reports.map((report) => report.id)).toEqual([reportId(4), reportId(2)]);
  });

  it("maps a rejected token to unauthorized, which counts as a session expiry", async () => {
    const result = await fetchReports("garbage", {});

    expect(result.ok).toBe(false);
    if (result.ok || result.kind !== "http") throw new Error("expected an http failure");
    expect(result.code).toBe("unauthorized");
    expect(isUnauthorized(result)).toBe(true);
  });

  it("renders a row with the state label, Warsaw date, child, source and attack type, linking to the detail", async () => {
    const login = await loginAs(P1);
    const list = await fetchReports(login.token, {});
    if (!list.ok) throw new Error("list failed");
    const r3 = list.value.reports.find((report) => report.id === reportId(3));
    if (!r3) throw new Error("R3 missing");

    const html = renderToStaticMarkup(createElement(ReportRow, { report: r3, sessionChildren: login.children }));

    expect(html).toContain(`href="/panel/${reportId(3)}"`);
    expect(html).toContain("odrzucone przez rodzica");
    expect(html).toContain('dateTime="2026-10-03T09:15:00.000Z"');
    expect(html).toContain("3 paź 2026, 11:15");
    expect(html).toContain("Ola · SMS · pułapka zakupowa lub prośba o zapłatę");
    expect(html).not.toContain("(demo)");
  });

  it("pages through P1's reports with the cursor passed verbatim and appends them in API order", async () => {
    const { token } = await loginAs(P1);
    const whole = await fetchReports(token, { limit: 20 });
    if (!whole.ok) throw new Error("full list failed");
    fetchLog.length = 0;

    const first = await fetchReports(token, { limit: 2 });
    if (!first.ok) throw new Error("first page failed");
    expect(first.value.reports.map((report) => report.id)).toEqual([reportId(3), reportId(2)]);
    const cursor = first.value.next_cursor;
    expect(cursor).not.toBeNull();
    if (cursor === null) return;

    let state = listReducer(initialListState, {
      type: "load-done",
      requestId: initialListState.requestId,
      reason: "initial",
      page: first.value,
      clock: "10:05",
    });
    state = listReducer(state, { type: "more-start" });
    expect(state.pending).toBe("more");

    const second = await fetchReports(token, { limit: 2, cursor: state.nextCursor, state: state.filter });
    if (!second.ok) throw new Error("second page failed");
    expect(second.value.reports.map((report) => report.id)).toEqual([reportId(1)]);
    expect(second.value.next_cursor).toBeNull();

    state = listReducer(state, { type: "more-done", requestId: state.requestId, page: second.value });

    expect(state.reports.map((report) => report.id)).toEqual(whole.value.reports.map((report) => report.id));
    expect(state.nextCursor).toBeNull();
    expect(state.focusIndex).toBe(2);
    expect(state.announcement).toBe(LIST.moreAnnouncement);

    expect(fetchLog).toHaveLength(2);
    const url = new URL(fetchLog[1].url);
    expect(url.search).toContain("limit=2");
    expect(url.search).toContain(`cursor=${encodeURIComponent(cursor)}`);
    expect(url.searchParams.get("cursor")).toBe(cursor);
  });

  it("filters a parent's list by state through the real route", async () => {
    const { token } = await loginAs(P1);
    fetchLog.length = 0;

    const result = await fetchReports(token, { state: "closed" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.reports.map((report) => report.id)).toEqual([reportId(2)]);
    expect(new URL(fetchLog[0].url).search).toContain("state=closed");
  });

  it("gives a teacher an empty filtered page that becomes the filtered empty state", async () => {
    const { token } = await loginAs(T1);

    const result = await fetchReports(token, { state: "pending_parent" });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual({ reports: [], next_cursor: null });

    let state = listReducer(initialListState, {
      type: "load-start",
      requestId: 2,
      reason: "filter",
      filter: "pending_parent",
    });
    state = listReducer(state, { type: "load-done", requestId: 2, reason: "filter", page: result.value, clock: "10:05" });

    expect(state.status).toBe("ready");
    expect(state.reports).toHaveLength(0);
    expect(state.filter).toBe("pending_parent");
    expect(state.nextCursor).toBeNull();
  });

  it("marks the risky rows of a teacher's list without changing the API order", async () => {
    const login = await loginAs(T1);
    const list = await fetchReports(login.token, {});
    if (!list.ok) throw new Error("list failed");
    expect(list.value.reports.map((report) => report.id)).toEqual([reportId(4), reportId(2)]);

    const [r4, r2] = list.value.reports.map((report) =>
      renderToStaticMarkup(createElement(ReportRow, { report, sessionChildren: login.children })),
    );

    expect(r4).toContain("Ryzyko: kliknięcie, podanie danych");
    expect(r2).toContain("Ryzyko: kliknięcie");
    expect(r2).not.toContain("podanie danych");
  });

  it("shows no risk marker on a row whose child only replied", async () => {
    const login = await loginAs(T2);
    const list = await fetchReports(login.token, {});
    if (!list.ok) throw new Error("list failed");
    const r5 = list.value.reports.find((report) => report.id === reportId(5));
    if (!r5) throw new Error("R5 missing");
    expect(r5.taken_actions).toEqual(["replied"]);

    const html = renderToStaticMarkup(createElement(ReportRow, { report: r5, sessionChildren: login.children }));

    expect(html).not.toContain("Ryzyko");
  });
});
