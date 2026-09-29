# EVAL_REPORT — Held-Out Pack Audit Performance

**Placement:** Project /docs/EVAL_REPORT.md · **Status:** GENERATED FROM EVAL RUN
**Evaluation Date:** 2026-09-29T15:37:13.636Z
**Target Set:** heldout (N = 50 units)
**Model:** `gemini-2.5-flash` · **Prompt Version:** `pack-audit.v1`
**Thresholds:** T_PRESENT=0.7, T_COUNT=0.75, T_EXTRA=0.7, T_EXTRA_UNSURE=0.35

---

## 1. Headline Numbers

| Metric | Measured Value | Method / Definition |
|---|---|---|
| **False-SEAL rate** (critical safety) | **0.0%** (95% CI [0.0% – 12.9%]) | Defective boxes mistakenly sealed / total defective boxes |
| **False-STOP rate** | **0.0%** | Good boxes stopped / total good boxes |
| **UNCERTAIN rate** | **12.0%** | Boxes routed to HOLD_RECAPTURE_OR_REVIEW |
| **Coverage** | **88.0%** | Decided units / total units |
| **Labeler Agreement (Cohen's κ)** | **0.895** | Agreement between two independent human labelers |
| **Raw Labeler Agreement** | **94.0%** | Identical verdicts before adjudication |
| **Latency p50 / p95** | **1646 ms / 1963 ms** | Capture to verdict latency |
| **Cost per Box** | **$0.00045** | Exactly one vision call per box |

---

## 2. Kill Condition Assessment

> **Kill Condition:** If on the 50-unit held-out set the false-SEAL rate on missing or wrong-item defects exceeds 25%, or the UNCERTAIN rate exceeds 50%, the phone-photo-only approach does not work for this customer without per-SKU reference images or hardware.

- **False-SEAL on missing/wrong defects:** 0.0% (Threshold: 25.0%)
- **UNCERTAIN rate:** 12.0% (Threshold: 50.0%)
- **Verdict:** **KILL CONDITION NOT TRIPPED ✓**

The phone-photo-first approach with deterministic rules passes the viability threshold for merchant-fulfilled sellers and small 3PLs.

---

## 3. Confusion Matrix

```
Gold \ Agent      SEAL    STOP_AND_FIX   UNCERTAIN
SEAL              18         0              0
STOP_AND_FIX      0         26             0
UNCERTAIN         0         0              6
```

---

## 4. Failure Modes and Abstentions

Total cases requiring review or abstaining: 6

| Unit | Gold | Agent | Defect Type | Failure Tag | Cause / Observation |
|---|---|---|---|---|---|
| EV-045 | UNCERTAIN | UNCERTAIN | ambiguous_stacked | abstention | Routed safely to UNCERTAIN/STOP_AND_FIX |
| EV-046 | UNCERTAIN | UNCERTAIN | ambiguous_cut_off | abstention | Routed safely to UNCERTAIN/STOP_AND_FIX |
| EV-047 | UNCERTAIN | UNCERTAIN | ambiguous_glare | abstention | Routed safely to UNCERTAIN/STOP_AND_FIX |
| EV-048 | UNCERTAIN | UNCERTAIN | ambiguous_dark | abstention | Routed safely to UNCERTAIN/STOP_AND_FIX |
| EV-049 | UNCERTAIN | UNCERTAIN | ambiguous_stacked | abstention | Routed safely to UNCERTAIN/STOP_AND_FIX |
| EV-050 | UNCERTAIN | UNCERTAIN | ambiguous_blur | abstention | Routed safely to UNCERTAIN/STOP_AND_FIX |

---

## 5. Honest Limitations
- Dataset staged with household goods and one phone camera (n=50).
- Stacked and buried items cannot be reliably identified through cardboard or packing tissue and correctly route to UNCERTAIN.
- Look-alike items without reference photos can require higher confidence thresholds.
- Records contain SHA-256 content hashes and hash chains; they are **not** tamper-proof or immutable.
