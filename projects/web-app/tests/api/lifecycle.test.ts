// The full life of one report (ROADMAP criterion 2 offline, D-08..D-11): the child's report is
// filed through the extension, the parent approves it, parent and teacher talk in the thread,
// the teacher escalates and closes, the parent reopens and the teacher closes again.
// The extension token never reaches the detail; the other class's teacher never sees the report.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getDetail } from "@/app/api/reports/[id]/route";
import { POST as postReport } from "@/app/api/reports/route";
import { POST as postComment } from "@/app/api/reports/[id]/comments/route";
import { POST as postTransition } from "@/app/api/reports/[id]/transitions/route";
import { DEMO_ACCOUNTS } from "@/lib/contract/demo-accounts";
import type { ReportDetail } from "@/lib/contract/types";
import { apiRequest, authHeaders } from "../helpers/auth";
import { fakeSupabase } from "../helpers/fake-supabase";

vi.mock("@supabase/supabase-js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@supabase/supabase-js")>();
  const { fakeSupabase: fake } = await import("../helpers/fake-supabase");
  return { ...actual, createClient: () => fake.client };
});

const P1 = "rodzic.ola@bezpiecznaaura.example";
const T1 = "nauczyciel.5a@bezpiecznaaura.example";
const T2 = "nauczyciel.6b@bezpiecznaaura.example";
const P1_ID = DEMO_ACCOUNTS[0].id;
const T1_ID = DEMO_ACCOUNTS[4].id;

function detail(id: string, headers: Record<string, string>): Promise<Response> {
  return getDetail(apiRequest("GET", `/api/reports/${id}`, { headers }), { params: Promise.resolve({ id }) });
}

async function transition(id: string, email: string, body: Record<string, unknown>): Promise<void> {
  const res = await postTransition(
    apiRequest("POST", `/api/reports/${id}/transitions`, { body, headers: authHeaders(email, "panel") }),
    { params: Promise.resolve({ id }) },
  );
  expect(res.status, `${email} ${String(body.action)}`).toBe(201);
}

async function comment(id: string, email: string, text: string): Promise<void> {
  const res = await postComment(
    apiRequest("POST", `/api/reports/${id}/comments`, { body: { body: text }, headers: authHeaders(email, "panel") }),
    { params: Promise.resolve({ id }) },
  );
  expect(res.status, `${email} comment`).toBe(201);
}

// After every step the child's device gets 403 and the 6b teacher gets 404.
async function expectClosedToOthers(id: string): Promise<void> {
  expect((await detail(id, authHeaders(P1, "extension"))).status).toBe(403);
  expect((await detail(id, authHeaders(T2, "panel"))).status).toBe(404);
}

beforeEach(() => {
  fakeSupabase.reset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("report lifecycle", () => {
  it("records submit, approve, escalate, close, reopen and close with the thread", async () => {
    const created = await postReport(
      apiRequest("POST", "/api/reports", {
        body: {
          attack_type: "phishing",
          taken_actions: ["clicked_link"],
          source: "email",
          content: "Fikcyjny mail testowy (demo): zaloguj się na https://dziennik-test.example",
        },
        headers: authHeaders(P1, "extension"),
      }),
    );
    expect(created.status).toBe(201);
    const { id } = (await created.json()) as { id: string };
    await expectClosedToOthers(id);

    const steps: Array<() => Promise<void>> = [
      () => transition(id, P1, { action: "approve" }),
      () => comment(id, T1, "Czy Ola wpisała hasło? (demo)"),
      () => comment(id, P1, "Nie, tylko kliknęła w link. (demo)"),
      () => transition(id, T1, { action: "escalate", comment: "Zgłoszono do CERT Polska (NASK) - demo." }),
      () => transition(id, T1, { action: "close", comment: "Sprawa wyjaśniona (demo)." }),
      () => transition(id, P1, { action: "reopen" }),
      () => transition(id, T1, { action: "close" }),
    ];
    for (const step of steps) {
      await step();
      await expectClosedToOthers(id);
    }

    const parentRes = await detail(id, authHeaders(P1, "panel"));
    expect(parentRes.status).toBe(200);
    const parentView = (await parentRes.json()) as ReportDetail;

    expect(parentView.state).toBe("closed");
    expect(parentView.history.map((h) => h.action)).toEqual(["submit", "approve", "escalate", "close", "reopen", "close"]);
    expect(parentView.history[0].from_state).toBeNull();
    for (let i = 1; i < parentView.history.length; i += 1) {
      expect(parentView.history[i].from_state).toBe(parentView.history[i - 1].to_state);
    }
    expect(parentView.history.map((h) => h.to_state)).toEqual([
      "pending_parent",
      "with_teacher",
      "escalated",
      "closed",
      "with_teacher",
      "closed",
    ]);
    expect(parentView.history.map((h) => h.actor_role)).toEqual(["child", "parent", "teacher", "teacher", "parent", "teacher"]);
    expect(parentView.history[2].comment).toBe("Zgłoszono do CERT Polska (NASK) - demo.");
    expect(parentView.updated_at).toBe(parentView.history.at(-1)?.created_at);

    const times = parentView.history.map((h) => Date.parse(h.created_at));
    expect(times).toEqual([...times].sort((a, b) => a - b));

    expect(parentView.comments.map((c) => [c.author_id, c.author_role, c.body])).toEqual([
      [T1_ID, "teacher", "Czy Ola wpisała hasło? (demo)"],
      [P1_ID, "parent", "Nie, tylko kliknęła w link. (demo)"],
    ]);

    const teacherRes = await detail(id, authHeaders(T1, "panel"));
    expect(teacherRes.status).toBe(200);
    expect(await teacherRes.json()).toEqual(parentView);
  });
});
