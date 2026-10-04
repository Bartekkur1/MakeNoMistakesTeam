// The report detail, end to end (PAN-02 read through D-04): the panel's own API client reads one
// report through the real detail route on the fake Supabase, a foreign report answers 404, a
// rejected token counts as a session expiry, and the content and "Co dziecko już zrobiło" cards
// render the scam message as plain text with the risky actions highlighted. No signals section.
// Comments (PAN-03 read through D-03): one party writes, the other sees it in the same report.

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { errorMessage, fetchReport, isUnauthorized, loginRequest, postComment } from "@/app/_panel/api";
import { COMMENT } from "@/app/_panel/content";
import { isReportId } from "@/app/_panel/format";
import { ReportContentCard, TakenActionsCard } from "@/app/_panel/ReportCards";
import type { LoginResponse, ReportDetail } from "@/lib/contract/types";
import { seedFakeWithDataset } from "../helpers/dataset";
import { failFetch, fetchLog, installPanelFetch } from "../helpers/panel-fetch";

vi.mock("@supabase/supabase-js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@supabase/supabase-js")>();
  const { fakeSupabase: fake } = await import("../helpers/fake-supabase");
  return { ...actual, createClient: () => fake.client };
});

const P1 = "rodzic.ola@bezpiecznaaura.example";
const P2 = "rodzic.kuba@bezpiecznaaura.example";
const T1 = "nauczyciel.5a@bezpiecznaaura.example";
const T2 = "nauczyciel.6b@bezpiecznaaura.example";

const R2 = "00000000-0000-4000-8000-0000000d0002";
const R4 = "00000000-0000-4000-8000-0000000d0004";
const R2_URL = "https://dziennik-szkolny-weryfikacja.example/logowanie";

async function loginAs(email: string): Promise<LoginResponse> {
  const result = await loginRequest(email, "0000");
  if (!result.ok) throw new Error(`login failed for ${email}`);
  return result.value;
}

async function loadAs(email: string, id: string): Promise<ReportDetail> {
  const { token } = await loginAs(email);
  const result = await fetchReport(token, id);
  if (!result.ok) throw new Error(`detail failed for ${id}`);
  return result.value;
}

function render(element: ReturnType<typeof createElement>): string {
  return renderToStaticMarkup(element);
}

// The list items of the rendered markup, one string per <li>.
function listItems(html: string): string[] {
  return html.split("<li").slice(1);
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

describe("isReportId", () => {
  it("accepts a report UUID in any letter case", () => {
    expect(isReportId(R2)).toBe(true);
    expect(isReportId(R2.toUpperCase())).toBe(true);
  });

  it("rejects anything that is not exactly one UUID", () => {
    expect(isReportId("abc")).toBe(false);
    expect(isReportId("")).toBe(false);
    expect(isReportId("../auth/me")).toBe(false);
    expect(isReportId(`${R2}/x`)).toBe(false);
  });
});

describe("panel detail flow", () => {
  it("loads a parent's report with its history and comments, token only in the header", async () => {
    const { token } = await loginAs(P1);
    fetchLog.length = 0;

    const result = await fetchReport(token, R2);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state).toBe("closed");
    expect(result.value.taken_actions).toEqual(["clicked_link"]);
    expect(result.value.history).toHaveLength(4);
    expect(result.value.comments).toHaveLength(2);

    expect(fetchLog).toHaveLength(1);
    const [request] = fetchLog;
    const url = new URL(request.url);
    expect(request.method).toBe("GET");
    expect(`${url.pathname}${url.search}`).toBe(`/api/reports/${R2}`);
    expect(request.headers.authorization).toBe(`Bearer ${token}`);
  });

  it("answers 404 report_not_found for a teacher of another class", async () => {
    const { token } = await loginAs(T2);

    const result = await fetchReport(token, R2);

    expect(result.ok).toBe(false);
    if (result.ok || result.kind !== "http") throw new Error("expected an http failure");
    expect(result.status).toBe(404);
    expect(result.code).toBe("report_not_found");
  });

  it("maps a rejected token to unauthorized, which counts as a session expiry", async () => {
    const result = await fetchReport("garbage", R2);

    expect(isUnauthorized(result)).toBe(true);
  });
});

