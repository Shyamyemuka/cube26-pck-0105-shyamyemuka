---
name: supabase-rls
description: Use when creating or changing Supabase tables, RLS policies, storage buckets/policies, auth helpers, seed scripts, or the tenancy isolation test for Pack Manager.
---

# supabase-rls

**Placement:** Project /skills/supabase-rls/SKILL.md

## Purpose
Guarantee that org B can never read or write org A's rows or images (Engineering Rule 1), and that evidence rows are insert-only by policy.

## Source of truth
`docs/DATA_MODEL.md` (SQL), `docs/TEST_PLAN.md` §2 (assertions I1–I10).

## Procedure
1. Every new table: `org_id text not null`, then `enable row level security` AND `force row level security`, then policies using `org_id = public.current_org_id()`.
2. Evidence tables (`captures`, `analyses`, `overrides`, `audit_log`): select + insert policies only. No update/delete policies.
3. Storage: private buckets, object keys `{org_id}/…/{uuid}.jpg`, policies on `storage.objects` matching `(storage.foldername(name))[1] = public.current_org_id()`. Access only via signed URLs (60 s).
4. Server code uses the user's session client. `service_role` only in `scripts/seed.ts`, `eval/`, and the evidence-API after token validation, and there it adds an explicit `.eq('org_id', tokenOrg)`.
5. Never accept `org_id` from request bodies or query strings.
6. After any schema/policy change run `npm run test:isolation` and paste the output into `ARCHITECTURE.md`.

## Do
- Add an isolation assertion for every new table/bucket.
- Prefer 404 over 403 for foreign ids.

## Don't
- Don't rely on "the UI hides it". Don't use guessable paths (no sequential ids in keys).
- Don't import the admin client in client components or route handlers that serve users.
- Don't loosen a policy to make a test pass; fix the test setup instead.

## Done when
All I1–I10 pass; `relrowsecurity` and `relforcerowsecurity` are true for every table.
