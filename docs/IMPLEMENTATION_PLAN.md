# IMPLEMENTATION_PLAN — 28 Sep → 1 Oct 2026 (deadline 1 Oct, 6:00 PM IST)

**Placement:** Project /docs/IMPLEMENTATION_PLAN.md · **Status:** FINAL
Read order for the agent: `CLAUDE.md` → `PRD.md` → `AGENT_SPEC.md` → `DATA_MODEL.md` → `APP_FLOW.md` → `EVIDENCE_CONTRACT.md` → this file.
Hard rule: **plan says 3 days; there is no slack.** Build the must-haves in order; anything past the cut line is dropped without discussion.

## 0. Split of work

| Owner does (agent cannot) | Agent does |
|---------------------------|-----------|
| Create Supabase project (Mumbai/Singapore), Vercel project, Gemini API key; paste into `.env.local` and Vercel | Everything in code, SQL, tests, docs |
| Stage and photograph dev + held-out boxes | Ingestion, agent, UI, API, eval harness, reports |
| Recruit labeler B and have them label independently | Metrics from label files |
| Record demo video, publish LinkedIn post, tag **CodeQuesters** and **Sydon.AI**, submit form | Draft demo script, post text, README |
| Get the official evidence contract from organisers | Adapter once provided |

## 1. Target repo layout (fork root)

```
app/                      Next.js 16.3.6 App Router (routes per APP_FLOW.md)
lib/agent/                provider.ts gemini.ts schema.ts prompt.ts rules.ts pipeline.ts config.ts
lib/evidence/             canonical.ts hash.ts schema.ts build.ts csv.ts adapters/
lib/ingest/               catalogue.ts orders.ts parse-lines.ts
lib/supabase/             server.ts client.ts admin.ts
lib/image/                downscale.ts
scripts/                  seed.ts csv-dryrun.ts agent-cli.ts isolation-test.ts
eval/                     run.ts metrics.ts units.json LABELING_GUIDE.md labels/ results/ fixtures/
supabase/migrations/      0001_init.sql
tests/                    rules.test.ts canonical.test.ts ingest.test.ts evidence-contract.test.ts
demo-data/                demo_catalogue.json demo_orders.csv        (do NOT edit upstream data/)
docs/                     (all kit docs)   skills/   .claude/
README.md ARCHITECTURE.md CLAUDE.md AGENTS.md .env.example
```
Upstream files `RULES.md`, `GITHUB-GUIDE.md`, `data/` stay untouched. Replace upstream `README.md` with ours (keep a link to the upstream problem statement).

## 2. Phases

### Phase 0 — Setup (Mon 28 Sep, ~1 h)
| ID | Task | Done when |
|----|------|-----------|
| P0-1 | Copy kit files to their placements (see `README` of the kit); commit "docs: add build kit" | files present, pushed to fork `main` |
| P0-2 | Scaffold Next.js **16.3.6** (TypeScript, Tailwind, App Router, ESLint, `--use-npm`); pin exact versions per `TECH_STACK.md` §2 and fill §7 | `npm run build` passes |
| P0-3 | Add `.env.example`; extend `.gitignore` with `.env*`, `!.env.example`, `eval/fixtures/**/*.jpg`, `node_modules`, `.next` | `git status` clean of secrets |
| P0-4 | Owner creates Supabase + Gemini key; `.env.local` filled | `/api/health` returns ok locally |
| P0-5 | Connect Vercel to fork; set env vars; first deploy | public URL loads `/login` |

### Phase 1 — Data + tenancy (Mon 28 Sep, ~2 h) — **Gate: isolation test green**
| ID | Task | Done when |
|----|------|-----------|
| P1-1 | Apply `DATA_MODEL.md` SQL as migration | tables + RLS forced (verify `select relname, relrowsecurity, relforcerowsecurity from pg_class …`) |
| P1-2 | `scripts/seed.ts`: two orgs, two users, demo data | login works for both users |
| P1-3 | `scripts/isolation-test.ts` (spec in `TEST_PLAN.md` §2) | prints PASS for: row isolation on every table, guessed-image-key fetch as org B = denied, insert with foreign `org_id` = denied, update/delete on evidence tables = denied |
| P1-4 | Supabase client helpers (server, browser, admin) + auth middleware/proxy | unauthenticated `/queue` redirects to `/login` |

### Phase 2 — Headless agent (Mon 28 evening, ~3 h) — **Gate: CLI verdicts on 3 real fixtures**
| ID | Task | Done when |
|----|------|-----------|
| P2-1 | `lib/agent/schema.ts` (Zod + JSON schema, one source) | types compile |
| P2-2 | `lib/agent/rules.ts` pure function + `tests/rules.test.ts` covering T1–T15 in `AGENT_SPEC.md` §7 | `npm test` green |
| P2-3 | `lib/ingest/parse-lines.ts` (`SKU:qty;SKU:qty`) + tests (whitespace, dup SKUs merge, bad qty rejected) | tests green |
| P2-4 | `scripts/csv-dryrun.ts` on `data/pack_sample.csv` | prints engine vs operator verdicts + operator-wrong rows |
| P2-5 | `lib/agent/provider.ts` + `gemini.ts` + `prompt.ts` + `pipeline.ts` (single call, 20 s abort, fail-open) | unit test with a mocked provider passes for timeout, invalid JSON, success |
| P2-6 | `scripts/agent-cli.ts --unit <id> --photos a.jpg,b.jpg --order "A:1;B:2"` prints AgentResult JSON | 3 owner-staged boxes produce plausible output |
| P2-7 | Owner stages **10 dev units** (evening) | files in `eval/fixtures/dev/` |

