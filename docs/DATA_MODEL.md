# DATA_MODEL — Supabase Postgres schema, RLS, Storage

**Placement:** Project /docs/DATA_MODEL.md (agent copies the SQL into `supabase/migrations/0001_init.sql`) · **Status:** FINAL
Review the SQL once in the Supabase SQL editor before relying on it; run the isolation test in `TEST_PLAN.md` immediately after applying.

## 1. Principles
- Every table has `org_id text not null`. Sample data uses `org_demo_alpha` and `org_demo_bravo`.
- RLS is **ENABLED and FORCED** on every table (Engineering Rule 1).
- Evidence tables are **insert-only by policy** (no UPDATE/DELETE policies). Honest wording: append-only *by policy*; a database admin or the service role can still change rows. We store a hash chain so changes are *detectable by us*, not impossible.
- `orders.status` is the only mutable convenience field.
- Images live in a **private** bucket; object keys start with `org_id/` and include random UUIDs; access via 60 s signed URLs after an RLS-checked read.

## 2. SQL

```sql
-- 0001_init.sql
create extension if not exists pgcrypto;

-- ── tenancy ──────────────────────────────────────────────
create table public.orgs (
  id   text primary key,
  name text not null
);

create table public.profiles (
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
create table public.catalogue_items (
  org_id             text not null references public.orgs(id),
  sku                text not null,
  name               text not null,
  description        text not null default '',
  attributes         jsonb not null default '{}'::jsonb,
  reference_image_path text,               -- key in bucket 'catalogue' (org_id/...)
  created_at         timestamptz not null default now(),
  primary key (org_id, sku)
);

create table public.orders (
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

create table public.order_lines (
  org_id   text not null,
  order_id text not null,
  sku      text not null,
  qty      integer not null check (qty > 0),
  primary key (org_id, order_id, sku),
  foreign key (org_id, order_id) references public.orders(org_id, order_id) on delete cascade
);

-- ── evidence (insert-only by policy) ─────────────────────
create table public.captures (
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

create table public.analyses (
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

create table public.overrides (
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

create table public.audit_log (
  id         bigint generated always as identity primary key,
  org_id     text not null references public.orgs(id),
  unit_id    text,
  actor      uuid,
  action     text not null,                -- login, import, capture, analyze, confirm, override, export, api_read
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index on public.orders (org_id, status);
create index on public.captures (org_id, unit_id);
create index on public.analyses (org_id, unit_id, created_at desc);
create index on public.overrides (org_id, unit_id, created_at);
create index on public.audit_log (org_id, created_at desc);

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

create policy captures_select on storage.objects for select to authenticated
  using (bucket_id in ('captures','catalogue') and (storage.foldername(name))[1] = public.current_org_id());
create policy captures_insert on storage.objects for insert to authenticated
  with check (bucket_id in ('captures','catalogue') and (storage.foldername(name))[1] = public.current_org_id());
-- deliberately no update/delete policy on storage.objects
```

Notes for the agent:
- Verify `storage.foldername` behaviour on the current Supabase platform before trusting the storage policy; the storage isolation test in `TEST_PLAN.md` is the proof.
- The `service_role` key bypasses RLS. Use it ONLY in `scripts/seed.ts`, `scripts/eval/*`, and the evidence API's token check. Never import it in a client component or ship it to the browser.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the browser-safe key.

## 3. Canonical JSON and hashing

`lib/evidence/canonical.ts`: recursively sort object keys, no whitespace, UTF-8, numbers as JS `JSON.stringify` output, drop `undefined`. 
- `analyses.content_hash = sha256(canonical({ unit_id, order_snapshot, photos:[{sha256}], observation, checks, discrepancies, verdict, route, status, trace }))`
- `overrides.row_hash = sha256(prev_hash + canonical({ analysis_id, unit_id, operator_id, original_verdict, original_route, new_verdict, reason_code, reason_text, created_at }))`
- Image hashes: SHA-256 hex of the uploaded JPEG bytes; the server re-hashes what it stored and rejects mismatches.

## 4. Seed (`scripts/seed.ts`, service role)
1. Insert orgs `org_demo_alpha`, `org_demo_bravo`.
2. Create auth users `operator.alpha@example.test` and `operator.bravo@example.test` (passwords from env `SEED_PASSWORD`, never committed) via `auth.admin.createUser`, insert `profiles`.
3. Optional: load `data/pack_sample.csv` rows for the matching org into `orders` and `order_lines` (parse `order_lines`), plus a small demo catalogue (`data/demo_catalogue.json`, created by the owner from staged items).
4. Print counts. Idempotent (upsert).

## 5. Status mapping (`orders.status`)
`open` → (capture) `analyzing` → `sealed` (confirmed SEAL) | `stopped` (STOP_AND_FIX) | `uncertain` | `pending`; any override sets `overridden`.
