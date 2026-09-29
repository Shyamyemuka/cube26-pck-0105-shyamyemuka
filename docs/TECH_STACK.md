# TECH_STACK — Pack Manager

**Placement:** Project /docs/TECH_STACK.md · **Status:** FINAL
Default stack per owner's standing rule: **latest stable Next.js + latest Supabase**. The hackathon allows free choice of stack (verified in brief: "Free choice of language, framework, LLM/VLM, databases, deployment"), so no override is needed.

## 1. Verified versions (looked up 28 Sep 2026)

| Layer | Choice | Exact version | Source / note |
|-------|--------|---------------|---------------|
| Framework | Next.js (App Router, Turbopack) | **16.3.6** | Latest stable at time of writing (out-of-band security release 22 Sep 2026). **Next.js 16.3.7 is scheduled for 30 Sep 2026** (9 security fixes). Before final deploy run `npm view next version`; if ≥ 16.3.7, upgrade and re-run tests. |
| UI runtime | React / React DOM | **19.3.0** | Matches Next 16.3.6 in current starters |
| DB / Auth / Storage | Supabase (hosted, free tier) | platform current | Postgres + RLS + Auth + Storage |
| Supabase client | `@supabase/supabase-js` | **2.117.2** | npm latest at time of writing. Requires Node ≥ 22 (Node 20 support dropped in 2.110.0) |
| Supabase SSR helper | `@supabase/ssr` | **0.12.7** | Cookie-based sessions for App Router |
| Runtime | Node.js | **24.x LTS** (minimum 22.x) | [likely] 24 is Active LTS; 22 works. Do not use 20 |

## 2. Versions to resolve at scaffold time (agent must pin exact)

I could not verify these in the research pass. The agent MUST run the command, then write the exact result into the table in §7 and pin with `--save-exact`. Do not use `latest` ranges in `package.json`.

| Package | Purpose | Resolve with |
|---------|---------|--------------|
| `typescript` | Types | `npm view typescript version` |
| `tailwindcss` (+ `@tailwindcss/postcss`) | Styling | `npm view tailwindcss version` |
| `zod` | Schema validation for VLM output + API | `npm view zod version` |
| `@google/genai` | Gemini SDK | `npm view @google/genai version` |
| `vitest` | Unit tests (rules engine, hashing) | `npm view vitest version` |
| `@playwright/test` | E2E smoke (optional) | `npm view @playwright/test version` |
| `tsx` | Run headless CLI/eval scripts | `npm view tsx version` |
| `csv-parse` | CSV ingestion | `npm view csv-parse version` |
| `sharp` | Server-side image checks (optional; skip if it slows install) | `npm view sharp version` |
| `eslint` + `eslint-config-next` | Lint | use versions `create-next-app` installs |

## 3. Vision model (pluggable, recorded in every record)

| Setting | Value |
|---------|-------|
| Provider | Google Gemini API (free tier available for several models; owner is a Google Student Ambassador) |
| Default model ID | `gemini-3.5-flash` [likely available — Google's models list shows it; IDs changed several times in 2026] |
| Fallback model ID | `gemini-2.5-flash` (present in every Google models listing checked) |
| How chosen | `VLM_MODEL` env var. **Day-2 bake-off:** run the 10 dev units on both, keep the better false-SEAL rate. |
| Interface | `VisionProvider` in `lib/agent/provider.ts` so another provider can be swapped without touching the rules engine |
| Output mode | Structured output (JSON schema) via SDK; validated again with Zod |
| Calls per unit | **Exactly one** (Engineering Rule 2) |
| Timeout | 20 s hard abort → fail-open PENDING |

If Gemini API access or quota fails on Day 1, fallback provider: Anthropic Claude vision via `@anthropic-ai/sdk` (resolve version at install). Model ID from env; do not hardcode.

## 4. Hosting

| Item | Choice |
|------|--------|
| App | Vercel (free/hobby) — public URL for demo and phone test on cellular |
| DB/Storage | Supabase free project (region: closest to India, e.g. Mumbai/Singapore) |
| CI | GitHub Actions: `lint`, `typecheck`, `test` on push (optional, 15 min to set up) |

## 5. Architecture-level decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Server logic | Next.js Route Handlers (no separate backend) | One deploy, fewer moving parts in 3 days |
| Decision logic | Deterministic TypeScript rules engine, **not** the LLM | Testable, explainable, UNCERTAIN is enforced by code |
| Auth | Supabase Auth email/password, one org per user | Fast, RLS-friendly |
| Tenancy | `org_id` on every table + `current_org_id()` SQL function + **ENABLE and FORCE RLS** | Engineering Rule 1 |
| Images | Private Storage bucket; keys `{org_id}/{unit_id}/{capture_id}/{uuid}.jpg`; storage RLS by org folder; signed URLs 60 s | Prevents guessable-path leak |
| Hashing | SHA-256 of each image + SHA-256 of canonical JSON of the record | "Content hash" claim only |
| Language for UI | English | — |

## 6. Environment variables (all in `.env.example`, never committed with values)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=      # publishable/anon key, safe in browser
SUPABASE_SERVICE_ROLE_KEY=                 # server only; used ONLY by seed/eval/evidence-API token check
GEMINI_API_KEY=                            # server only
VLM_PROVIDER=gemini
VLM_MODEL=gemini-3.5-flash
VLM_TIMEOUT_MS=20000
EVIDENCE_API_TOKENS=                       # token:org_id pairs, comma-separated (see EVIDENCE_CONTRACT.md §3)
PROMPT_VERSION=pack-audit.v1
```

## 7. Resolved versions log (agent fills at scaffold, then freezes)

| Package | Exact version | Date resolved |
|---------|---------------|---------------|
| next | 16.3.6 (or 16.3.7 if released and tested) | |
| react / react-dom | 19.3.0 | |
| @supabase/supabase-js | 2.117.2 | |
| @supabase/ssr | 0.12.7 | |
| typescript | | |
| tailwindcss | | |
| zod | | |
| @google/genai | | |
| vitest | | |
| tsx | | |
| csv-parse | | |

## 8. Explicit non-choices
No ORM (use `supabase-js` + SQL migrations), no state library (React state + server actions), no queue/worker (fail-open + client-triggered retry is enough), no Docker requirement for the reviewer.
