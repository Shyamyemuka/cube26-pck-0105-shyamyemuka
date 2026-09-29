---
description: Append a dated entry to docs/BUILD_LOG.md
---

# /build-log

**Placement:** Project /.claude/commands/build-log.md

Append one entry to the end of `docs/BUILD_LOG.md` (never edit earlier entries). Use IST time.

Format:
```
## YYYY-MM-DD HH:MM IST — <title>
- **Did:** …
- **Decided (and why):** …
- **Measured:** … (numbers only; include method or file path)
- **Broke / learned:** …
- **Next:** …
```
Rules: include any deviation from the PRD or plan here rather than editing the final docs. Reference task IDs from `docs/IMPLEMENTATION_PLAN.md` (e.g. P3-4). Arguments: `$ARGUMENTS` = short title or notes.
