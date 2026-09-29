---
name: evidence-record
description: Use when building evidence records, canonical JSON hashing, the override hash chain, the record page, the /api/v1/evidence endpoints, or the CSV export for Pack Manager.
---

# evidence-record

**Placement:** Project /skills/evidence-record/SKILL.md

## Purpose
Every decision leaves a record a customer or another pod can read: what should be in the box, what was found, which checks ran, which verdict, why, and any human override.

## Source of truth
`docs/EVIDENCE_CONTRACT.md`, `docs/DATA_MODEL.md` §3, `docs/APP_FLOW.md` §3.6.

## Procedure
1. `lib/evidence/canonical.ts`: sorted keys, no whitespace, drop `undefined`. Unit-test determinism (key order shuffle ⇒ same hash).
2. `analyses.content_hash` and `overrides.row_hash` exactly as in `DATA_MODEL.md` §3. First override's `prev_hash` = analysis `content_hash`; later overrides chain to the previous `row_hash`.
3. `build.ts` assembles `pack_evidence.v1` from `captures` + latest `analyses` + `overrides`; `verdict` is the agent's, `effective_verdict` reflects overrides. Never drop or rewrite the original.
4. Zod schema `lib/evidence/schema.ts`; validate every outgoing record.
5. API: bearer token → org from `EVIDENCE_API_TOKENS` (`token:org_id`), explicit `org_id` filter, 404 for foreign ids, audit-log every read.
6. CSV: columns exactly as in `EVIDENCE_CONTRACT.md` §4.
7. Record page footer: "Content hash only. Not tamper-proof."
8. If the organisers' official contract arrives, implement `lib/evidence/adapters/official.ts` and add a note to `docs/BUILD_LOG.md`.

## Do
- Reference photos by key + hash; signed URLs only via the authenticated photo endpoint.
- Add a test that a record contains no secrets or signed URLs.

## Don't
- Don't call it tamper-proof, immutable, or anchored. Don't update/delete evidence rows. Don't include the service key or model API key anywhere in output.

## Done when
Contract tests (`EVIDENCE_CONTRACT.md` §6) pass and the record page shows photos, checks, model/prompt version, overrides, and hash.
