import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as ingest } from "@/app/api/reports/ingest/route";
import { GET as listAccounts, POST as saveAccount } from "@/app/api/roblox-accounts/route";
import { DEMO_ACCOUNTS, DEMO_CHILDREN } from "@/lib/contract/demo-accounts";
import { fakeSupabase } from "../helpers/fake-supabase";
import { apiRequest, authHeaders } from "../helpers/auth";

vi.mock("@supabase/supabase-js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@supabase/supabase-js")>();
  const { fakeSupabase: fake } = await import("../helpers/fake-supabase");
  return { ...actual, createClient: () => fake.client };
});

const SECRET = "test-only-roblox-ingest-secret";
const P1 = "rodzic.ola@bezpiecznaaura.example";
const P2 = "rodzic.kuba@bezpiecznaaura.example";
const T1 = "nauczyciel.5a@bezpiecznaaura.example";
const OLA = DEMO_CHILDREN[0];
const KUBA = DEMO_CHILDREN[1];

const GAME_BODY = {
  attempt_id: "a0000000-0000-4000-8000-000000000001",
  roblox_username: "Robloxianu5a9m1s7a",
  roblox_user_id: 10371703006,
  attack_type: "data_request",
  source: "game",
  taken_actions: [],
  content: "Gracz MatiBuilds oferował darmowe Robuxy w zamian za hasło. Uczeń odmówił.",
  hints_used: 1,
  outcome: "safe_refusal",
};

function postIngest(body: unknown, secret: string | null = SECRET): Promise<Response> {
  const headers: Record<string, string> = secret === null ? {} : { "x-ingest-secret": secret };
  return ingest(apiRequest("POST", "/api/reports/ingest", { body, headers }));
}

function postAccount(email: string, body: unknown): Promise<Response> {
  return saveAccount(apiRequest("POST", "/api/roblox-accounts", { body, headers: authHeaders(email) }));
}

beforeEach(() => {
  fakeSupabase.reset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/reports/ingest", () => {
  it("rejects a missing or wrong secret with 401 and stores nothing", async () => {
    for (const secret of [null, "wrong-secret-value-xyz"]) {
      const res = await postIngest(GAME_BODY, secret);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ ok: false, error: "invalid_ingest_secret" });
    }
    expect(fakeSupabase.tables.reports).toHaveLength(0);
  });

  it("fails closed with 500 when the server has no secret configured", async () => {
    vi.stubEnv("ROBLOX_INGEST_SECRET", "");
    const res = await postIngest(GAME_BODY);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ ok: false, error: "ingest_not_configured" });
  });

  it("files an unlinked nick for the demo fallback child (Ola) in pending_parent", async () => {
    const res = await postIngest(GAME_BODY);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      child_name: "Ola (demo)",
      parent_name: "Mama Oli (demo)",
      state: "pending_parent",
      matched: false,
    });
    const [report] = fakeSupabase.tables.reports;
    expect(report.id).toBe(body.report_id);
    expect(report.child_id).toBe(OLA.id);
    expect(report.parent_id).toBe(OLA.parent_id);
    expect(report.source).toBe("game");
    expect(report.taken_actions).toEqual([]);
    expect(report.content).toBe(
      `Ćwiczenie Roblox, gracz Robloxianu5a9m1s7a. Wynik ćwiczenia: bezpieczna odmowa. Użyte wskazówki: 1.\n\n${GAME_BODY.content}`,
    );
  });

  it("files a linked nick for the linked child, case-insensitively", async () => {
    expect((await postAccount(P2, { child_id: KUBA.id, roblox_username: "KubaGra_12" })).status).toBe(200);
    const res = await postIngest({ ...GAME_BODY, roblox_username: "kubagra_12" });
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ child_name: "Kuba (demo)", parent_name: "Tata Kuby (demo)", matched: true });
    expect(fakeSupabase.tables.reports[0].child_id).toBe(KUBA.id);
    expect(fakeSupabase.tables.reports[0].parent_id).toBe(DEMO_ACCOUNTS[1].id);
  });

  it("keeps compromised_password fictional without entered_password", async () => {
    const res = await postIngest({ ...GAME_BODY, attack_type: "fake_prize", outcome: "compromised_password", score: 0 });
    expect(res.status).toBe(201);
    expect(fakeSupabase.tables.reports[0].taken_actions).toEqual([]);
    expect(fakeSupabase.tables.reports[0].content).toContain("fikcyjne przekazanie hasła");
  });

  it("replays one attempt with the immutable acknowledgement after routing and state change", async () => {
    const first = await postIngest(GAME_BODY);
    expect(first.status).toBe(201);
    const ack = await first.json();
    fakeSupabase.tables.reports[0].state = "closed";
    await postAccount(P2, { child_id: KUBA.id, roblox_username: GAME_BODY.roblox_username });
    const repeat = await postIngest(GAME_BODY);
    expect(repeat.status).toBe(200);
    expect(await repeat.json()).toEqual(ack);
    expect(fakeSupabase.tables.reports).toHaveLength(1);
    expect(fakeSupabase.tables.report_history).toHaveLength(1);
  });

  it("converges concurrent identical attempts into one report and submit entry", async () => {
    const replies = await Promise.all(Array.from({ length: 8 }, () => postIngest(GAME_BODY)));
    expect(replies.filter((r) => r.status === 201)).toHaveLength(1);
    expect(replies.filter((r) => r.status === 200)).toHaveLength(7);
    const acks = await Promise.all(replies.map((r) => r.json()));
    for (const ack of acks) expect(ack).toEqual(acks[0]);
    expect(fakeSupabase.tables.reports).toHaveLength(1);
    expect(fakeSupabase.tables.report_history).toHaveLength(1);
  });

  it("rejects a different validated payload on the same attempt without exposing the acknowledgement", async () => {
    await postIngest(GAME_BODY);
    for (const change of [{ outcome: "compromised_password" }, { hints_used: 0 }, { roblox_user_id: 99 }, { content: "Inne ćwiczenie" }]) {
      const reply = await postIngest({ ...GAME_BODY, ...change });
      expect(reply.status).toBe(409);
      expect(await reply.json()).toEqual({ ok: false, error: "idempotency_conflict" });
    }
    expect(fakeSupabase.tables.reports).toHaveLength(1);
  });

  it("fingerprints normalized fields and ignores unvalidated extras", async () => {
    const first = await postIngest(GAME_BODY);
    const again = await postIngest({ ...GAME_BODY, content: ` ${GAME_BODY.content} `, ignored: "extra", attempt_id: GAME_BODY.attempt_id.toUpperCase() });
    expect(again.status).toBe(200);
    expect(await again.json()).toEqual(await first.json());
  });

  it("creates a separate report for each new attempt", async () => {
    await postIngest(GAME_BODY);
    expect((await postIngest({ ...GAME_BODY, attempt_id: "a0000000-0000-4000-8000-000000000002" })).status).toBe(201);
    expect(fakeSupabase.tables.reports).toHaveLength(2);
  });

  it("rejects missing or malformed attempt IDs and help flags outside 0 or 1", async () => {
    for (const change of [{ attempt_id: undefined }, { attempt_id: "not-a-uuid" }, { hints_used: 2 }]) {
      expect((await postIngest({ ...GAME_BODY, ...change })).status).toBe(400);
    }
    expect(fakeSupabase.tables.reports).toHaveLength(0);
  });

  it("fails closed on RPC failure or malformed acknowledgement", async () => {
    fakeSupabase.beforeNextRpc((fake) => fake.failNext({ code: "08006", message: "failure" }));
    expect((await postIngest(GAME_BODY)).status).toBe(503);
    expect(fakeSupabase.tables.reports).toHaveLength(0);
    const original = fakeSupabase.rpcHandlers.create_roblox_ingest_report;
    try {
      fakeSupabase.rpcHandlers.create_roblox_ingest_report = () => ({ data: { created: true }, error: null });
      const res = await postIngest(GAME_BODY);
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ ok: false, error: "storage_unavailable" });
    } finally {
      if (original) fakeSupabase.rpcHandlers.create_roblox_ingest_report = original;
      else delete fakeSupabase.rpcHandlers.create_roblox_ingest_report;
    }
  });

  it("answers 400 validation_error with details for a bad payload", async () => {
    const res = await postIngest({ ...GAME_BODY, roblox_username: "a", attack_type: "nope", score: 9, content: " " });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("validation_error");
    expect(body.details.map((d: { field: string }) => d.field)).toEqual(
      expect.arrayContaining(["roblox_username", "attack_type", "score", "content"]),
    );
    expect(fakeSupabase.tables.reports).toHaveLength(0);
  });

  it("answers 400 invalid_json for a non-JSON body", async () => {
    const res = await postIngest("not json");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: "invalid_json" });
  });

  it("answers 503 storage_unavailable when the database fails", async () => {
    fakeSupabase.failNext({ code: "08006", message: "connection failure" });
    const res = await postIngest(GAME_BODY);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false, error: "storage_unavailable" });
  });
});

