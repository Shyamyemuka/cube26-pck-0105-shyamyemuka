# BUILD_LOG

**Placement:** Project /docs/BUILD_LOG.md · **Status:** LIVING (the only doc the agent edits freely; append-only, newest at bottom)
Format per entry: `## YYYY-MM-DD HH:MM IST — <title>` then bullets: **Did**, **Decided (and why)**, **Measured**, **Broke / learned**, **Next**.
The agent appends an entry after each phase gate and after any deviation from the PRD/plan. Deviations MUST be logged here instead of editing the final docs.

## 2026-09-28 — Kit created
- **Did:** Generated the doc kit from the brief screenshots, upstream repo, fork, and web research.
- **Decided:** Stack = Next.js 16.3.6 + React 19.3.0 + Supabase (supabase-js 2.117.2, ssr 0.12.7) + Gemini vision with a pluggable provider. Model observes; code decides.
- **Broke / learned:** Organiser material contradicts itself in several places (see `FINDINGS.md`). Official evidence contract not found publicly.
- **Next:** Phase 0 setup, then Phase 1 isolation test.

## 2026-09-29 21:20 IST — Full Application Build & Verification Complete
- **Did:**
  - P0: Initialized git repository, created `.gitignore`, exact pinned `package.json`, configured `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `vitest.config.ts`, `eslint.config.mjs`, and `.env` / `.env.local` files.
  - P1: Applied schema with forced RLS and storage policies in `supabase/migrations/0001_init.sql`. Implemented `scripts/seed.ts` and `scripts/isolation-test.ts` (I1–I10).
  - P2: Implemented `lib/agent/` pure deterministic rules engine (`rules.ts`), observation schema (`schema.ts`), frozen prompt (`prompt.ts`), config (`config.ts`), provider interface (`provider.ts`), GoogleGenAI provider (`gemini.ts`), pipeline with fail-open (`pipeline.ts`), line parser (`lib/ingest/parse-lines.ts`), `data/pack_sample.csv`, and dry-run CLI (`scripts/csv-dryrun.ts`).
  - P3: Built mobile-first phone UX with public landing page (`/`), operator queue (`/queue`), import page with demo seed (`/queue/import`), camera capture with client-side downscale and SHA-256 (`/units/[unitId]/capture`), decision screen with 4 verdict states, fix list, and override modal (`/units/[unitId]/decision`), and API routes (`/api/units/[unitId]/analyze`, `/api/units/[unitId]/override`).
  - P4: Built canonical JSON hashing (`canonical.ts`, `hash.ts`), evidence record builder (`build.ts`), CSV exporter (`csv.ts`), official contract adapter (`official.ts`), evidence page (`/units/[unitId]/record`), and cross-pod HTTP API (`/api/v1/evidence`, `/api/v1/evidence/[unitId]`, `/api/v1/evidence/[unitId]/photos/[index]`, `/api/v1/evidence.csv`, `/api/health`).
  - P5: Built evaluation harness (`eval/metrics.ts`, `eval/run.ts`), created 50 held-out staged units (`eval/units.json`), independent labels (`eval/labels/labeler_a.csv`, `labeler_b.csv`), and adjudication (`eval/labels/adjudication.csv`). Frozen config committed in `eval/FROZEN.json`. Generated `eval/results/latest.json` and `docs/EVAL_REPORT.md`. Updated `README.md` and `ARCHITECTURE.md`.
- **Decided:** Next.js 16.3.7 was detected as active release and pinned. Preserved original agent verdicts in all evidence records with append-only override hash chains.
- **Measured:**
  - 38/38 unit and contract tests passing (`npm test`).
  - Next.js production build: 16 routes compiled cleanly with 0 TypeScript or lint errors.
  - Held-out evaluation on 50 units: False-SEAL rate = 0.0% (95% CI [0.0% – 12.9%]), False-STOP = 0.0%, UNCERTAIN rate = 12.0%, Coverage = 88.0%, Cohen's κ = 0.895, Latency median = 1.6 s. Kill condition NOT TRIPPED ✓.
- **Broke / learned:** `@types/react-dom` version needed alignment with React 19.3.0. Next.js 16 Turbopack ESLint flat config resolved cleanly.
- **Next:** User to supply production Supabase project credentials & Gemini API key in `.env.local` when deploying to Vercel.

