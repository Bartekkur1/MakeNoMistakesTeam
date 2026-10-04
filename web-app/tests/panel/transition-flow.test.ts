// The state-change half of the guardian's reply (PAN-03 read through D-03; D-12, D-15): the
// "Zmień stan" card offers only the actions availableActions() allows, each opens a confirmation
// dialog, and the confirm goes through the panel's own API client to the real transitions route on
// the fake Supabase. One party's decision is visible to the other party in the panel. Nothing is
// shown as saved before the server answered 201 (CONTRACT "Potwierdzenie zapisu").

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { errorMessage, fetchReport, fetchReports, loginRequest, postTransition, type ApiFailure } from "@/app/_panel/api";
import { DIALOG } from "@/app/_panel/content";
import {
  actionButtonLabel,
  dialogCopy,
  draftAfterSent,
  isPrimaryAction,
  isUnconfirmedFailure,
  mergeDraft,
  missingRequiredNote,
  orderedActions,
  retriedConflict,
  transitionComment,
  transitionOutcome,
} from "@/app/_panel/format";
import { ReportActionsCard } from "@/app/_panel/ReportActionsCard";
import { TransitionDialog } from "@/app/_panel/TransitionDialog";
import { availableActions } from "@/lib/contract/workflow";
import type { LoginResponse, Report, ReportState, TransitionResponse } from "@/lib/contract/types";
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

const R1 = "00000000-0000-4000-8000-0000000d0001";
const R2 = "00000000-0000-4000-8000-0000000d0002";
const R4 = "00000000-0000-4000-8000-0000000d0004";

const BASE_REPORT: Report = {
  id: R1,
  child_id: "00000000-0000-4000-8000-0000000c0001",
  parent_id: "00000000-0000-4000-8000-0000000a0001",
  attack_type: "data_request",
  taken_actions: [],
  source: "game",
  content: "Podaj kod z SMS-a.",
  state: "pending_parent",
  created_at: "2026-10-03T08:05:00.000Z",
  updated_at: "2026-10-03T08:05:00.000Z",
};

function reportIn(state: ReportState): Report {
  return { ...BASE_REPORT, state };
}

async function loginAs(email: string): Promise<LoginResponse> {
  const result = await loginRequest(email, "0000");
  if (!result.ok) throw new Error(`login failed for ${email}`);
  return result.value;
}

function noop(): void {}

function actionsCard(report: Report, role: "parent" | "teacher", success: ReportState | null = null): string {
  return renderToStaticMarkup(
    createElement(ReportActionsCard, {
      report,
      role,
      token: "t",
      success,
      onDone: noop,
      onConflict: noop,
      onNotFound: noop,
    }),
  );
}

