# API Coverage — Supabase (via @supabase/supabase-js, server-side only)

> Full coverage by default. Opt-outs are explicit, reasoned decisions.
> Scope: the Supabase capability surface reachable through supabase-js for contract v2 (reports, report history, comments). The SDK is imported only by `web-app/src/lib/server/supabase.ts`, using the server-side service_role key (D-02, D-03). The schema (`web-app/supabase/migrations/*.sql`) and the demo seed (`seed.sql`) are applied by a human, not through the SDK or by an agent (D-06).

| capability | decision | reason |
|---|---|---|
| table-select (from().select with eq/order/limit/maybeSingle) | INTEGRATE | health probe, report by id, history and comment timelines |
| table-insert (from().insert().select().single()) | INTEGRATE | comments |
| table-update (from().update()) | OPT-OUT | not needed: report state changes only through the transition_report RPC, so the state update and the history insert are atomic; history and comments are append-only (D-10, D-11) |
| table-upsert (from().upsert()) | OPT-OUT | not needed: every write is a distinct create, transition or comment; the re-runnable demo reset is seed.sql, run by a human (D-06) |
| table-delete (from().delete()) | OPT-OUT | explicitly out of scope: history and comments are append-only (D-10) and the API has no delete endpoint; the demo reset deletes only dataset rows in seed.sql |
| rpc (supabase.rpc on Postgres functions) | INTEGRATE | create_report and transition_report (atomic report + history writes), list_reports (cursor pagination with a row comparison) |
| auth (GoTrue sign-in, sessions, auth.admin) | OPT-OUT | explicitly out of scope: demo login is our own e-mail + code 0000 with HMAC-signed bearer tokens (D-14); clients never talk to Supabase (D-03) |
| storage (file buckets) | OPT-OUT | explicitly out of scope: no files or screenshots in phase 1 (WID-V2-01) |
| realtime (channels, postgres_changes) | OPT-OUT | explicitly out of scope: clients never connect to Supabase (D-03); the panel re-fetches over /api |
| functions (Edge Functions invoke) | OPT-OUT | not needed: business logic stays in Next.js route handlers (D-01) |
| schema switching (client.schema()) | OPT-OUT | not needed: all tables and functions live in the public schema |
