# EVAL_PLAN — 50 unseen units, two labelers, honest numbers

**Placement:** Project /docs/EVAL_PLAN.md · **Status:** FINAL
Rubric weight: **Evaluation, Accuracy & Uncertainty Handling = 25 of 100.** The brief says an honest 61% you can break down beats a 95% you cannot.

## 1. Why we stage our own data
The repo ships **no images**. The CSV is synthetic and explicitly "not ground truth". Fixtures and eval set are ours to capture.

## 2. Datasets

| Set | Units | Purpose | Rule |
|-----|-------|---------|------|
| `dev` | 10 | Prompt/threshold tuning, model bake-off | May be looked at freely |
| `eval` (held-out) | 50 | Final measurement | **Never viewed by the agent developer's prompt-tuning loop.** Run once after freezing prompt + thresholds. If re-run after a fix, report both runs and say what changed |

Photograph dev and eval boxes in separate batches on separate sessions; keep folders `eval/fixtures/dev/` and `eval/fixtures/heldout/` (images are git-ignored if large; commit a manifest of SHA-256 + small thumbnails or a public link). Do not commit anything personal.

## 3. Staging protocol (≈ 90 min for 60 boxes)

1. Collect 10–14 distinct household items as a mini catalogue (e.g. mug, notebook, charger, socks pair, tube of cream, small box, bottle, pen pack, headphones case, keychain). Include **2 look-alike pairs** (two similar notebooks, two similar bottles) to test wrong-item detection.
2. Write `data/demo_catalogue.json` (sku, name, description, attributes). Optionally one reference photo per SKU (test both with and without in dev).
3. Use one shoebox/carton; shoot from above, whole box in frame, normal room light, phone camera. 2 photos per unit (top-down + slight angle). Vary lighting and item arrangement.
4. Create `eval/units.json`: `unit_id` (`EV-001`…`EV-050`), `order_lines` (2–4 lines each, qty 1–3).
5. Stage scenario mix for the 50 held-out units:

| Scenario | Count | Ground truth defect |
|----------|-------|--------------------|
| Correct | 18 | none |
| Missing item | 7 | missing |
| Short quantity | 5 | short_quantity |
| Over quantity / duplicate | 4 | over_quantity / duplicate |
| Extra unlisted item | 5 | extra_item |
| Wrong item (look-alike substitution) | 5 | wrong_item |
| Hard/ambiguous: stacked, partly occluded, glare, dark, cut-off | 6 | mixed; gold = `UNCERTAIN` if humans can't tell |

Total 50. Shoot the ambiguous ones deliberately; the UNCERTAIN path must be exercised or the report is dishonest.

## 4. Labeling (two humans, independent)

- **Labeler A** = owner. **Labeler B** = a second person (teammate/friend) who did not stage the box. Labelers see photos only (not the staging notes) plus the order lines.
- Each labeler fills one row per unit in `eval/labels/labeler_a.csv` / `labeler_b.csv`:
  `unit_id, verdict (SEAL|STOP_AND_FIX|UNCERTAIN), per_line: sku:presence(Y/N/?):qty(int/?) …, extra_items (Y/N/?), notes`
- Labelers must not confer until both files are committed.
- **Measure agreement first** (before any agent numbers):
  - Cohen's kappa on overall verdict (3 classes) and on each check, plus raw % agreement.
  - If verdict kappa < 0.7, tighten the labeling guide (`eval/LABELING_GUIDE.md`, 1 page) and re-label disputed units only after logging the change.
- **Gold** = agreement; disagreements resolved by discussion, logged in `eval/labels/adjudication.csv` with reason. The staging truth is a **third** reference: report label-vs-staging mismatch counts too (shows label noise).

## 5. Running the agent
`npm run eval -- --set heldout` → runs the exact production pipeline headlessly (same prompt, same rules engine, same single call per unit). Outputs `eval/results/<timestamp>.json` and updates `eval/results/latest.json`. Sequential with retry/backoff for rate limits; failed calls counted as `pending` and reported (do not silently re-run to hide failures).

## 6. Metrics (compute per check and overall)

Define the **positive class = defect present** for each check.

| Check | Positive means | TP | FP | FN | TN |
|-------|---------------|----|----|----|----|
| `presence` | item missing | agent FAIL, gold missing | agent FAIL, gold present | agent PASS, gold missing | agent PASS, gold present |
| `quantity` | qty wrong | analogous | | | |
| `extra` | unlisted item present | | | | |
| `wrong_item` | substitution | | | | |
| `overall` | box has ≥1 defect | agent STOP | agent STOP on good box | agent SEAL on defective box | agent SEAL on good box |

Report **FP and FN separately** (never a single accuracy). UNCERTAIN handling:
- Report the **UNCERTAIN rate** overall and per check.
- Report metrics **on decided units only** AND a "strict" view where UNCERTAIN counts as "not sealed" (safe) — clearly labelled.
- Report **coverage** = decided / total.
- Where gold is `UNCERTAIN`, agent UNCERTAIN = correct abstention; agent SEAL/STOP = overconfident.
- **Critical safety metric:** false-SEAL rate = defective boxes the agent sealed / defective boxes. Give a Wilson 95% interval (n is small; say so).
- Also: latency p50/p95, tokens and estimated cost per unit, failed/pending rate.
- Baseline: naive "always SEAL" (false-SEAL = 100%), and the dummy-CSV operator error rate from `scripts/csv-dryrun.ts` for context (label it as synthetic).

## 7. Failure-mode log
For every wrong or abstained unit write one line in `docs/EVAL_REPORT.md`: unit, gold, agent, cause tag, one-sentence explanation, thumbnail link.
Cause tags: `occlusion`, `stacked_items`, `look_alike`, `count_error`, `glare_dark`, `text_on_pack_misread`, `catalogue_gap`, `model_hallucinated_item`, `label_noise`, `other`.
Group into "named failure modes" with counts and a proposed fix.

## 8. Reporting template (`docs/EVAL_REPORT.md`, the agent fills from `latest.json`)

1. Method (dataset composition table, labelers, kappa, model, prompt version, frozen thresholds, date, run count).
2. Headline numbers (false-SEAL, false-STOP, UNCERTAIN rate, coverage).
3. Per-check table (TP/FP/FN/TN, precision, recall).
4. Confusion matrix (gold × agent, 3×3 + pending).
5. Failure modes table.
6. Kill-condition check: state the numbers and whether the kill condition from `PRD.md` §9 tripped.
7. What would improve it, and what we did **not** do.
8. Honest limitations: n=50, staged household items, single phone, one labeler pair, non-representative of a real catalogue.

## 9. Anti-cheating checklist
- [ ] Held-out photos never used in prompt/threshold tuning (log the dates).
- [ ] Thresholds and prompt version frozen and written into the report before the held-out run.
- [ ] Every held-out unit appears in the results, including failures/pending.
- [ ] Both labeler files committed before agent results were viewed.