// The rendered <button> elements, one string per button.
function buttons(html: string): string[] {
  return html.split("<button").slice(1);
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

describe("action helpers", () => {
  it("orders the available actions with approve and close first", () => {
    const ordered = (state: ReportState, role: "parent" | "teacher") => orderedActions(availableActions(state, role));

    expect(ordered("pending_parent", "parent")).toEqual(["approve", "reject"]);
    expect(ordered("rejected", "parent")).toEqual(["approve", "reopen"]);
    expect(ordered("with_teacher", "teacher")).toEqual(["close", "escalate"]);
    expect(ordered("with_teacher", "parent")).toEqual(["reject"]);
    expect(ordered("escalated", "teacher")).toEqual(["close"]);
    expect(ordered("closed", "parent")).toEqual(["reopen"]);
    expect(ordered("escalated", "parent")).toEqual([]);
  });

  it("marks approve and close as the primary actions", () => {
    expect(isPrimaryAction("approve")).toBe(true);
    expect(isPrimaryAction("close")).toBe(true);
    expect(isPrimaryAction("reject")).toBe(false);
    expect(isPrimaryAction("escalate")).toBe(false);
    expect(isPrimaryAction("reopen")).toBe(false);
  });

  it("labels each button with the verb and the noun", () => {
    expect(actionButtonLabel("approve")).toBe("Zatwierdź zgłoszenie");
    expect(actionButtonLabel("reject")).toBe("Odrzuć zgłoszenie");
    expect(actionButtonLabel("escalate")).toBe("Eskaluj zgłoszenie");
    expect(actionButtonLabel("close")).toBe("Zamknij zgłoszenie");
    expect(actionButtonLabel("reopen")).toBe("Wznów zgłoszenie");
  });

  it("chooses the reject and reopen consequence by the current state", () => {
    expect(dialogCopy("reject", "pending_parent").body).toBe(
      "Zgłoszenie nie trafi do nauczyciela. Możesz je później zatwierdzić albo wznowić.",
    );
    expect(dialogCopy("reject", "with_teacher").body.startsWith("Nauczyciel straci dostęp do zgłoszenia")).toBe(true);
    expect(dialogCopy("reopen", "closed").body).toBe("Zgłoszenie wróci do nauczyciela w stanie „u nauczyciela”.");
    expect(dialogCopy("reopen", "rejected").body).toBe("Zgłoszenie wróci do stanu „czeka na rodzica”.");
  });

  it("requires a note only for escalation", () => {
    const escalate = dialogCopy("escalate", "with_teacher");
    expect(escalate.noteLabel).toBe("Do kogo eskalowano (wymagane)");
    expect(escalate.noteRequired).toBe(true);

    for (const [action, from] of [
      ["approve", "pending_parent"],
      ["reject", "pending_parent"],
      ["reject", "with_teacher"],
      ["close", "escalated"],
      ["reopen", "closed"],
      ["reopen", "rejected"],
    ] as const) {
      const copy = dialogCopy(action, from);
      expect(copy.noteLabel).toBe("Komentarz (opcjonalnie)");
      expect(copy.noteRequired).toBe(false);
    }
  });
});

describe("panel transitions", () => {
  it("a parent approves R1 and the teacher then sees it with the teacher's actions (D-03)", async () => {
    const { token } = await loginAs(P1);
    fetchLog.length = 0;

    const result = await postTransition(token, R1, "approve", null);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.report.state).toBe("with_teacher");
    expect(result.value.entry.action).toBe("approve");
    expect(result.value.entry.from_state).toBe("pending_parent");

    expect(fetchLog).toHaveLength(1);
    const [request] = fetchLog;
    expect(request.method).toBe("POST");
    expect(new URL(request.url).pathname).toBe(`/api/reports/${R1}/transitions`);
    expect(request.body).toBe('{"action":"approve","comment":null}');
    expect(request.headers.authorization).toBe(`Bearer ${token}`);

    const teacher = await loginAs(T1);
    const list = await fetchReports(teacher.token, {});
    expect(list.ok).toBe(true);
    if (!list.ok) return;
    expect(list.value.reports.map((report) => report.id)).toEqual([R4, R2, R1]);

    const detail = await fetchReport(teacher.token, R1);
    expect(detail.ok).toBe(true);
    if (!detail.ok) return;
    expect(detail.value.history.at(-1)).toEqual(result.value.entry);
    expect(orderedActions(availableActions(detail.value.state, "teacher"))).toEqual(["close", "escalate"]);
  });

  it("the teacher does not see R1 before the parent approves it", async () => {
    const teacher = await loginAs(T1);

    const list = await fetchReports(teacher.token, {});

    expect(list.ok).toBe(true);
    if (!list.ok) return;
    expect(list.value.reports.map((report) => report.id)).not.toContain(R1);
  });
});

describe("transitionOutcome", () => {
  const RESPONSE: TransitionResponse = {
    report: reportIn("with_teacher"),
    entry: {
      id: "00000000-0000-4000-8000-0000000e0099",
      report_id: R1,
      action: "approve",
      from_state: "pending_parent",
      to_state: "with_teacher",
      actor_id: "00000000-0000-4000-8000-0000000a0001",
      actor_role: "parent",
      comment: null,
      created_at: "2026-10-03T12:00:00.000Z",
    },
  };

  function httpFailure(status: number, code: Extract<ApiFailure, { kind: "http" }>["code"]): ApiFailure {
    return { ok: false, kind: "http", status, code, message: "x", details: [] };
  }

  it("reports done only for the server's 201 response", () => {
    expect(transitionOutcome({ ok: true, value: RESPONSE })).toEqual({ kind: "done", response: RESPONSE });
  });

  it("never reports done for a failure (nothing is shown as saved)", () => {
    const failures: ApiFailure[] = [
      httpFailure(503, "storage_unavailable"),
      httpFailure(500, "internal_error"),
      httpFailure(403, "forbidden"),
      { ok: false, kind: "network" },
    ];
    for (const failure of failures) {
      expect(transitionOutcome(failure).kind).not.toBe("done");
    }
  });

  it("treats a 401 as a session expiry", () => {
    expect(transitionOutcome(httpFailure(401, "unauthorized"))).toEqual({ kind: "expired" });
  });
});