describe("report detail cards", () => {
  it("renders the full content as plain text with the metadata list and no link", async () => {
    const report = await loadAs(P1, R2);

    const html = render(createElement(ReportContentCard, { report, childLabel: "Ola" }));

    expect(html).toContain("Treść wiadomości");
    expect(html).toContain(R2_URL);
    expect(html).toContain("whitespace-pre-wrap");
    expect(html).toContain("[overflow-wrap:anywhere]");
    for (const term of ["Dziecko", "Źródło", "Rodzaj ataku", "Zgłoszono", "Ostatnia zmiana"]) {
      expect(html).toContain(term);
    }
    for (const value of ["Ola", "Mail", "Fałszywy link lub strona logowania", "3 paź 2026, 10:40", "3 paź 2026, 11:40"]) {
      expect(html).toContain(value);
    }
    expect(html).toContain('dateTime="2026-10-03T08:40:00.000Z"');
    expect(html).not.toContain("<a ");
  });

  it("escapes HTML-looking content and never turns a URL into a link", async () => {
    const report = await loadAs(P1, R2);

    const html = render(
      createElement(ReportContentCard, { report: { ...report, content: "<b>x</b> https://a.example" }, childLabel: "Ola" }),
    );

    expect(html).toContain("&lt;b&gt;x&lt;/b&gt;");
    expect(html).not.toContain("<b>");
    expect(html).not.toContain("<a ");
  });

  it("highlights the risky actions in crimson with the ryzykowne tag", () => {
    const html = render(createElement(TakenActionsCard, { actions: ["clicked_link", "shared_personal_data"] }));

    expect(html).toContain("Co dziecko już zrobiło");
    expect(html).toContain("Odpowiedź dziecka na pytanie: czy już kliknąłeś, podałeś dane lub zapłaciłeś?");
    const items = listItems(html);
    expect(items).toHaveLength(2);
    expect(items[0]).toContain("Kliknięcie w link");
    expect(items[1]).toContain("Podanie danych osobowych (imię, adres, telefon, szkoła)");
    for (const item of items) {
      expect(item).toContain("border-hook-crimson");
      expect(item).toContain("ryzykowne");
    }
    expect(html.toLowerCase()).not.toContain("sygna");
  });

  it("lists the actions in canonical order whatever order they arrive in", () => {
    const html = render(createElement(TakenActionsCard, { actions: ["replied", "clicked_link"] }));

    const items = listItems(html);
    expect(items[0]).toContain("Kliknięcie w link");
    expect(items[1]).toContain("Odpisanie nadawcy");
  });

  it("lists a harmless action without the risk highlight", () => {
    const html = render(createElement(TakenActionsCard, { actions: ["replied"] }));

    expect(html).toContain("Odpisanie nadawcy");
    expect(html).not.toContain("ryzykowne");
    expect(html).not.toContain("border-hook-crimson");
    expect(html.toLowerCase()).not.toContain("sygna");
  });

  it("says the child did none of these things when the list is empty", () => {
    const html = render(createElement(TakenActionsCard, { actions: [] }));

    expect(html).toContain("Nic z tych rzeczy: dziecko nie kliknęło, nie podało danych i nie zapłaciło.");
    expect(html).not.toContain("<li");
    expect(html).not.toContain("ryzykowne");
    expect(html.toLowerCase()).not.toContain("sygna");
  });
});

describe("panel comments", () => {
  it("saves a teacher's comment and shows it to the parent on the next load (D-03)", async () => {
    const { token } = await loginAs(T1);
    fetchLog.length = 0;

    const result = await postComment(token, R4, "Rozmawiałam z Kubą.");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.body).toBe("Rozmawiałam z Kubą.");
    expect(result.value.author_role).toBe("teacher");
    expect(result.value.report_id).toBe(R4);

    expect(fetchLog).toHaveLength(1);
    const [request] = fetchLog;
    const url = new URL(request.url);
    expect(request.method).toBe("POST");
    expect(`${url.pathname}${url.search}`).toBe(`/api/reports/${R4}/comments`);
    expect(request.headers.authorization).toBe(`Bearer ${token}`);
    expect(request.body).toBe('{"body":"Rozmawiałam z Kubą."}');

    const seenByParent = await loadAs(P2, R4);
    expect(seenByParent.comments.at(-1)?.id).toBe(result.value.id);
  });

  it("answers 404 when the account cannot see the report", async () => {
    const { token } = await loginAs(P1);

    const result = await postComment(token, R4, "Komentarz");

    if (result.ok || result.kind !== "http") throw new Error("expected an http failure");
    expect(result.status).toBe(404);
    expect(result.code).toBe("report_not_found");
  });

  it("returns the body field message for a blank comment", async () => {
    const { token } = await loginAs(T1);

    const result = await postComment(token, R4, "   ");

    if (result.ok || result.kind !== "http") throw new Error("expected an http failure");
    expect(result.code).toBe("validation_error");
    const detail = result.details.find((entry) => entry.field === "body");
    expect(detail).toBeDefined();
    expect(errorMessage(result)).toBe(detail?.message);
  });

  it("reports a dropped connection with the check-the-timeline message and sends once", async () => {
    const calls = vi.fn(async (): Promise<Response> => {
      throw new TypeError("fetch failed");
    });
    vi.stubGlobal("fetch", calls);

    const result = await postComment("token", R4, "Komentarz");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.kind).toBe("network");
    expect(errorMessage(result, COMMENT.networkError)).toBe(
      "Nie udało się potwierdzić zapisu komentarza. Odśwież zgłoszenie i sprawdź historię, zanim wyślesz komentarz ponownie.",
    );
    expect(calls).toHaveBeenCalledTimes(1);
  });

  it("gives kind network for a failed fetch", async () => {
    failFetch();

    const result = await postComment("token", R4, "Komentarz");

    expect(!result.ok && result.kind === "network").toBe(true);
  });
});
