-- 0001_init.sql
create extension if not exists pgcrypto;

-- ── tenancy ──────────────────────────────────────────────
create table if not exists public.orgs (
  id   text primary key,
  name text not null
);

create table if not exists public.profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  org_id       text not null references public.orgs(id),
  display_name text not null default '',
  role         text not null default 'operator' check (role in ('operator','admin'))
);

create or replace function public.current_org_id() returns text
language sql stable security definer set search_path = public as $$
  select org_id from public.profiles where user_id = auth.uid()
$$;
revoke all on function public.current_org_id() from public;
grant execute on function public.current_org_id() to authenticated;

-- ── reference data ───────────────────────────────────────
create table if not exists public.catalogue_items (
  org_id               text not null references public.orgs(id),
  sku                  text not null,
  name                 text not null,
  description          text not null default '',
  attributes           jsonb not null default '{}'::jsonb,
  reference_image_path text,               -- key in bucket 'catalogue' (org_id/...)
  created_at           timestamptz not null default now(),
  primary key (org_id, sku)
);

create table if not exists public.orders (
  org_id     text not null references public.orgs(id),
  order_id   text not null,
  unit_id    text not null,                -- join key across the five buildathon repos
  channel    text not null check (channel in ('amazon_mfn','shopify','walmart','3pl_client')),
  status     text not null default 'open'
             check (status in ('open','analyzing','sealed','stopped','uncertain','pending','overridden')),
  created_at timestamptz not null default now(),
  primary key (org_id, order_id),
  unique (org_id, unit_id)
);

create table if not exists public.order_lines (
  org_id   text not null,
  order_id text not null,
  sku      text not null,
  qty      integer not null check (qty > 0),
  primary key (org_id, order_id, sku),
  foreign key (org_id, order_id) references public.orders(org_id, order_id) on delete cascade
);

-- ── evidence (insert-only by policy) ─────────────────────
create table if not exists public.captures (
  id          uuid primary key default gen_random_uuid(),
  org_id      text not null references public.orgs(id),
  unit_id     text not null,
  order_id    text not null,
  attempt_no  integer not null check (attempt_no >= 1),
  operator_id uuid not null references auth.users(id),
  captured_at timestamptz not null default now(),
  photos      jsonb not null,              -- [{path, sha256, bytes, width, height}]
  client_meta jsonb not null default '{}'::jsonb,
  unique (org_id, unit_id, attempt_no),
  foreign key (org_id, order_id) references public.orders(org_id, order_id)
);

create table if not exists public.analyses (
  id             uuid primary key default gen_random_uuid(),
  org_id         text not null references public.orgs(id),
  capture_id     uuid not null references public.captures(id),
  unit_id        text not null,
  status         text not null check (status in ('decided','pending')),
  verdict        text check (verdict in ('SEAL','STOP_AND_FIX','UNCERTAIN')),
  route          text not null check (route in ('SEAL','STOP_AND_FIX','HOLD_RECAPTURE_OR_REVIEW','PENDING')),
  error_code     text,
  observation    jsonb,
  checks         jsonb not null default '[]'::jsonb,
  discrepancies  jsonb not null default '[]'::jsonb,
  trace          jsonb not null,           -- model, prompt_version, thresholds, latency, tokens
  order_snapshot jsonb not null,           -- order lines + catalogue rows as sent to the model
  content_hash   text not null,            -- sha256 of canonical JSON of this row's evidence
  idempotency_key text,
  created_at     timestamptz not null default now(),
  unique (org_id, idempotency_key)
);

create table if not exists public.overrides (
  id               uuid primary key default gen_random_uuid(),
  org_id           text not null references public.orgs(id),
  analysis_id      uuid not null references public.analyses(id),
  unit_id          text not null,
  operator_id      uuid not null references auth.users(id),
  original_verdict text,                   -- what the agent said (null if pending)
  original_route   text not null,
  new_verdict      text not null check (new_verdict in ('SEAL','STOP_AND_FIX')),
  reason_code      text not null check (reason_code in
                   ('agent_wrong_count','agent_wrong_item','photo_unclear_but_ok','model_unavailable','other')),
  reason_text      text not null default '',
  prev_hash        text not null,          -- analysis.content_hash or previous override row_hash
  row_hash         text not null,          -- sha256(prev_hash || canonical JSON of this override)
  created_at       timestamptz not null default now(),
  check (reason_code <> 'other' or length(btrim(reason_text)) >= 5)
);

