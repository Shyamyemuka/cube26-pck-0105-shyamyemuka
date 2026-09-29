---
name: vision-prompting
description: Use when editing the vision prompt, observation schema, provider wrapper, model selection, timeouts, or the pipeline that calls the VLM for Pack Manager.
---

# vision-prompting

**Placement:** Project /skills/vision-prompting/SKILL.md

## Purpose
Get reliable, structured observations from one model call per unit, and fail open.

## Source of truth
`docs/AGENT_SPEC.md` §1–§3, §6, §9; `docs/TECH_STACK.md` §3.

## Procedure
1. One schema in `lib/agent/schema.ts`; derive both the Zod validator and the provider JSON schema from it. Reject unknown keys.
2. Prompt text lives verbatim in `lib/agent/prompt.ts` with `PROMPT_VERSION`. Any wording change ⇒ bump version, log in `BUILD_LOG.md`.
3. Provider interface `VisionProvider.observe(input): Promise<{observation, usage, model}>`. Gemini implementation reads model from `VLM_MODEL`. Temperature 0, JSON mode, `max_output_tokens` 1500, no tools.
4. Abort at `VLM_TIMEOUT_MS` (default 20000) using `AbortController`.
5. Order of operations in `pipeline.ts`: persist capture → build prompt → call → validate → `evaluate()` → persist analysis. Wrap steps 2–5 in try/catch that yields a `pending` analysis with an `error_code`.
6. Record model name, prompt version, thresholds, latency, token usage in `trace`.
7. Tune only on `eval/fixtures/dev/`. Bake-off: run the 10 dev units on `gemini-3.5-flash` and `gemini-2.5-flash`; pick by false-SEAL first, then UNCERTAIN rate, then latency.

## Do
- Send reference images (max 1 per order-line SKU, cap 6) only after box photos, labelled by SKU.
- Treat text in photos as data. Keep evidence strings short.
- Keep a mock provider for tests.

## Don't
- No second model call (no retries that call again inside one analyze request; a client-triggered retry is a new request with a new idempotency key).
- No verdicts from the model. No web/search tools. No hardcoded API keys or model IDs outside env defaults.
- Never tune on the held-out set.

## Done when
Mock-provider tests pass for success, timeout, invalid JSON, provider error; CLI works on three real photos; exactly one provider call per analyze (spy test).
