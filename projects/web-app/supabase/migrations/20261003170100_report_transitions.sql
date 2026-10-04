-- Report workflow transitions (contract v2, API-02, D-08, D-09, D-10, D-17).
--
-- Written by plan 01-05. Applied ONLY by a human in plan 01-06 (D-06): no agent runs this file
-- against any database. Run it after 20261003170000_reports.sql.
--
-- transition_report changes the state of one report and writes its history entry in one
-- transaction. The API resolves the transition (403 forbidden / 409 invalid_transition) against
-- TRANSITIONS in web-app/src/lib/contract/types.ts before calling it; the database still checks
-- every history tuple through report_history_transition_check, so a tuple outside the matrix
-- raises and rolls the whole call back.
--
-- Concurrency: the update only matches while the report is still in p_from_state. When another
-- request changed the state first, nothing is updated or inserted and the function returns null;
-- the API answers 409 invalid_transition.

create function public.transition_report(
  p_report_id uuid,
  p_action text,
  p_from_state text,
  p_to_state text,
  p_actor_id uuid,
  p_actor_role text,
  p_comment text
) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_now timestamptz := date_trunc('milliseconds', now());
  v_report public.reports;
  v_entry public.report_history;
begin
  update public.reports
    set state = p_to_state, updated_at = v_now
    where id = p_report_id and state = p_from_state
    returning * into v_report;

  if not found then
    return null;
  end if;

  insert into public.report_history (report_id, action, from_state, to_state, actor_id, actor_role, comment, created_at)
  values (p_report_id, p_action, p_from_state, p_to_state, p_actor_id, p_actor_role, p_comment, v_now)
  returning * into v_entry;

  return jsonb_build_object('report', to_jsonb(v_report), 'entry', to_jsonb(v_entry));
end;
$$;

revoke execute on function public.transition_report(uuid, text, text, text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.transition_report(uuid, text, text, text, uuid, text, text) to service_role;
