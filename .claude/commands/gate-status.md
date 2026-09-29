---
description: Report progress against IMPLEMENTATION_PLAN.md phases, gates and the cut line
---

# /gate-status

**Placement:** Project /.claude/commands/gate-status.md

1. Read `docs/IMPLEMENTATION_PLAN.md` and `docs/BUILD_LOG.md`; inspect the repo.
2. For each task ID P0-1 … P6-4 output one of `done`, `in progress`, `blocked (owner)`, `not started`, with a one-line evidence (file path, test name, URL).
3. State which phase gate is currently open and whether it passed.
4. Compare the current time (IST) with the schedule and the deadline (1 Oct 2026 18:00 IST). If a cut-line trigger (§3 of the plan) has been hit, name exactly which items are dropped as of now.
5. List the owner-only blockers (keys, staging, labeler B, video, LinkedIn, contract) with what is needed and by when.
Keep it under 40 lines.
