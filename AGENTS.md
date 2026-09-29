# AGENTS.md

**Placement:** Project Root · for coding agents other than Claude Code (Antigravity, Codex, Cursor, etc.)

Read `CLAUDE.md` in full before doing anything; it is the source of truth for rules, stack, commands, and layout. Then follow `docs/IMPLEMENTATION_PLAN.md` phase by phase.

Non-negotiables (repeated because they are the ones agents break):
1. The vision model returns observations only. Verdicts come from `lib/agent/rules.ts`.
2. Exactly one model call per unit.
3. UNCERTAIN is never turned into SEAL.
4. Save the capture before calling the model; on any failure store a `pending` record.
5. RLS enabled and forced on every table; org comes from the session, never from the request.
6. No secrets in git; only `.env.example`.
7. Do not tune prompts or thresholds on the held-out eval set.
8. Do not claim tamper-proof, immutable, or blockchain anything.

Task skills: `skills/verdict-engine`, `skills/supabase-rls`, `skills/vision-prompting`, `skills/eval-harness`, `skills/evidence-record` (each has a `SKILL.md`). Read the matching one before touching that area.
Log deviations in `docs/BUILD_LOG.md`; do not edit the final docs.