describe("/api/roblox-accounts", () => {
  it("lets a parent link a nick to their child and lists it", async () => {
    const res = await postAccount(P1, { child_id: OLA.id, roblox_username: "  OlaGra " });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ child_id: OLA.id, roblox_username: "OlaGra" });

    const list = await listAccounts(apiRequest("GET", "/api/roblox-accounts", { headers: authHeaders(P1) }));
    expect(list.status).toBe(200);
    const { accounts } = await list.json();
    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toEqual({ child_id: OLA.id, roblox_username: "OlaGra", updated_at: expect.any(String) });
  });

  it("relinks the same child to a new nick", async () => {
    await postAccount(P1, { child_id: OLA.id, roblox_username: "OlaGra" });
    await postAccount(P1, { child_id: OLA.id, roblox_username: "OlaNowa" });
    expect(fakeSupabase.tables.child_roblox_accounts).toHaveLength(1);
    expect(fakeSupabase.tables.child_roblox_accounts[0].roblox_username).toBe("OlaNowa");
  });

  it("refuses a nick already linked to another child", async () => {
    await postAccount(P1, { child_id: OLA.id, roblox_username: "OlaGra" });
    const res = await postAccount(P2, { child_id: KUBA.id, roblox_username: "olagra" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.details[0]).toEqual({
      field: "roblox_username",
      message: "Ten nick jest już przypisany do innego dziecka.",
    });
  });

  it("refuses another parent's child, a teacher, an invalid nick and a missing login", async () => {
    expect((await postAccount(P2, { child_id: OLA.id, roblox_username: "Obcy123" })).status).toBe(403);
    expect((await postAccount(T1, { child_id: OLA.id, roblox_username: "Obcy123" })).status).toBe(403);
    expect((await postAccount(P1, { child_id: OLA.id, roblox_username: "zły nick!" })).status).toBe(400);
    const anon = await saveAccount(
      apiRequest("POST", "/api/roblox-accounts", { body: { child_id: OLA.id, roblox_username: "OlaGra" } }),
    );
    expect(anon.status).toBe(401);
    expect(fakeSupabase.tables.child_roblox_accounts).toHaveLength(0);
  });
});