describe("Zmień stan card", () => {
  it("shows the current state and only the parent's actions, approve first and filled", () => {
    const html = actionsCard(reportIn("pending_parent"), "parent");

    expect(html).toContain("Zmień stan");
    expect(html).toContain("Obecny stan:");
    expect(html).toContain("czeka na rodzica");
    const all = buttons(html);
    expect(all).toHaveLength(2);
    expect(all[0]).toContain("Zatwierdź zgłoszenie");
    expect(all[0]).toContain("bg-shark-blue");
    expect(all[1]).toContain("Odrzuć zgłoszenie");
    expect(all[1]).toContain("border-titanium-border");
    expect(all[1]).not.toContain("bg-shark-blue ");
    expect(html.indexOf("Zatwierdź zgłoszenie")).toBeLessThan(html.indexOf("Odrzuć zgłoszenie"));
  });

  it("shows the teacher's close before escalate on a report with the teacher", () => {
    const all = buttons(actionsCard(reportIn("with_teacher"), "teacher"));

    expect(all).toHaveLength(2);
    expect(all[0]).toContain("Zamknij zgłoszenie");
    expect(all[1]).toContain("Eskaluj zgłoszenie");
  });

  it("explains that nothing can be changed when no action is available, without buttons", () => {
    const html = actionsCard(reportIn("escalated"), "parent");

    expect(html).toContain("Na tym etapie nie możesz zmienić stanu zgłoszenia. Możesz dodać komentarz.");
    expect(html).not.toContain("<button");
  });

  it("shows the saved confirmation only when a transition was confirmed", () => {
    expect(actionsCard(reportIn("with_teacher"), "parent", "with_teacher")).toContain(
      "Zapisano. Obecny stan: u nauczyciela.",
    );
    expect(actionsCard(reportIn("pending_parent"), "parent")).not.toContain("Zapisano.");
  });
});

describe("transition dialog", () => {
  it("renders the approve dialog with its consequence, the optional note and both buttons", () => {
    const html = renderToStaticMarkup(
      createElement(TransitionDialog, {
        reportId: R1,
        token: "t",
        action: "approve",
        fromState: "pending_parent",
        onDone: noop,
        onConflict: noop,
        onNotFound: noop,
        onClose: noop,
      }),
    );

    expect(html).toContain("<dialog");
    expect(html).toContain("Zatwierdzić zgłoszenie?");
    expect(html).toContain("Zgłoszenie trafi do wychowawcy klasy dziecka.");
    expect(html).toContain("Komentarz (opcjonalnie)");
    expect(html).toContain("0/1000");
    expect(html).toContain('maxLength="1000"');
    expect(html).toContain("Zostaw bez zmian");
    expect(html).toContain("Zatwierdź zgłoszenie");
    expect(html).not.toContain("Zapisano.");
  });
});

