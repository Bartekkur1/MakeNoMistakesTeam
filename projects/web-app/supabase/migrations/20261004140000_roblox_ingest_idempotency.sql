-- Roblox attempt, report, submit history and immutable ack in one transaction.
-- Additive migration; application and real-database verification belong to plan 03-03.
create table public.roblox_ingest_attempts (
  attempt_id uuid primary key,
  request_fingerprint text not null check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  -- Deferred FK lets the winner claim its key before inserting the report in this transaction.
  report_id uuid not null unique references public.reports(id) deferrable initially deferred,
  ack_child_name text not null check (char_length(btrim(ack_child_name)) > 0),
  ack_parent_name text not null check (char_length(btrim(ack_parent_name)) > 0),
  ack_state text not null check (ack_state = 'pending_parent'),
  ack_matched boolean not null
);

alter table public.roblox_ingest_attempts enable row level security;
revoke all on table public.roblox_ingest_attempts from public, anon, authenticated, service_role;
grant select, insert on table public.roblox_ingest_attempts to service_role;

create trigger roblox_ingest_attempts_no_update
  before update on public.roblox_ingest_attempts
  for each row execute function public.forbid_update();
create trigger roblox_ingest_attempts_no_delete
  before delete on public.roblox_ingest_attempts
  for each row execute function public.forbid_delete();
create trigger roblox_ingest_attempts_no_truncate
  before truncate on public.roblox_ingest_attempts
  for each statement execute function public.forbid_delete();

create function public.create_roblox_ingest_report(
  p_attempt_id uuid,
  p_request_fingerprint text,
  p_parent_id uuid,
  p_child_id uuid,
  p_attack_type text,
  p_taken_actions text[],
  p_content text,
  p_child_name text,
  p_parent_name text,
  p_matched boolean
) returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_attempt public.roblox_ingest_attempts;
  v_report_id uuid := gen_random_uuid();
  v_now timestamptz := date_trunc('milliseconds', now());
  v_created boolean;
begin
  -- ON CONFLICT waits for a concurrent winner to commit or roll back. The next SELECT
  -- gets a fresh READ COMMITTED snapshot; never combine it with this INSERT in a CTE.
  insert into public.roblox_ingest_attempts
    (attempt_id, request_fingerprint, report_id, ack_child_name, ack_parent_name, ack_state, ack_matched)
  values
    (p_attempt_id, p_request_fingerprint, v_report_id, p_child_name, p_parent_name, 'pending_parent', p_matched)
  on conflict (attempt_id) do nothing
  returning * into v_attempt;
  v_created := found;

  if not v_created then
    select * into strict v_attempt from public.roblox_ingest_attempts where attempt_id = p_attempt_id;
    if v_attempt.request_fingerprint <> p_request_fingerprint then
      return jsonb_build_object('result', 'conflict');
    end if;
  else
    insert into public.reports
      (id, parent_id, child_id, attack_type, taken_actions, source, content, state, created_at, updated_at)
    values
      (v_report_id, p_parent_id, p_child_id, p_attack_type, p_taken_actions, 'game', p_content, 'pending_parent', v_now, v_now);

    insert into public.report_history
      (report_id, action, from_state, to_state, actor_id, actor_role, comment, created_at)
    values
      (v_report_id, 'submit', null, 'pending_parent', p_child_id, 'child', null, v_now);
  end if;

  return jsonb_build_object(
    'result', case when v_created then 'created' else 'replayed' end,
    'report_id', v_attempt.report_id,
    'child_name', v_attempt.ack_child_name,
    'parent_name', v_attempt.ack_parent_name,
    'state', v_attempt.ack_state,
    'matched', v_attempt.ack_matched
  );
end;
$$;

revoke execute on function public.create_roblox_ingest_report(uuid, text, uuid, uuid, text, text[], text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.create_roblox_ingest_report(uuid, text, uuid, uuid, text, text[], text, text, text, text, boolean) to service_role;
