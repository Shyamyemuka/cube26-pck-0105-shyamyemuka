---
description: Run the full pre-commit verification suite and report pass/fail
---

# /verify

**Placement:** Project /.claude/commands/verify.md

Run, in order, stop at first failure and fix it:
1. `npm run lint`
2. `npx tsc --noEmit`
3. `npm test`
4. `npm run test:isolation` (needs Supabase env; skip only if env is missing and say so)
5. Secret scan from `docs/SECURITY.md` §4
6. `npm run build`

Report a table: step, result, notes. Do not commit if any step fails. If all pass, suggest a commit message in the style "Add <what>".
