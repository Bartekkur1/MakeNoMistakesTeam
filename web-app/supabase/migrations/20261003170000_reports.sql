-- Reports, their append-only history and comments (contract v2, D-05, D-08..D-17).
--
-- Written by plan 01-04. Applied ONLY by a human in plan 01-06 (D-06): no agent runs this file
-- against any database. Every enum value, limit and allowed history tuple below mirrors
-- web-app/src/lib/contract/types.ts; tests/lib/schema-mirror.test.ts enforces the mirror.
-- When the contract changes, add a new migration instead of editing this one after it is applied.
--
-- Accounts, children and classes are hardcoded in code (web-app/src/lib/contract/demo-accounts.ts,
-- D-14), so parent_id, child_id, actor_id and author_id are plain uuids without foreign keys.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null,
  child_id uuid not null,
  attack_type text not null
    constraint reports_attack_type_check
    check (attack_type in ('phishing', 'data_request', 'fake_prize', 'purchase_trap', 'impersonation', 'other')),
  taken_actions text[] not null default '{}'
    constraint reports_taken_actions_check
    check (taken_actions <@ array['clicked_link', 'entered_password', 'shared_code', 'shared_personal_data', 'paid', 'downloaded_file', 'replied']::text[]),
  source text not null
    constraint reports_source_check
    check (source in ('game', 'email', 'sms', 'discord', 'other')),
  content text not null
    constraint reports_content_check
    check (char_length(btrim(content)) between 1 and 5000),
  state text not null default 'pending_parent'
    constraint reports_state_check
    check (state in ('pending_parent', 'rejected', 'with_teacher', 'escalated', 'closed')),
  -- Millisecond precision keeps API timestamps and list cursors exact.
  created_at timestamptz not null default date_trunc('milliseconds', now()),
  updated_at timestamptz not null default date_trunc('milliseconds', now()),
  constraint reports_updated_after_created_check check (updated_at >= created_at)
);

create table public.report_history (
  id uuid primary key default gen_random_uuid(),
  -- Canonical order of entries; never exposed by the API.
  seq bigint generated always as identity,
  report_id uuid not null references public.reports(id) on delete cascade,
  action text not null
    constraint report_history_action_check
    check (action in ('submit', 'approve', 'reject', 'escalate', 'close', 'reopen')),
  from_state text null
    constraint report_history_from_state_check
    check (from_state is null or from_state in ('pending_parent', 'rejected', 'with_teacher', 'escalated', 'closed')),
  to_state text not null
    constraint report_history_to_state_check
    check (to_state in ('pending_parent', 'rejected', 'with_teacher', 'escalated', 'closed')),
  actor_id uuid not null,
  actor_role text not null
    constraint report_history_actor_role_check
    check (actor_role in ('child', 'parent', 'teacher')),
  comment text null
    constraint report_history_comment_check
    check (comment is null or char_length(btrim(comment)) between 1 and 1000),
  created_at timestamptz not null default date_trunc('milliseconds', now()),
  -- The submit entry plus one tuple per TRANSITIONS row x from state x role (D-08, D-09).
  -- Tuples are (action, from_state or '', to_state, actor_role).
  constraint report_history_transition_check check (
    (action, coalesce(from_state, ''), to_state, actor_role) in (
      ('submit','','pending_parent','child'),
      ('approve','pending_parent','with_teacher','parent'),
      ('approve','rejected','with_teacher','parent'),
      ('reject','pending_parent','rejected','parent'),
      ('reject','with_teacher','rejected','parent'),
      ('escalate','with_teacher','escalated','teacher'),
      ('close','with_teacher','closed','teacher'),
      ('close','escalated','closed','teacher'),
      ('reopen','closed','with_teacher','parent'),
      ('reopen','closed','with_teacher','teacher'),
      ('reopen','rejected','pending_parent','parent')
    )
  ),
  -- Escalation must name where it went (D-08).
  constraint report_history_escalate_comment_check check (action <> 'escalate' or comment is not null)
);

create table public.report_comments (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity,
  report_id uuid not null references public.reports(id) on delete cascade,
  author_id uuid not null,
  author_role text not null
    constraint report_comments_author_role_check
    check (author_role in ('parent', 'teacher')),
  body text not null
    constraint report_comments_body_check
    check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default date_trunc('milliseconds', now())
);

-- ---------------------------------------------------------------------------
-- Indexes (lists are ordered created_at desc, id desc; details read history/comments by seq)
-- ---------------------------------------------------------------------------

create index reports_parent_created_idx on public.reports (parent_id, created_at desc, id desc);
create index reports_child_created_idx on public.reports (child_id, created_at desc, id desc);
create index report_history_report_seq_idx on public.report_history (report_id, seq);
create index report_comments_report_seq_idx on public.report_comments (report_id, seq);

-- ---------------------------------------------------------------------------
-- Append-only history and comments (D-10, D-11)
-- ---------------------------------------------------------------------------

create function public.forbid_update() returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception '% is append-only', tg_table_name;
end;
$$;

create trigger report_history_no_update
  before update on public.report_history
  for each row execute function public.forbid_update();

create trigger report_comments_no_update
  before update on public.report_comments
  for each row execute function public.forbid_update();

-- Triggers fire regardless of EXECUTE grants; no API role needs to call this function directly.
revoke execute on function public.forbid_update() from public, anon, authenticated;
grant execute on function public.forbid_update() to service_role;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
-- Only the server connects, with the service_role key (D-03), and service_role bypasses RLS.
-- Enabling RLS without any policy closes Supabase's auto-generated REST API on these tables
-- to the anon/publishable key.

alter table public.reports enable row level security;
alter table public.report_history enable row level security;
alter table public.report_comments enable row level security;

-- ---------------------------------------------------------------------------
-- create_report: the report and its "submit" history entry in one transaction (D-10)
-- ---------------------------------------------------------------------------

create function public.create_report(
  p_parent_id uuid,
  p_child_id uuid,
  p_attack_type text,
  p_taken_actions text[],
  p_source text,
  p_content text
) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_now timestamptz := date_trunc('milliseconds', now());
  v_report public.reports;
begin
  insert into public.reports (parent_id, child_id, attack_type, taken_actions, source, content, state, created_at, updated_at)
  values (p_parent_id, p_child_id, p_attack_type, p_taken_actions, p_source, p_content, 'pending_parent', v_now, v_now)
  returning * into v_report;

  insert into public.report_history (report_id, action, from_state, to_state, actor_id, actor_role, comment, created_at)
  values (v_report.id, 'submit', null, 'pending_parent', p_child_id, 'child', null, v_now);

  return to_jsonb(v_report);
end;
$$;

revoke execute on function public.create_report(uuid, uuid, text, text[], text, text) from public, anon, authenticated;
grant execute on function public.create_report(uuid, uuid, text, text[], text, text) to service_role;
