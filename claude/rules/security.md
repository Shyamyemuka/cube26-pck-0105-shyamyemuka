# Security rules

**Placement:** Project /.claude/rules/security.md

- Never write real keys, tokens, passwords or `.env*` values into any tracked file, commit message, test fixture, or doc. Only `.env.example` with empty values.
- `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` are server-only. Never prefix them `NEXT_PUBLIC_`. Never import the admin client in client components or user-facing route handlers.
- `org_id` always comes from the authenticated session (or the bearer token's mapped org for the evidence API), never from request input.
- Every table has RLS enabled and forced; evidence tables have no update/delete policies. Any new table or bucket needs a matching isolation assertion in `scripts/isolation-test.ts`.
- Validate every request body and upload with Zod (types, size ≤ 4 MB, `image/jpeg|png|webp`).
- Render model output as plain text. No `dangerouslySetInnerHTML`.
- Before finishing a phase gate, run the secret scan in `docs/SECURITY.md` §4.
- If you suspect a secret was committed: stop, tell the owner to revoke it, then clean history. Do not continue building on top.
