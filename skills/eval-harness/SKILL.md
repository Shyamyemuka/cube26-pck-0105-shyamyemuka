---
name: eval-harness
description: Use when building or running the evaluation harness, label files, metrics (kappa, FP/FN, UNCERTAIN rate, false-SEAL), or writing docs/EVAL_REPORT.md for Pack Manager.
---

# eval-harness

**Placement:** Project /skills/eval-harness/SKILL.md

## Purpose
Produce honest, reproducible numbers on 50 unseen units labelled by two humans. Rubric weight: 25 of 100.

## Source of truth
`docs/EVAL_PLAN.md` (all of it), `docs/PRD.md` §8–§9.

## Procedure
1. Files: `eval/units.json`, `eval/labels/labeler_a.csv`, `eval/labels/labeler_b.csv`, `eval/labels/adjudication.csv`, `eval/fixtures/{dev,heldout}/`, `eval/results/`.
2. `eval/metrics.ts` pure functions: `cohenKappa`, `confusion`, `perCheckCounts`, `wilsonInterval`, `latencyPercentiles`. Unit-test on tiny synthetic inputs (`tests/metrics.test.ts`).
3. Agreement first: compute kappa and % agreement between labelers; refuse to run the held-out eval if the label files are missing or verdict kappa < 0.7 without an adjudication note.
4. `npm run eval -- --set heldout` runs the production pipeline headlessly, sequentially, with backoff. Failed units are counted as `pending`, never dropped or silently rerun.
5. Freeze check: the run reads `PROMPT_VERSION` and thresholds; abort if they differ from `eval/FROZEN.json` (written and committed before the held-out run).
6. Output `eval/results/<timestamp>.json` and copy to `latest.json`. Then generate `docs/EVAL_REPORT.md` from the template in `EVAL_PLAN.md` §8.
7. Report per check TP/FP/FN/TN with **FP and FN separate**, UNCERTAIN rate, coverage, false-SEAL with Wilson 95% CI, latency p50/p95, cost per unit, failure-mode table, kill-condition verdict.

## Do
- Report both "decided-only" and "strict (UNCERTAIN = not sealed)" views, labelled.
- Include the naive always-SEAL baseline.
- State limitations plainly (n=50, staged items, one phone, two labelers).

## Don't
- Don't tune on held-out units. Don't hide failures. Don't report a single blended accuracy.
- Don't use the dummy CSV as vision ground truth.

## Done when
`docs/EVAL_REPORT.md` exists with every section filled from `latest.json`, and README results table matches it exactly.
