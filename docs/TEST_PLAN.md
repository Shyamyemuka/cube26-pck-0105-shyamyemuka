# TEST_PLAN

**Placement:** Project /docs/TEST_PLAN.md · **Status:** FINAL
Tools: Vitest (unit), `tsx` scripts (isolation, dry-run), manual phone checklist. Playwright optional.

## 1. Test layers

| Layer | Files | Runs |
|-------|-------|------|
| Unit | `tests/rules.test.ts` (T1–T15), `canonical.test.ts`, `ingest.test.ts`, `metrics.test.ts` | `npm test` |
| Contract | `tests/evidence-contract.test.ts` | `npm test` |
| Isolation (integration, hits Supabase) | `scripts/isolation-test.ts` | `npm run test:isolation` |
| Fail-open | `tests/pipeline.failopen.test.ts` (mock provider) + manual | `npm test` |
| Manual device | checklist §4 | before deploy sign-off |

## 2. Isolation test spec (Engineering Rule 1) — `scripts/isolation-test.ts`

Setup: as **org alpha user** create a catalogue item, order, capture (with a real uploaded tiny JPEG), analysis, override. Record the storage object key.
Then, signed in as **org bravo user** (anon key + user session, NOT service role), assert each:

| # | Assertion | Expected |
|---|-----------|----------|
| I1 | `select` on each of `catalogue_items, orders, order_lines, captures, analyses, overrides, audit_log` | 0 rows |
| I2 | `select` on `orgs` and `profiles` | only own org / own profile |
| I3 | Download alpha's image by exact key from bucket `captures` | error / not found |
| I4 | Create a signed URL for alpha's key | error |
| I5 | List bucket path `org_demo_alpha/` | empty |
| I6 | Insert an `orders` row with `org_id='org_demo_alpha'` | rejected by RLS |
| I7 | Upload to storage key prefixed `org_demo_alpha/` | rejected |
| I8 | `update`/`delete` on `analyses`, `overrides`, `captures`, `audit_log` (as alpha, own org) | 0 rows affected / rejected |
| I9 | Evidence API: bravo token requests alpha `unit_id` and alpha photo | 404 |
| I10 | Query `pg_class`: `relrowsecurity` and `relforcerowsecurity` both true for all 9 tables | true |
Exit code non-zero on any failure. Paste the passing output into `ARCHITECTURE.md`.
Reminder from the brief: row isolation with a shared, guessable image path "looks green" while leaking — I3–I5 are the ones that matter.

## 3. Pipeline tests (mock `VisionProvider`)
- success → decided + record + hash stable across two builds of the same input
- provider throws / times out (use fake timers) → capture row exists, analysis `status=pending`, `error_code=timeout`
- provider returns garbage → `invalid_output`, pending
- provider returns a schema-valid observation that says everything is fine but `photo_assessment.usable=false` → UNCERTAIN
- second call with same idempotency key returns the first result and does **not** call the provider again
- exactly **one** provider call per analyze request (spy count)

## 4. Manual device checklist (real phone, cellular, Wi-Fi OFF)
- [ ] Login, queue loads < 3 s
- [ ] Camera opens from Capture; rear camera preferred
- [ ] 2 photos upload; downscaled size shown (< ~500 KB each)
- [ ] Verdict returns; latency noted (write p50/p95 in BUILD_LOG)
- [ ] Airplane mode mid-upload → clear message, retry works
- [ ] PENDING path: revoke the key in Vercel env → manual seal path works, record shows override reason `model_unavailable`
- [ ] Override flow completes; record page shows original + override
- [ ] Verdict readable in sunlight (contrast) and not colour-only
- [ ] Record page download JSON opens

## 5. Acceptance mapping (rubric → evidence)

| Rubric area | Proof artifact |
|-------------|---------------|
| Problem understanding (15) | `docs/CUSTOMER_AND_KILL_CONDITION.md`, README §Customer |
| Agent functionality (25) | CLI output, decision screen, `tests/rules.test.ts` |
| Evaluation & uncertainty (25) | `docs/EVAL_REPORT.md`, `eval/results/latest.json`, kappa |
| Evidence & engineering (20) | record page, isolation test output, fail-open test, hash chain |
| UX, demo, docs (15) | video, README, ARCHITECTURE.md |
