# CLAUDE.md — Pack Manager (CUBE Buildathon 2026, Track 03)

**Placement:** Project Root · read this first, every session.

## What we are building
A phone-first web app: photo of an OPEN box + order lines → one batched vision call → deterministic rules engine → **SEAL / STOP_AND_FIX / UNCERTAIN**, per-check PASS/FAIL/UNCERTAIN trace, human override, evidence record, cross-pod API. Merchant-fulfilled / 3PL only (never FBA).
Deadline: **1 Oct 2026 18:00 IST**, one-shot submission. Owner: Shyam. You implement; the owner supplies keys, photos, labelers, video, LinkedIn.

## Read order
`docs/PRD.md` → `docs/AGENT_SPEC.md` → `docs/DATA_MODEL.md` → `docs/APP_FLOW.md` → `docs/EVIDENCE_CONTRACT.md` → `docs/IMPLEMENTATION_PLAN.md` (follow its phases and gates) → `docs/EVAL_PLAN.md`, `docs/TEST_PLAN.md`, `docs/SECURITY.md`, `docs/UX_SPEC.md`. Skills live in `skills/*/SKILL.md`; rules in `.claude/rules/`.

## Stack (exact, pinned)
Next.js **16.3.6** (16.3.7 after 30 Sep if released; re-test), React **19.3.0**, `@supabase/supabase-js` **2.117.2**, `@supabase/ssr` **0.12.7**, Node 24 LTS (min 22), TypeScript, Tailwind, Zod, Vitest, `@google/genai`. Resolve the remaining versions with `npm view` and record them in `docs/TECH_STACK.md` §7. No `latest` ranges.

## Hard rules (violating any is a bug)
1. **The model observes; code decides.** The VLM never returns a verdict. `lib/agent/rules.ts` is a pure function and the only place verdicts are computed.
2. **One model call per unit**, carrying all checks. No per-check calls, no "verify" second call.
3. **UNCERTAIN is a first-class verdict.** Never convert it to SEAL. If evidence is missing, say UNCERTAIN.
4. **Fail open.** Persist the capture BEFORE calling the model. Any model error/timeout/invalid output → record with `status=pending`; the operator can retry or seal by hand (recorded as override `model_unavailable`). Nothing blocks the line.
5. **Tenancy isolation before features.** `org_id` on every table; RLS **enabled and forced**; storage keys start with `org_id/`; signed URLs 60 s; never take `org_id` from the client; the isolation test (`npm run test:isolation`) must stay green.
6. **Overrides are data.** Insert-only; keep original verdict, new verdict, reason, who, when. Never delete or update evidence rows.
7. **Look authoritative rules up.** Do not let the model recall channel/marketplace rules; do not infer rules from the dummy CSV (it is synthetic).
8. **No secrets in git.** Only `.env.example`. Service-role key is server-only and used only in `scripts/*`, eval, and the evidence-API token check.
9. **Original work.** Do not copy other participants' repos.
10. **Do not tune on the held-out set.** Prompt/threshold changes only against `eval/fixtures/dev/`. Freeze before the held-out run.

## Language you are NOT allowed to use (code comments, UI, docs, README)
"tamper-proof", "immutable", "blockchain", "cryptographically guaranteed", "audit-proof", "100% accurate", "guaranteed", "AI-powered magic". Say **content hash** and **hash chain (edits detectable by us)**. Say **measured** only with a number and a method beside it.

## Where things live
```
app/            routes (see docs/APP_FLOW.md)      lib/agent/     provider, prompt, schema, rules, pipeline
lib/evidence/   canonical JSON, hashing, record    lib/ingest/    catalogue + order parsing
lib/supabase/   server/client/admin                scripts/       seed, csv-dryrun, agent-cli, isolation-test
eval/           units, labels, fixtures, results   supabase/migrations/0001_init.sql
tests/          vitest                             demo-data/     our demo catalogue/orders (do not edit upstream data/)
docs/           specs and reports                  skills/  .claude/
```
Upstream read-only: `RULES.md`, `GITHUB-GUIDE.md`, `data/`.

## Commands
`npm run dev` · `npm run build` · `npm test` · `npm run lint` · `npm run test:isolation` · `npm run agent -- --unit U --photos a.jpg,b.jpg --order "A:1;B:2"` · `npm run eval -- --set dev|heldout` · `npx tsx scripts/csv-dryrun.ts` · `npx tsx scripts/seed.ts`

## Working agreements
- Follow `IMPLEMENTATION_PLAN.md` phase gates; do not skip forward. Apply the **cut line** without asking.
- Commit small, meaningful messages ("Add uncertainty handling"), never force-push.
- Append to `docs/BUILD_LOG.md` after each gate and every deviation. Do not edit final docs (PRD, AGENT_SPEC, etc.); log deviations instead.
- Ask the owner ONLY for: API keys, Supabase/Vercel setup, photo staging, labeler B, demo video, LinkedIn post, official evidence contract. Everything else: decide, log, continue.
- Every claim in README/EVAL_REPORT must trace to a file in `eval/results/` or a test output.
- Definition of done: `docs/IMPLEMENTATION_PLAN.md` §5.

## Style
TypeScript strict. Zod-validate every boundary. Pure functions for logic, thin route handlers. Names: `snake_case` in DB/JSON, `camelCase` in TS. No `any` without a comment. UI text from `docs/UX_SPEC.md` §4.