create table if not exists public.audit_log (
  id         bigint generated always as identity primary key,
  org_id     text not null references public.orgs(id),
  unit_id    text,
  actor      uuid,
  action     text not null,                -- login, import, capture, analyze, confirm, override, export, api_read
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_org_status on public.orders (org_id, status);
create index if not exists idx_captures_org_unit on public.captures (org_id, unit_id);
create index if not exists idx_analyses_org_unit_created on public.analyses (org_id, unit_id, created_at desc);
create index if not exists idx_overrides_org_unit_created on public.overrides (org_id, unit_id, created_at);
create index if not exists idx_audit_log_org_created on public.audit_log (org_id, created_at desc);

-- ── RLS: enable AND force everywhere ─────────────────────
do $$
declare t text;
begin
  foreach t in array array['orgs','profiles','catalogue_items','orders','order_lines',
                           'captures','analyses','overrides','audit_log']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force  row level security', t);
  end loop;
end $$;

-- drop existing policies to be idempotent
drop policy if exists orgs_select on public.orgs;
drop policy if exists profiles_select on public.profiles;
drop policy if exists cat_all on public.catalogue_items;
drop policy if exists ord_all on public.orders;
drop policy if exists lines_all on public.order_lines;
drop policy if exists cap_select on public.captures;
drop policy if exists cap_insert on public.captures;
drop policy if exists ana_select on public.analyses;
drop policy if exists ana_insert on public.analyses;
drop policy if exists ovr_select on public.overrides;
drop policy if exists ovr_insert on public.overrides;
drop policy if exists aud_select on public.audit_log;
drop policy if exists aud_insert on public.audit_log;

-- orgs / profiles: read own only
create policy orgs_select     on public.orgs     for select to authenticated using (id = public.current_org_id());
create policy profiles_select on public.profiles for select to authenticated using (user_id = auth.uid());

-- mutable reference data: full CRUD inside own org
create policy cat_all on public.catalogue_items for all to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy ord_all on public.orders for all to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());
create policy lines_all on public.order_lines for all to authenticated
  using (org_id = public.current_org_id()) with check (org_id = public.current_org_id());

-- evidence: select + insert only (NO update / delete policies)
create policy cap_select on public.captures  for select to authenticated using (org_id = public.current_org_id());
create policy cap_insert on public.captures  for insert to authenticated with check (org_id = public.current_org_id() and operator_id = auth.uid());
create policy ana_select on public.analyses  for select to authenticated using (org_id = public.current_org_id());
create policy ana_insert on public.analyses  for insert to authenticated with check (org_id = public.current_org_id());
create policy ovr_select on public.overrides for select to authenticated using (org_id = public.current_org_id());
create policy ovr_insert on public.overrides for insert to authenticated with check (org_id = public.current_org_id() and operator_id = auth.uid());
create policy aud_select on public.audit_log for select to authenticated using (org_id = public.current_org_id());
create policy aud_insert on public.audit_log for insert to authenticated with check (org_id = public.current_org_id());

-- ── Storage ──────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('captures','captures', false)  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('catalogue','catalogue', false) on conflict (id) do nothing;

drop policy if exists captures_select on storage.objects;
drop policy if exists captures_insert on storage.objects;

create policy captures_select on storage.objects for select to authenticated
  using (bucket_id in ('captures','catalogue') and (storage.foldername(name))[1] = public.current_org_id());
create policy captures_insert on storage.objects for insert to authenticated
  with check (bucket_id in ('captures','catalogue') and (storage.foldername(name))[1] = public.current_org_id());
