-- Roblox nick of a demo child (contract "Konto Roblox dziecka", POST /api/reports/ingest).
--
-- Applied ONLY by a human: no agent runs this file against any database. Run it after
-- 20261003170200_append_only_guards.sql.
--
-- A parent links one Roblox nick to their child in the panel. The Roblox game server then sends
-- the training result with that nick to POST /api/reports/ingest, and the server files the report
-- for the child the nick belongs to. Children and parents are hardcoded in code (D-14), so
-- child_id and parent_id are plain uuids without foreign keys.

create table public.child_roblox_accounts (
  child_id uuid primary key,
  parent_id uuid not null,
  -- Roblox usernames: 3 to 20 letters, digits or underscores (ROBLOX_USERNAME_PATTERN in types.ts).
  roblox_username text not null
    constraint child_roblox_accounts_username_check
    check (roblox_username ~ '^[A-Za-z0-9_]{3,20}$'),
  -- Roblox nicks are case-insensitive, so one nick can belong to only one child in any spelling.
  roblox_username_key text generated always as (lower(roblox_username)) stored
    constraint child_roblox_accounts_username_key unique,
  updated_at timestamptz not null default date_trunc('milliseconds', now())
);

create index child_roblox_accounts_parent_idx on public.child_roblox_accounts (parent_id);

-- Only the server connects, with the service_role key (D-03); RLS without policies closes the
-- auto-generated REST API to the anon key.
alter table public.child_roblox_accounts enable row level security;

-- ---------------------------------------------------------------------------
-- set_child_roblox_account: links (or relinks) a nick to a child.
-- ---------------------------------------------------------------------------
-- Returns the stored row as jsonb, or null when the nick already belongs to another child
-- (the API answers 400 validation_error on the roblox_username field).

create function public.set_child_roblox_account(
  p_child_id uuid,
  p_parent_id uuid,
  p_roblox_username text
) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_row public.child_roblox_accounts;
begin
  if exists (
    select 1 from public.child_roblox_accounts
    where roblox_username_key = lower(p_roblox_username) and child_id <> p_child_id
  ) then
    return null;
  end if;

  insert into public.child_roblox_accounts (child_id, parent_id, roblox_username, updated_at)
  values (p_child_id, p_parent_id, p_roblox_username, date_trunc('milliseconds', now()))
  on conflict (child_id) do update
    set parent_id = excluded.parent_id,
        roblox_username = excluded.roblox_username,
        updated_at = excluded.updated_at
  returning * into v_row;

  return to_jsonb(v_row);
exception
  -- A concurrent link of the same nick to another child.
  when unique_violation then
    return null;
end;
$$;

revoke execute on function public.set_child_roblox_account(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.set_child_roblox_account(uuid, uuid, text) to service_role;
