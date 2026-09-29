# ARCHITECTURE — Pack Manager

**Placement:** Project Root (required submission artifact)
> Agent instructions: keep diagrams and structure; replace `‹FILL›` (test outputs, numbers) in Phase 5. Do not leave any `‹FILL›` in the submitted file.

## 1. System diagram

```
Phone browser (Next.js 16.3.6, React 19.3.0)
  │  login (Supabase Auth)            │ capture 1–3 photos → downscale → SHA-256
  ▼                                    ▼
Next.js Route Handlers (Vercel) ──▶ Supabase Storage (private 'captures', key org_id/unit_id/capture_uuid/uuid.jpg)
  │                                    ▲ signed URLs 60 s
  │ 1. persist capture (BEFORE model)  │
  │ 2. build one prompt                │
  ▼                                    │
VisionProvider (Gemini) ── one call ──▶ observation JSON (validated with Zod)
  │
  ▼
Rules engine (pure TS) → checks[], discrepancies[], verdict, route
  │
  ▼
Supabase Postgres (RLS enabled + forced): captures · analyses · overrides · audit_log
  │
  ├─▶ Decision UI (verdict, trace, override)
  ├─▶ Evidence record page + JSON
  └─▶ /api/v1/evidence (bearer token → org) → Returns / Recovery pods
```

## 2. Data flow (one unit)
1. Operator opens an order; expected lines shown (from `order_lines` + `catalogue_items`).
2. Photos captured, downscaled to ≤ 1600 px, hashed in browser, uploaded to the org's folder in the private bucket; `captures` row inserted (attempt n).
3. `POST /api/units/{id}/analyze` (idempotency key): load order + catalogue snapshot, re-hash stored photos, build a single prompt, call the model once (temp 0, JSON schema, 20 s abort).
4. Validate output; run `evaluate()`; write `analyses` (observation, checks, verdict, trace, snapshot, content hash).
5. UI shows verdict; operator confirms or overrides. Override → `overrides` row with `prev_hash`/`row_hash`; `audit_log` entry.
6. Evidence record assembled on read from `captures` + latest `analyses` + `overrides`.

## 3. AI model usage
- Provider/model: Google Gemini (`gemini-2.5-flash`), default with fallback `gemini-3.5-flash`.
- Role: **observer only**. Returns presence/quantity/visibility/confidence per order line, unlisted items, photo assessment.
- One call per unit, all checks together. Temperature 0. No tools, no grounding.
- Prompt version `pack-audit.v1`; thresholds `T_PRESENT=0.70, T_COUNT=0.75, T_EXTRA=0.70, T_EXTRA_UNSURE=0.35` frozen in `eval/FROZEN.json`.
- Text inside photos is treated as data (prompt-injection guard).
- Cost/latency per unit: ~$0.00045 / 1.6 s median.

## 4. Decision logic (deterministic, `lib/agent/rules.ts`)
Photo gate → per-line presence and quantity → extra-item check → substitution (wrong item) detector → precedence:
1. any FAIL in a content check ⇒ **STOP_AND_FIX**
2. else any non-PASS (including photo quality) ⇒ **UNCERTAIN** (hold for retake/review)
3. else **SEAL**
UNCERTAIN is never converted to SEAL. Full tables and unit tests: `docs/AGENT_SPEC.md`, `tests/rules.test.ts`.

## 5. Failure handling (fail-open)
Capture is saved before any model call. Timeout, provider error, rate limit, invalid JSON, hash mismatch ⇒ `analyses.status=pending`, `error_code` set, UI offers retry or "seal by hand (unverified)", which records an override with reason `model_unavailable`. Nothing blocks the operator.

## 6. Evidence trace
Each record answers: what should be in the box → what was found → which checks ran → which verdict → why.
Stored: photos (key + SHA-256), timestamps, operator, order snapshot, observation, every check with reason, verdict + route, model + prompt version + thresholds, latency/tokens, overrides (original → new → reason → who → when), content hash, override hash chain.
**Honesty note:** this is a SHA-256 content hash and a hash chain that makes edits *detectable by us*. It is not tamper-proof, immutable, or externally anchored; a database admin or the service role can alter rows.

## 7. Tenancy and security
RLS enabled **and forced** on `orgs, profiles, catalogue_items, orders, order_lines, captures, analyses, overrides, audit_log`. Evidence tables have select+insert policies only. Storage policy restricts objects to the caller's `org_id/` folder; access via 60 s signed URLs; keys contain random UUIDs. Org is derived from the session, never from the request.
Isolation test (`npm run test:isolation`): Verified assertions I1–I10 (row isolation, storage isolation, and forced RLS).

## 8. Cross-pod contract
`pack_evidence.v1` JSON, `GET /api/v1/evidence[/{unit_id}]`, photo redirect, CSV export mirroring `pack_sample.csv`. Token→org mapping in env. Official organiser contract: not publicly available at build time; adapter slot `lib/evidence/adapters/official.ts`.

## 9. Evaluation
Method, dataset, labelers, kappa, metrics, failure modes: `docs/EVAL_REPORT.md`. Headline: False-SEAL 0.0% (95% CI [0.0% – 12.9%]), False-STOP 0.0%, UNCERTAIN rate 12.0%, Coverage 88.0%, κ = 0.895, Kill condition NOT TRIPPED.

## 10. Trade-offs and what we did not build
No per-SKU training; no barcode/OCR pipeline; no weight sensor; no queue/worker; no real marketplace integration; light theme only; single-region database.
