# SECURITY

**Placement:** Project /docs/SECURITY.md · **Status:** FINAL

## 1. Hard rules from the event
- **No secrets in Git** (passwords, API keys, private tokens). Use environment variables and `.env.example`. A leaked key is revoked and noted against the submission.
- **Original work only.** All code must be yours. Plagiarism = disqualification. AI-assisted code is fine only if you understand and can defend it; do not copy other participants' repos (several public forks of this same repo exist).
- **Deadline is strict.**

## 2. Secret handling
| Secret | Where it lives | Never |
|--------|---------------|-------|
| `SUPABASE_SERVICE_ROLE_KEY` | server env only (Vercel, `.env.local`) | in client bundle, in `NEXT_PUBLIC_*`, in logs |
| `GEMINI_API_KEY` | server env only | in browser, in evidence records |
| `EVIDENCE_API_TOKENS` | server env only | in README, in screenshots |
| `SEED_PASSWORD` | local env only | committed |
Demo login credentials for judges: put them **only** in the private submission form notes if the form allows, or in the video description — not in the repo. Use throwaway demo accounts.

## 3. Application security controls
- RLS enabled + forced on all tables; storage policies by org folder; signed URLs 60 s (see `DATA_MODEL.md`).
- All API handlers: get user via Supabase server client; reject unauthenticated with 401; never accept `org_id` from the request body — derive from the session.
- Evidence API: bearer token → org; explicit `org_id` filter; constant-time token comparison; 404 for foreign ids.
- Input validation with Zod on every route (order lines, override payload, uploads: `image/jpeg|png|webp`, ≤ 4 MB after client downscale).
- Prompt-injection: system prompt rule 7; the rules engine ignores any free text from the model when deciding; UI renders model text as plain text (no `dangerouslySetInnerHTML`).
- Rate limit analyze route per user (simple in-memory or DB counter) to protect the API key.
- Log redaction: never log full observation JSON with signed URLs or keys.
- Dependencies: pinned exact; run `npm audit` before submit and note anything unresolved.

## 4. Pre-submit secret scan (agent runs, owner confirms)
```
git grep -nE "AIza[0-9A-Za-z_-]{20,}|sk-[A-Za-z0-9]{20,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}|service_role|SUPABASE_SERVICE_ROLE_KEY=.+" -- . ':!docs' ':!*.md'
git log -p --all -S"SUPABASE_SERVICE_ROLE_KEY=" -- . | head
git ls-files | grep -E "^\.env" | grep -v "\.env\.example"
```
Expected: no matches. If a secret ever reached history: **revoke it first**, then clean history.

## 5. Honest security claims (README wording)
Allowed: "Tenant isolation enforced with Postgres row-level security (enabled and forced) and org-scoped storage; verified by an automated test." "Content hash (SHA-256) and a hash chain for overrides make edits detectable by us."
Not allowed: "tamper-proof", "immutable", "blockchain", "cryptographically guaranteed", "audit-proof". Admin/service-role access can alter rows; say so.
