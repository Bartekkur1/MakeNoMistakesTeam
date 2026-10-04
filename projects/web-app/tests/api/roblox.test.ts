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
  roblox_username: "Robloxianu5a9m1s7a",
  roblox_user_id: 10371703006,
  attack_type: "data_request",
  source: "game",
  taken_actions: [],
  content: "Gracz MatiBuilds oferował darmowe Robuxy w zamian za hasło. Uczeń odmówił.",
  hints_used: 1,
  score: 3,
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
      `Gra Roblox, gracz Robloxianu5a9m1s7a. Wynik szkolenia: 3/3 pkt. Użyte wskazówki: 1.\n\n${GAME_BODY.content}`,
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

  it("records entered_password for a compromised_password outcome", async () => {
    const res = await postIngest({ ...GAME_BODY, attack_type: "fake_prize", outcome: "compromised_password", score: 0 });
    expect(res.status).toBe(201);
    expect(fakeSupabase.tables.reports[0].taken_actions).toEqual(["entered_password"]);
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
