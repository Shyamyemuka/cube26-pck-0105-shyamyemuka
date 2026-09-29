# PRD — Pack Manager (Pre-Seal Package Audit Agent)

**Placement:** Project /docs/PRD.md
**Event:** CUBE Buildathon 2026 · Track 03 · Pack Manager · Round 2 (individual build)
**Owner:** Shyam (`Shyamyemuka`) · **Implementer:** AI coding agent · **Status:** FINAL (no iterative revisions; deviations go in `docs/BUILD_LOG.md`)
**Hard deadline:** 1 Oct 2026, 6:00 PM IST (form closes permanently; treat as no resubmission)

---

## 1. One-line product

A phone-first web app where a packer photographs an **open box before sealing**; one batched vision-model call plus a deterministic rules engine compares what is in the box to the order lines and returns **SEAL / STOP_AND_FIX / UNCERTAIN**, with a per-check PASS/FAIL/UNCERTAIN trace, human override, and a downloadable evidence record.

## 2. Problem (from the brief)

A picker assembles an order and closes the box. Wrong item or quantity → mis-ship → refund, return, reshipment, bad review. Nobody checks because manual checking of every box costs more than the mis-ships. Applies only to merchant-fulfilled and 3PL orders (never FBA).

## 3. Customer

Small merchant-fulfilled seller or a small 3PL packing outbound orders (Amazon MFN, Shopify, Walmart, 3PL client). No fixed pack station, no barcode-scanner budget, packs on a table with a phone. Larger DC vendors (three funded competitors exist per the brief) do not call on this customer. **Our wedge = zero hardware, phone camera, works on cellular.**

Persona: "Meera", runs a 4-person home-goods seller shipping ~60 orders/day from a rented unit. Mis-ships are ~1–2% of orders; each costs her a refund plus reshipment plus a review risk. She will not add more than ~10 seconds per box.

## 4. Goals and non-goals

### Goals (scored)
| ID | Goal | Maps to rubric |
|----|------|----------------|
| G1 | Working end-to-end agent: order + catalogue + photos → structured verdict | Agent Functionality & Decision Quality (25) |
| G2 | Honest measured accuracy on 50 unseen units, per check, FP and FN separate, UNCERTAIN reported | Evaluation, Accuracy & Uncertainty (25) |
| G3 | Evidence record per unit + override audit + tenancy isolation + fail-open | Evidence, Traceability & Engineering Quality (20) |
| G4 | Clear customer/problem framing incl. kill condition | Problem Understanding (15) |
| G5 | Usable phone UX, real demo video, complete README/ARCHITECTURE | UX, Demo & Documentation (15) |
| G6 | Cross-pod evidence contract readable by Returns/Recovery pods | Round 3 (100 pts, pod integration) |

### Non-goals
- Automated FBA packing lines (explicitly out of scope).
- Barcode/OCR-first workflows, weight-based checks, multi-box shipments, hardware integrations.
- Training or fine-tuning any model. No per-SKU training.
- Real marketplace (Amazon/Shopify) API integration.
- Claims of tamper-proof, immutable or blockchain-anchored records. We have a content hash only.

## 5. Required capabilities (from brief screenshots)

1. **Operational understanding** — pre-seal verification for MFN/3PL only.
2. **Multi-modal ingestion** — box photos (1–3), order file (CSV/JSON/paste), SKU catalogue (CSV/JSON, optional reference images), evidence records (JSON in/out).
3. **Traceable decisions** — structured JSON explaining *why*.
4. **PASS / FAIL / UNCERTAIN** — UNCERTAIN is first-class; never guess on missing evidence.
5. **Human override** — operator can override with reason; original agent verdict and audit log preserved.
6. **Tech stack freedom** — see `TECH_STACK.md`.

Discrepancy taxonomy the agent must emit: `correct`, `missing`, `short_quantity`, `over_quantity`, `extra_item`, `wrong_item`, `duplicate`.
Routing decisions: `SEAL`, `STOP_AND_FIX` (+ `UNCERTAIN` → hold for recapture/human review; never auto-seal).

## 6. Functional requirements

Priority: **M** must (blocks submission), **S** should, **C** could.

