# EVIDENCE_CONTRACT — `pack_evidence.v1` (cross-pod interface)

**Placement:** Project /docs/EVIDENCE_CONTRACT.md · **Status:** FINAL

## 0. Important caveat
The Round 2 brief says to "use the official evidence contract provided by the organisers as the baseline." **That contract was not visible in the repo or in the public pages checked.** Get it from the organisers' WhatsApp group / "My Track" page. Until then this document is our own contract, designed to be a superset of the dummy CSV columns so mapping is trivial. If the official contract differs, write an adapter in `lib/evidence/adapters/official.ts` and log the difference in `docs/FINDINGS.md`. Do not silently pick one side.

## 1. Consumers
- **Returns Manager** — needs "what was actually sent" (`contents_observed`, photos, verdict).
- **Recovery Manager** — needs buyer-dispute evidence for empty-box / wrong-item claims (photos + hashes + timestamps + operator + overrides).
Join key across all five repos: `unit_id` (`UNIT-0001` … `UNIT-0100`).

## 2. JSON shape

```jsonc
{
  "schema": "pack_evidence.v1",
  "record_id": "PCK-<8 hex of analysis.id>",     // stage prefix PCK matches dummy CSV convention
  "unit_id": "UNIT-0042",
  "org_id": "org_demo_alpha",
  "order_id": "ORD-…",
  "channel": "amazon_mfn",                        // amazon_mfn | shopify | walmart | 3pl_client
  "captured_at": "2026-09-30T08:15:22Z",          // UTC ISO 8601
  "operator_id": "<uuid or display id>",
  "attempt_no": 1,
  "order_lines": "SKU-A:1;SKU-B:2",              // same format as dummy CSV
  "observed_in_box": "SKU-A:1;SKU-B:1;UNLISTED:1", // best-effort, derived from observation; UNLISTED for unknown items
  "photos": [
    { "ref": "org_demo_alpha/UNIT-0042/<capture-uuid>/<uuid>.jpg", "sha256": "…", "bytes": 231044 }
  ],
  "status": "decided",                            // decided | pending
  "verdict": "STOP_AND_FIX",                      // SEAL | STOP_AND_FIX | UNCERTAIN | null
  "route": "STOP_AND_FIX",                        // SEAL | STOP_AND_FIX | HOLD_RECAPTURE_OR_REVIEW | PENDING
  "checks": [
    { "id": "line.quantity", "scope": "line", "sku": "SKU-B", "status": "FAIL", "reason": "Expected 2, saw 1 (conf 0.88)" },
    { "id": "no_extra_items", "scope": "global", "status": "PASS", "reason": "none seen, full view" }
  ],
  "discrepancies": [
    { "type": "short_quantity", "sku": "SKU-B", "expected_qty": 2, "observed_qty": 1, "detail": "…" }
  ],
  "model": { "provider": "gemini", "name": "gemini-3.5-flash", "prompt_version": "pack-audit.v1", "thresholds": { "T_PRESENT": 0.7, "T_COUNT": 0.75, "T_EXTRA": 0.7, "T_EXTRA_UNSURE": 0.35 } },
  "overrides": [
    { "at": "…", "operator_id": "…", "original_verdict": "STOP_AND_FIX", "new_verdict": "SEAL",
      "reason_code": "agent_wrong_count", "reason_text": "Second unit under the tissue paper", "row_hash": "…" }
  ],
  "effective_verdict": "SEAL",                    // latest override's new_verdict, else verdict
  "content_hash": "sha256:…",                    // analyses.content_hash
  "hash_note": "Content hash (SHA-256 over canonical JSON). Not tamper-proof or immutable.",
  "generated_at": "…"
}
```
Rules:
- `verdict` is what the **agent** said, never rewritten by an override. `effective_verdict` shows the human-adjusted outcome. Overrides are never dropped.
- `observed_in_box` is derived from observation quantities where `count_confidence ≥ T_COUNT`; otherwise the SKU appears with `?` (e.g. `SKU-B:?`). Consumers must treat it as a hint, not truth.
- No secrets, no signed URLs in the record. Photos are referenced by key + hash; a consumer with access requests a signed URL through the API.

## 3. HTTP API (server-to-server)

Auth: `Authorization: Bearer <token>`. Tokens live in env `EVIDENCE_API_TOKENS` as `token:org_id` pairs, comma-separated (e.g. `tok_abc:org_demo_alpha,tok_def:org_demo_bravo`). The token determines the org; a token can never read another org's records (test this).

| Method | Path | Returns |
|--------|------|---------|
| GET | `/api/v1/evidence?unit_id=&since=&limit=` | `{ "items": [record…], "next": cursor|null }` (default limit 50, max 200) |
| GET | `/api/v1/evidence/{unit_id}` | latest record for the unit (404 if none in this org) |
| GET | `/api/v1/evidence/{unit_id}/photos/{index}` | 302 to a 60 s signed URL (only after token+org check) |
| GET | `/api/v1/evidence.csv` | CSV export (see §4) |
| GET | `/api/health` | `{ "ok": true, "version": "<git sha or package version>" }` |

Errors: `401` missing/invalid token, `404` not found (also used for other-org ids — no existence leak), `429` rate limit, `500` generic. Every read appends an `audit_log` row (`action=api_read`).
The API uses the service role client **only after** validating the token, and **always** filters `org_id = <token org>` explicitly (defence in depth; do not rely on RLS here).

## 4. CSV export (compatible with `data/pack_sample.csv`)

Columns in this order:
`record_id,unit_id,org_id,photo_refs,operator_id,captured_at,order_id,channel,order_lines,observed_in_box,operator_verdict`
then extra columns: `agent_verdict,route,effective_verdict,content_hash,model,prompt_version`.
- `photo_refs`: `;`-separated keys.
- `operator_verdict`: lower-case `seal` or `stop_and_fix` = the **effective** verdict after any override; `uncertain`/`pending_review` are used when unresolved (the dummy data uses these values on purpose).

## 5. Versioning
Breaking change ⇒ `pack_evidence.v2`, served alongside v1 via `?schema=`. Ship v1 only.

## 6. Contract tests (`tests/evidence-contract.test.ts`)
1. Record validates against the Zod schema `lib/evidence/schema.ts`.
2. CSV header equals the specified columns.
3. Override present ⇒ `verdict` unchanged, `effective_verdict` changed, override listed.
4. Bearer token for org A cannot read org B's unit (404) and cannot fetch its photo.
5. No field contains `SUPABASE`, `sk-`, `AIza`, or a URL with `token=`.
