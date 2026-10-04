-- History and comments cannot be deleted or truncated (contract v2 "Wpis historii" and
-- "Komentarz": entries cannot be edited or deleted; D-10, D-11).
--
-- Applied ONLY by a human (D-06): no agent runs this file against any database. Run it after
-- 20261003170100_report_transitions.sql. The two earlier migrations are already applied, so
-- they stay unchanged; 20261003170000_reports.sql blocks only UPDATE (forbid_update).
--
-- What this adds:
-- - a direct DELETE on public.report_history or public.report_comments raises;
-- - TRUNCATE on either table raises (also TRUNCATE ... CASCADE from public.reports);
-- - deleting a report still removes its history and comments through on delete cascade.
--   The demo reset in supabase/seed.sql relies on that cascade.
--
-- How the cascade is told apart from a direct DELETE: the cascade runs inside the foreign key
-- trigger of public.reports, so this trigger fires nested (pg_trigger_depth() > 1), and by then
-- the parent report is already gone. A direct DELETE fires at depth 1, and a DELETE issued from
-- some other trigger still finds its report, so both raise.

create function public.forbid_delete() returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    if not exists (select 1 from public.reports where id = old.report_id) then
      return old;
    end if;
  end if;
  raise exception '% is append-only', tg_table_name;
end;
$$;

create trigger report_history_no_delete
  before delete on public.report_history
  for each row execute function public.forbid_delete();

create trigger report_comments_no_delete
  before delete on public.report_comments
  for each row execute function public.forbid_delete();

create trigger report_history_no_truncate
  before truncate on public.report_history
  for each statement execute function public.forbid_delete();

create trigger report_comments_no_truncate
  before truncate on public.report_comments
  for each statement execute function public.forbid_delete();

-- Triggers fire regardless of EXECUTE grants; no API role needs to call this function directly.
revoke execute on function public.forbid_delete() from public, anon, authenticated;
grant execute on function public.forbid_delete() to service_role;