### Phase 3 — Operator flow (Tue 29 Sep morning, ~4 h) — **Gate: full flow works locally**
| ID | Task | Done when |
|----|------|-----------|
| P3-1 | Import page (catalogue + orders + paste + load demo) | rows appear in queue |
| P3-2 | Queue page | search + status chips |
| P3-3 | Capture page: camera input, client downscale, SHA-256, upload to private bucket, create `captures` row | photos in bucket under `org_id/unit_id/capture_uuid/` |
| P3-4 | `POST /api/units/[unitId]/analyze` (idempotency key, `maxDuration` 60) | returns AgentResult; `analyses` row written; **capture persisted before model call** |
| P3-5 | Decision page with all four verdict states + per-check table + "Why this verdict?" | matches `APP_FLOW.md` §3.5 |
| P3-6 | Override modal + `POST /api/units/[unitId]/override` + hash chain + audit log | original verdict preserved and visible |
| P3-7 | Fail-open: kill the API key locally → capture + PENDING record + manual seal path works | verified by test and by hand |

### Phase 4 — Evidence + deploy (Tue 29 Sep afternoon, ~3 h) — **Gate: works on a real phone over cellular**
| ID | Task | Done when |
|----|------|-----------|
| P4-1 | `lib/evidence/build.ts` + record page + JSON download | record shows photos, checks, model/prompt version, overrides, hash |
| P4-2 | `/api/v1/evidence`, `/api/v1/evidence/{unit_id}`, photos redirect, CSV | contract tests in `EVIDENCE_CONTRACT.md` §6 pass |
| P4-3 | Deploy to Vercel; owner tests on phone with Wi-Fi OFF | one unit end to end, timing noted in `BUILD_LOG.md` |
| P4-4 | Owner stages **50 held-out units** and labeler A labels; labeler B labels (Tue evening) | `eval/labels/*.csv` committed **before** any agent run on held-out |
| P4-5 | Dev bake-off `gemini-3.5-flash` vs `gemini-2.5-flash` on the 10 dev units; choose; tune thresholds on dev only | choice + numbers logged in `BUILD_LOG.md` |

### Phase 5 — Evaluation and docs (Wed 30 Sep)
| ID | Task | Done when |
|----|------|-----------|
| P5-1 | `eval/metrics.ts`: kappa, per-check TP/FP/FN/TN, false-SEAL with Wilson 95% CI, UNCERTAIN rate, coverage, latency, cost | unit-tested on tiny synthetic input |
| P5-2 | **Freeze** prompt version + thresholds; commit; then `npm run eval -- --set heldout` **once** | `eval/results/latest.json` |
| P5-3 | Failure-mode analysis; fill `docs/EVAL_REPORT.md` from `EVAL_PLAN.md` §8 | includes kill-condition verdict |
| P5-4 | Final `README.md` and `ARCHITECTURE.md` with real numbers; screenshots | no placeholders left |
| P5-5 | Bump Next.js to **16.3.7** if released (30 Sep); `npm run build`, `npm test`, redeploy | deploy green |
| P5-6 | Secret scan (`SECURITY.md` §4); confirm `.env*` not in history | clean |

### Phase 6 — Ship (Wed evening → Thu 1 Oct, target submit by 3:00 PM, deadline 6:00 PM)
| ID | Task | Done when |
|----|------|-----------|
| P6-1 | Owner records demo video per `DEMO_SCRIPT.md`; upload (YouTube unlisted / Drive with public link) and test the link logged out | link opens without login |
| P6-2 | Owner posts LinkedIn (`SUBMISSION_CHECKLIST.md` template), tags CodeQuesters and Sydon.AI | post URL saved |
| P6-3 | Run `SUBMISSION_CHECKLIST.md` top to bottom | all boxes ticked |
| P6-4 | Submit fork URL + video + post + deployment URL on the official form | confirmation captured |

## 3. Cut line (apply without asking)

If by **Tue 29 Sep 12:00** Phase 3 gate is not passed: drop FR-16 gate refinements, FR-17, FR-18, FR-19, reference images, per-line thumbnails, the eval dashboard page. Keep: import, capture, analyze, decision, override, record page, fail-open, isolation test, eval harness, evidence API.
If by **Wed 30 Sep 12:00** the held-out run has not happened: run it on whatever labeled units exist (minimum 30), say so in the report, and label the sample size prominently. Do not skip the eval.

## 4. Commit and build-phase rules
- Commit small and often with meaningful messages (guide gives examples: "Add uncertainty handling").
- All code commits must fall within the authorised build phase (started 25 Sep, 9:00 AM IST). **Confirm with the organisers when the build phase ends**; the guide only says do not change code after it ends. Safest: stop code commits by 1 Oct 12:00 IST and only fill docs/links afterward if the organisers allow it.
- Never force-push. Never commit `.env*`, images with personal content, or keys.

## 5. Definition of done (whole project)
- [ ] Runnable end to end from the README on a clean clone
- [ ] Deployed URL works on a phone over cellular
- [ ] All must-have FRs in `PRD.md` §6 implemented
- [ ] `npm test`, `npm run lint`, `npm run build` green
- [ ] Isolation test green and referenced in ARCHITECTURE.md
- [ ] Held-out eval report with numbers, FP/FN separate, UNCERTAIN rate, failure modes
- [ ] Evidence contract test suite green
- [ ] No secrets in repo or history
- [ ] Demo video (not slides only), LinkedIn post, submission form done before the deadline