| ID | Requirement | Pri |
|----|-------------|-----|
| FR-01 | Email+password login (Supabase Auth); user belongs to exactly one org | M |
| FR-02 | Import SKU catalogue (CSV/JSON): `sku, name, description, attributes, reference_image_url?` | M |
| FR-03 | Import/create orders: paste `SKU:qty;SKU:qty`, upload CSV matching `data/pack_sample.csv` columns, or JSON | M |
| FR-04 | Capture screen: shows expected lines; camera capture 1–3 photos; client-side downscale + SHA-256 | M |
| FR-05 | One batched VLM call per unit (all checks in one call) | M |
| FR-06 | Deterministic rules engine converts VLM observations → per-check PASS/FAIL/UNCERTAIN → verdict | M |
| FR-07 | Decision screen: verdict banner, per-line expected vs observed, per-check status, evidence notes, photo viewer | M |
| FR-08 | Override: operator sets a new verdict with mandatory reason; original preserved; append-only | M |
| FR-09 | Fail-open: model error/timeout still saves capture and creates record with status `pending`; operator never blocked | M |
| FR-10 | Evidence record page: photos, timestamps, operator, all checks, verdict, model + prompt version, overrides, content hash; JSON download | M |
| FR-11 | Tenancy isolation: RLS enabled AND forced on every table; storage isolated; second org sees zero rows and cannot fetch images by guessing keys; automated test | M |
| FR-12 | Headless CLI: `npm run agent -- --unit <id>` runs the same pipeline on fixture images | M |
| FR-13 | Eval harness: 50 held-out units, two independent labelers, agreement measured first, per-check FP/FN, UNCERTAIN rate, failure modes | M |
| FR-14 | Cross-pod contract: `pack_evidence.v1` JSON + `GET /api/v1/evidence` + CSV export compatible with `pack_sample.csv` columns | M |
| FR-15 | Demo video showing setup, ingestion, reasoning, edge cases (no slides-only) | M |
| FR-16 | Photo-quality gate (blur/dark/occluded/box not fully in frame) → UNCERTAIN with reason and "retake" prompt | S |
| FR-17 | Eval dashboard page reading last eval results | C |
| FR-18 | Batch mode: upload N units' photos + orders and process | C |
| FR-19 | Rate-limit + cost counter (calls, tokens, est. cost per unit) shown in record | S |

## 7. Non-functional requirements

- **Latency:** p50 ≤ 8 s, p95 ≤ 20 s capture→verdict on cellular (measure and report; do not claim without numbers).
- **Fail-open:** any exception path still persists capture + record (`status=pending`).
- **Cost:** exactly one model call per unit (Rule 2). Report tokens/cost per unit.
- **Security:** no secrets in git; env vars only; `.env.example` committed; service-role key server-only.
- **Honesty:** say "content hash" not "tamper-proof". Report the number you measured, not the number that sounds good.
- **Mobile:** works on a real phone over cellular (Gate for day 5–7 equivalent).
- **Accessibility:** verdict is never colour-only (icon + text label).

## 8. Success metrics (fill from eval; targets are hypotheses, not claims)

| Metric | Definition | Target hypothesis |
|--------|-----------|-------------------|
| **False-SEAL rate** (critical) | Gold has a defect, agent said SEAL | ≤ 5% of defective boxes |
| False-STOP rate | Gold is correct, agent said STOP_AND_FIX | ≤ 15% of correct boxes |
| UNCERTAIN rate | Share of units routed UNCERTAIN | report; ≤ 25% |
| Accuracy on decided units | Correct verdicts among non-UNCERTAIN | report per check |
| Labeler agreement | Cohen's kappa between the two humans | ≥ 0.7 before trusting gold |
| Latency p50/p95 | capture→verdict | report |
| Cost/unit | model spend | report |

## 9. Kill condition (must appear in the one-pager and demo)

> **If, on the 50-unit held-out set, the false-SEAL rate on missing/wrong-item defects exceeds 25% OR the UNCERTAIN rate exceeds 50%, the phone-photo approach does not work for this customer without per-SKU reference images, and we say so.**
> Outcome documented either way. Per the brief, a documented negative result is a valid outcome.

## 10. Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Only ~3 days left | High | Follow `IMPLEMENTATION_PLAN.md` cut line; must-haves first |
| VLM cannot count stacked/overlapping items | High | Photo-quality gate, UNCERTAIN path, reference images, report as failure mode |
| Model ID/limits change | Medium | Model in env var; provider interface; record model version in every evidence record |
| No fixtures/images shipped in repo | Certain | Staged capture protocol in `EVAL_PLAN.md` |
| Official evidence contract not visible to us | Medium | Own `pack_evidence.v1` + adapter layer; obtain contract from organisers' WhatsApp/My Track page |
| Free-tier rate limits on VLM | Medium | Sequential eval with backoff; small cache keyed by content hash for eval reruns only |

## 11. Assumptions to state honestly in README

1. Catalogue has usable names/descriptions; reference images improve results but are optional.
2. One box per order; items visible from above; up to 3 photos.
3. Requirement rules are the seller's own order lines — no Amazon rule lookups are needed for pack verification (Rule 5 applies to any channel packaging rule; we implement none, and say so).
4. Dummy CSV is a schema reference and rules-engine test set, **not** ground truth for vision accuracy.

## 12. Out-of-scope confirmations

No FBA support, no real marketplace integration, no fine-tuning, no claims about immutability.