describe("panel transitions: escalation, conflicts and failures", () => {
  it("blocks an escalation without a note on the server, saves it with one and shows it to the parent", async () => {
    const teacher = await loginAs(T1);

    const blank = await postTransition(teacher.token, R4, "escalate", null);
    expect(blank.ok).toBe(false);
    if (blank.ok || blank.kind !== "http") throw new Error("expected an http failure");
    expect(blank.status).toBe(400);
    expect(blank.code).toBe("validation_error");
    expect(blank.details.some((detail) => detail.field === "comment")).toBe(true);

    const saved = await postTransition(teacher.token, R4, "escalate", "CERT Polska (NASK)");
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;
    expect(saved.value.report.state).toBe("escalated");

    const parent = await loginAs(P2);
    const detail = await fetchReport(parent.token, R4);
    expect(detail.ok).toBe(true);
    if (!detail.ok) return;
    expect(detail.value.state).toBe("escalated");
    expect(detail.value.history.at(-1)?.comment).toBe("CERT Polska (NASK)");
    expect(detail.value.history.at(-1)?.actor_role).toBe("teacher");
  });

  it("answers a stale second click with 409 invalid_transition", async () => {
    const { token } = await loginAs(P1);

    const first = await postTransition(token, R1, "approve", null);
    expect(first.ok).toBe(true);

    const second = await postTransition(token, R1, "approve", null);
    expect(second.ok).toBe(false);
    if (second.ok || second.kind !== "http") throw new Error("expected an http failure");
    expect(second.status).toBe(409);
    expect(second.code).toBe("invalid_transition");
    expect(transitionOutcome(second)).toEqual({ kind: "conflict" });
  });

  it("answers 403 forbidden for an action the role may never take", async () => {
    const teacher = await loginAs(T1);

    const result = await postTransition(teacher.token, R4, "approve", null);

    expect(result.ok).toBe(false);
    if (result.ok || result.kind !== "http") throw new Error("expected an http failure");
    expect(result.status).toBe(403);
    expect(result.code).toBe("forbidden");
    expect(errorMessage(result)).toBe("To konto nie może wykonać tej operacji.");
    expect(transitionOutcome(result)).toEqual({ kind: "alert", message: "To konto nie może wykonać tej operacji." });
  });

  it("answers 404 when the parent rejected the report and the teacher lost access", async () => {
    const parent = await loginAs(P2);
    const teacher = await loginAs(T1);

    const rejected = await postTransition(parent.token, R4, "reject", null);
    expect(rejected.ok).toBe(true);

    const close = await postTransition(teacher.token, R4, "close", null);
    expect(close.ok).toBe(false);
    if (close.ok || close.kind !== "http") throw new Error("expected an http failure");
    expect(close.status).toBe(404);
    expect(close.code).toBe("report_not_found");
    expect(transitionOutcome(close)).toEqual({ kind: "not-found" });

    const detail = await fetchReport(teacher.token, R4);
    expect(detail.ok).toBe(false);
    if (detail.ok || detail.kind !== "http") throw new Error("expected an http failure");
    expect(detail.status).toBe(404);
  });

  it("reports a dropped connection as kind network with the transition message", async () => {
    failFetch();

    const result = await postTransition("t", R1, "approve", null);

    expect(result).toEqual({ ok: false, kind: "network" });
    if (result.ok) return;
    expect(errorMessage(result, DIALOG.networkError)).toBe("Nie udało się potwierdzić zmiany. Spróbuj ponownie.");
    expect(transitionOutcome(result)).toEqual({
      kind: "alert",
      message: "Nie udało się potwierdzić zmiany. Spróbuj ponownie.",
    });
  });
});

describe("dialog rules", () => {
  function validationFailure(details: { field: string; message: string }[]): ApiFailure {
    return { ok: false, kind: "http", status: 400, code: "validation_error", message: "x", details };
  }

  it("blocks a blank escalation note and allows a blank note for every other action", () => {
    expect(missingRequiredNote("escalate", "")).toBe(true);
    expect(missingRequiredNote("escalate", "   ")).toBe(true);
    expect(missingRequiredNote("escalate", "CERT Polska (NASK)")).toBe(false);
    for (const action of ["approve", "reject", "close", "reopen"] as const) {
      expect(missingRequiredNote(action, "")).toBe(false);
    }
    expect(DIALOG.escalateEmpty).toBe("Wpisz, do kogo eskalowano zgłoszenie.");
  });

  it("sends the trimmed note, or null when it is blank", () => {
    expect(transitionComment("  CERT Polska (NASK) ")).toBe("CERT Polska (NASK)");
    expect(transitionComment("   ")).toBeNull();
    expect(transitionComment("")).toBeNull();
  });

  it("puts a comment field message under the note and any other detail in the alert", () => {
    expect(transitionOutcome(validationFailure([{ field: "comment", message: "Za długi komentarz." }]))).toEqual({
      kind: "field",
      message: "Za długi komentarz.",
    });
    expect(transitionOutcome(validationFailure([{ field: "action", message: "Nieznana akcja." }]))).toEqual({
      kind: "alert",
      message: "Nieznana akcja.",
    });
  });

  it("shows a storage failure in the alert, never as saved", () => {
    const failure: ApiFailure = {
      ok: false,
      kind: "http",
      status: 503,
      code: "storage_unavailable",
      message: "x",
      details: [],
    };

    expect(transitionOutcome(failure)).toEqual({ kind: "alert", message: errorMessage(failure) });
  });

  it("merges an unsent note into the comment draft without losing either", () => {
    expect(mergeDraft("", "CERT")).toBe("CERT");
    expect(mergeDraft("abc", "CERT")).toBe("abc\n\nCERT");
    expect(mergeDraft("abc", "  ")).toBe("abc");
  });

  it("after a confirmed comment clears only the sent text and keeps a note moved in meanwhile (WR-04)", () => {
    expect(draftAfterSent("abc", "abc")).toBe("");
    // A 409 moved the transition note in while the comment was sending.
    expect(draftAfterSent(mergeDraft("abc", "CERT"), "abc")).toBe("CERT");
    // The field held only the note (the user had cleared the comment text): nothing is lost.
    expect(draftAfterSent("CERT", "abc")).toBe("CERT");
  });
});

