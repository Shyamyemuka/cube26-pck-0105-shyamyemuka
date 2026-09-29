# Coding standards

**Placement:** Project /.claude/rules/coding-standards.md

- TypeScript strict. No `any` without an explaining comment. Zod at every boundary (API in/out, model output, CSV rows, env).
- Logic in pure functions under `lib/`; route handlers are thin (auth → validate → call lib → respond).
- `snake_case` in DB and JSON contracts; `camelCase` in TypeScript; map at the boundary.
- One model call per unit; the verdict comes only from `lib/agent/rules.ts`.
- Persist first, then call external services; on failure store a `pending` record, never throw to the user.
- Errors: typed `error_code` values from `docs/AGENT_SPEC.md` §6. User-facing text from `docs/UX_SPEC.md` §4.
- Tests: write the rules-engine and canonical-JSON tests before changing them. `npm test`, `npm run lint`, `npm run build` must be green before each commit to `main`.
- Commits: small, meaningful ("Add extra-item detection"). Never "update", "final", "fix". Never force-push.
- Dependencies: exact pins only; add a line to `docs/TECH_STACK.md` §7 when adding one; avoid heavy libs.
- Accessibility: status is never colour-only; tap targets ≥ 48 px.
- Do not edit upstream `RULES.md`, `GITHUB-GUIDE.md`, or `data/`.
