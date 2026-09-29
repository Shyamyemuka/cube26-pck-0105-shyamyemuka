---
name: verdict-engine
description: Use when implementing or changing lib/agent/rules.ts, thresholds, verdict precedence, discrepancy taxonomy, or the rules-engine unit tests for Pack Manager.
---

# verdict-engine

**Placement:** Project /skills/verdict-engine/SKILL.md

## Purpose
Turn a validated `VlmObservation` + order into per-check PASS/FAIL/UNCERTAIN, discrepancies, a verdict and a route. Pure function, no I/O, no model calls.

## Source of truth
`docs/AGENT_SPEC.md` §4–§7. If code and spec disagree, the spec wins; if the spec is wrong, log a deviation in `docs/BUILD_LOG.md`.

## Procedure
1. Signature: `evaluate(order: OrderSnapshot, obs: VlmObservation | null, cfg: Thresholds): EvalOutput`.
2. Rule 0 photo gate first; if unusable, every content check is UNCERTAIN and the verdict is UNCERTAIN.
3. Per line: `line.presence`, then `line.quantity` (only when presence PASS).
4. Global: `no_extra_items`, `no_wrong_items` (substitution relabel).
5. Precedence: any content FAIL ⇒ STOP_AND_FIX; else any non-PASS ⇒ UNCERTAIN; else SEAL.
6. Every check carries a human-readable `reason` and, where applicable, `confidence`.
7. Write/extend `tests/rules.test.ts` (T1–T15) BEFORE changing behaviour.

## Do
- Keep it pure and deterministic; thresholds only via `cfg`.
- Return reasons in plain warehouse language.
- Treat `null`, missing lines, or extra lines in the observation as UNCERTAIN for that line (never throw).

## Don't
- Never map UNCERTAIN to SEAL. Never let model text influence the verdict.
- Never add async calls or imports from Supabase/SDKs.
- Never change thresholds using held-out data.

## Done when
`npm test` green for all T1–T15 plus any new case; coverage of every branch in §5.