describe("retry after an unconfirmed transition (WR-02)", () => {
  const NOTE = "Porozmawiam z wychowawczynią.";

  function knownIds(history: readonly { id: string }[]): Set<string> {
    return new Set(history.map((entry) => entry.id));
  }

  it("counts only a failure whose result is unknown as unconfirmed", () => {
    const http = (status: number, code: Extract<ApiFailure, { kind: "http" }>["code"]): ApiFailure => ({
      ok: false,
      kind: "http",
      status,
      code,
      message: "x",
      details: [],
    });

    expect(isUnconfirmedFailure({ ok: false, kind: "network" })).toBe(true);
    expect(isUnconfirmedFailure(http(500, "internal_error"))).toBe(true);
    expect(isUnconfirmedFailure(http(503, "storage_unavailable"))).toBe(true);
    expect(isUnconfirmedFailure(http(409, "invalid_transition"))).toBe(false);
    expect(isUnconfirmedFailure(http(403, "forbidden"))).toBe(false);
    expect(isUnconfirmedFailure(http(400, "validation_error"))).toBe(false);
  });

  it("recognizes the user's own first attempt, saved although its answer was lost", async () => {
    const login = await loginAs(P1);
    const before = await fetchReport(login.token, R1);
    if (!before.ok) throw new Error("detail failed");

    // The first attempt reaches the server, but the panel never sees the 201.
    await postTransition(login.token, R1, "approve", NOTE);
    const retry = await postTransition(login.token, R1, "approve", NOTE);
    expect(retry.ok ? null : transitionOutcome(retry)).toEqual({ kind: "conflict" });

    const after = await fetchReport(login.token, R1);
    if (!after.ok) throw new Error("detail failed");
    const attempt = { action: "approve" as const, fromState: "pending_parent" as const, comments: [NOTE] };
    const outcome = retriedConflict(after.value, knownIds(before.value.history), attempt, login.account.id);

    expect(outcome.kind).toBe("saved");
    expect(outcome.kind !== "conflict" && outcome.entry.to_state).toBe("with_teacher");
    // A different note was never sent, so it cannot prove the save.
    expect(
      retriedConflict(after.value, knownIds(before.value.history), { ...attempt, comments: ["Inna."] }, login.account.id),
    ).toEqual({ kind: "conflict" });
    // Another account's change is a real conflict.
    expect(
      retriedConflict(after.value, knownIds(before.value.history), attempt, "00000000-0000-4000-8000-0000000a0002"),
    ).toEqual({ kind: "conflict" });
  });

  it("reports a saved attempt that the other party has since moved on from", async () => {
    const parent = await loginAs(P1);
    const before = await fetchReport(parent.token, R1);
    if (!before.ok) throw new Error("detail failed");
    await postTransition(parent.token, R1, "approve", null);
    const teacher = await loginAs(T1);
    const closed = await postTransition(teacher.token, R1, "close", null);
    expect(closed.ok).toBe(true);

    const after = await fetchReport(parent.token, R1);
    if (!after.ok) throw new Error("detail failed");
    const attempt = { action: "approve" as const, fromState: "pending_parent" as const, comments: [null] };

    expect(retriedConflict(after.value, knownIds(before.value.history), attempt, parent.account.id).kind).toBe(
      "saved-then-changed",
    );
  });
});

describe("escalation dialog", () => {
  it("labels the note as required and starts without an error", () => {
    const html = renderToStaticMarkup(
      createElement(TransitionDialog, {
        reportId: R4,
        token: "t",
        action: "escalate",
        fromState: "with_teacher",
        onDone: noop,
        onConflict: noop,
        onNotFound: noop,
        onClose: noop,
      }),
    );

    expect(html).toContain("Eskalować zgłoszenie?");
    expect(html).toContain("Do kogo eskalowano (wymagane)");
    expect(html).toContain("Eskaluj zgłoszenie");
    expect(html).not.toContain("aria-invalid");
    expect(html).not.toContain("Wpisz, do kogo eskalowano zgłoszenie.");
  });
});
