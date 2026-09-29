# Pack Manager — pre-seal package audit from one phone photo

CUBE Buildathon 2026 · Track 03 · Round 2 (individual) · by Shyam (`Shyamyemuka`)

**Placement:** Project Root (replaces the upstream README; keep the upstream problem statement link below).
> Agent instructions: sections marked `‹FILL›` are completed in Phase 5 from `eval/results/latest.json` and `docs/EVAL_REPORT.md`. Do not leave any `‹FILL›` in the submitted README. Every number must trace to a file in `eval/results/`.

**Live app:** ‹FILL: Vercel URL› · **Demo video:** ‹FILL› · **Problem statement:** https://github.com/Cube-Build-A-Thon/cube-03-pack-manager

## What it does
A packer photographs the open box. Pack Manager compares what is visible to the order lines and returns **SEAL**, **STOP AND FIX**, or **UNCERTAIN**, with a per-check PASS / FAIL / UNCERTAIN trace, a human override that keeps the original verdict, and an evidence record another system can read.

## The customer (hypothetical, not interviewed)
Small merchant-fulfilled sellers and 3PLs packing outbound orders with no fixed station and no scanner budget. Not FBA (Amazon packs those). Not large DCs, where funded vendors already sell pack verification. Details and kill condition: `docs/CUSTOMER_AND_KILL_CONDITION.md`.

## How it works (one paragraph)
One batched vision-model call per unit reports observations (what is present, how many, what is unlisted, how good the photo is) with confidences. A deterministic rules engine (`lib/agent/rules.ts`) converts those observations into per-check results and a verdict. The model never decides. If evidence is missing or the photo is poor, the result is UNCERTAIN, never a low-confidence pass. If the model fails, the capture is still saved as `pending` and the operator is never blocked. See `ARCHITECTURE.md`.

## Results (held-out, 50 units, staged household items)
Measured on 50 staged units with two independent human labelers (Cohen's κ = 0.895). See `docs/EVAL_REPORT.md`.

| Metric | Value | Method |
|--------|-------|--------|
| False-SEAL rate (defective boxes sealed) | 0.0% (95% CI [0.0% – 12.9%]) | Defective boxes sealed / total defective boxes (n=26) |
| False-STOP rate | 0.0% | Good boxes stopped / total good boxes (n=18) |
| UNCERTAIN rate / coverage | 12.0% / 88.0% | Held for recapture or review (n=6) |
| Labeler agreement (Cohen's κ) | 0.895 (raw 94.0%) | Two independent labelers on 50 units |
| Latency p50 / p95 | 1.6 s / 2.0 s | Capture to verdict |
| Cost per box | $0.00045 | Exactly one vision call per unit |

Kill condition: NOT TRIPPED (False-SEAL on missing/wrong 0.0% < 25%, UNCERTAIN 12.0% < 50%). Full failure-mode breakdown: `docs/EVAL_REPORT.md`.

## Run it
```bash
git clone https://github.com/Shyamyemuka/cube26-pck-0105-shyamyemuka && cd cube26-pck-0105-shyamyemuka
cp .env.example .env.local        # fill Supabase + Gemini values
npm ci
# apply supabase/migrations/0001_init.sql in the Supabase SQL editor, then:
npx tsx scripts/seed.ts
npm run dev                        # http://localhost:3000
npm test && npm run test:isolation
```
Headless: `npm run agent -- --unit U1 --photos a.jpg,b.jpg --order "SKU-A:1;SKU-B:2"`
Eval: `npm run eval -- --set dev` (tuning) · `npm run eval -- --set heldout` (final, run once)
Dry-run on the organiser CSV (rules engine only, no images): `npx tsx scripts/csv-dryrun.ts`

Demo accounts: ‹FILL: provide via the submission form, not in this repo›.

## Test inputs
`demo-data/demo_catalogue.json`, `demo-data/demo_orders.csv`, and staged fixtures listed in `eval/units.json`. Paste an order as `SKU:qty;SKU:qty`.

## Requirements checklist
Operational understanding ✓ · Multi-modal ingestion (photos, order files, SKU catalogue, evidence records) ✓ · Traceable JSON decisions ✓ · PASS/FAIL/UNCERTAIN ✓ · Human override with preserved audit ✓ · Tech-stack freedom (Next.js, Supabase, Gemini) ✓
Engineering rules: tenancy isolation (RLS enabled + forced, tested) · one model call per unit · fail-open · UNCERTAIN first-class · rules looked up, not recalled (pack verification needs only the seller's order lines; no marketplace rule lookup is implemented).

## Evidence and cross-pod interface
`GET /api/v1/evidence/{unit_id}` returns a `pack_evidence.v1` record (see `docs/EVIDENCE_CONTRACT.md`). CSV export mirrors the organiser's `pack_sample.csv` columns plus extras. The official contract was not publicly available at build time; an adapter slot exists.

## Limitations (honest)
Staged household items and one phone; n=50; two labelers who know each other; stacked or occluded items are hard and mostly route to UNCERTAIN; look-alike products can be confused; no real customer interviews; the record has a content hash and hash chain but is **not** tamper-proof; the dummy CSV is synthetic and used only for schema and rules-engine tests; FBA is out of scope; requires network for the model call (fail-open otherwise).

## Repo map
`docs/` specs and reports · `lib/agent/` model + rules · `lib/evidence/` records + hashing · `scripts/` seed, dry-run, isolation test · `eval/` labels and results · `supabase/migrations/` schema
