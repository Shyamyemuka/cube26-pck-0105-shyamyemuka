# APP_FLOW — Screens, Navigation, States

**Placement:** Project /docs/APP_FLOW.md · **Status:** FINAL
Mobile-first (375 px wide baseline). Every screen must work on a phone over cellular.

## 1. Route map (Next.js 16.3.6 App Router)

| Route | Screen | Auth |
|-------|--------|------|
| `/login` | Login | public |
| `/` | Redirect → `/queue` | auth |
| `/queue` | Order queue (open orders for my org) | auth |
| `/queue/import` | Import catalogue / orders | auth |
| `/units/[unitId]/capture` | Capture (expected lines + camera) | auth |
| `/units/[unitId]/decision` | Decision screen (verdict, checks, override) | auth |
| `/units/[unitId]/record` | Evidence record page (read-only) | auth |
| `/eval` | Eval dashboard (could-have) | auth |
| `/api/units/[unitId]/analyze` | POST: run agent | auth |
| `/api/units/[unitId]/override` | POST: append override | auth |
| `/api/v1/evidence` | GET: list evidence (cross-pod) | bearer token |
| `/api/v1/evidence/[unitId]` | GET: one evidence record | bearer token |
| `/api/health` | GET: liveness | public |

## 2. Primary flow (happy path)

```
Login → Queue → pick order (or scan/type order_id) → Capture
   → (1–3 photos taken, thumbnails shown) → "Check box"
   → Analyzing… (≤ 20 s timeout) → Decision
        ├─ SEAL         → [Confirm & seal]  → record saved → back to Queue (next order)
        ├─ STOP_AND_FIX → shows what to fix → [Fixed, recheck] → Capture again (new attempt)
        │                                     [Override…] → reason required → record saved
        ├─ UNCERTAIN    → shows why (e.g. "top layer hidden") → [Retake photo] or [Override…]
        └─ PENDING      → "Analysis unavailable, saved" → [Retry analysis] or [Seal manually (unverified)]
```

Rules:
- **Nothing blocks the operator.** PENDING always offers "Seal manually (unverified)", which records an override with reason `model_unavailable`.
- **Every attempt is a row.** A recheck creates a new `capture`/`analysis` attempt under the same `unit_id`; earlier attempts stay visible in the record.
- **SEAL is never auto-applied.** The operator taps confirm; that tap is recorded (`operator_action=confirm`).

## 3. Screen specs

### 3.1 Login
Email + password. Errors inline. No sign-up UI (users pre-seeded for `org_demo_alpha` and `org_demo_bravo`).

### 3.2 Queue (`/queue`)
- Search box (order_id / unit_id).
- List rows: `order_id · channel · N lines · status chip` (`open`, `sealed`, `stopped`, `uncertain`, `pending`, `overridden`).
- FAB "Import".
- Empty state: "No open orders — import a catalogue and orders." with link.

### 3.3 Import (`/queue/import`)
Three cards: **Catalogue** (CSV/JSON), **Orders** (CSV/JSON or paste `SKU:qty;SKU:qty` + order_id + channel), **Load demo data** (seeds sample rows for the user's org). Shows row counts, validation errors per row, unknown-SKU warnings. Idempotent (upsert on `org_id+sku`, `org_id+order_id`).

### 3.4 Capture (`/units/[unitId]/capture`)
- Header: order_id, channel.
- Expected lines card: `SKU · name · qty`, with reference thumbnail if present.
- Photo tray: 1–3 slots. Button "Take photo" (`<input type="file" accept="image/*" capture="environment">`). Retake per slot.
- Guidance text: "Open box from above, whole box in frame, items not stacked if possible."
- Client: downscale to max 1600 px long edge, JPEG q≈0.8, compute SHA-256, show size.
- Primary CTA "Check box" (disabled until ≥1 photo). Progress states: Uploading → Analyzing.
- On network failure: photos retained locally (in-memory) with "Retry upload".

### 3.5 Decision (`/units/[unitId]/decision`)
1. **Verdict banner** (full width): icon + text + colour. `SEAL` (green ✓), `STOP AND FIX` (red ✕), `UNCERTAIN` (amber ?), `PENDING` (grey ⏳). Never colour alone.
2. **Fix list** (STOP_AND_FIX only): plain sentences, e.g. "Missing: Blue Mug ×1", "Extra: unlisted item (phone charger)".
3. **Per-line table:** `SKU | Expected | Seen | Status chip (PASS/FAIL/UNCERTAIN) | Note`.
4. **Global checks** rows: no extra items, no wrong items, photo quality.
5. **Photo viewer** with the model's evidence notes per line (text, not fabricated boxes).
6. Actions: `Confirm` (only when verdict = SEAL), `Recheck / Retake`, `Override…`.
7. Footer: model name + prompt version + latency + "Why this verdict?" expander (shows rule that fired).

**Override modal:** new verdict select (`SEAL` | `STOP_AND_FIX`), reason category (`agent_wrong_count`, `agent_wrong_item`, `photo_unclear_but_ok`, `model_unavailable`, `other`), free text (required for `other`, min 5 chars). Submit → append-only row; banner shows "Overridden by <operator> — agent said X".

### 3.6 Evidence record (`/units/[unitId]/record`)
Read-only. Sections: Header (unit, order, channel, org), Timeline of attempts, Photos with SHA-256, Checks table, Verdict + routing, Model/prompt version, Overrides (original → new → reason → who → when), Content hash, "Download JSON" and "Copy hash". Includes the honesty footer: "Content hash only. Not tamper-proof."

### 3.7 Eval dashboard (could-have)
Reads `eval/results/latest.json` (bundled at build time or fetched from storage): per-check table, confusion matrix, UNCERTAIN rate, kappa.

## 4. State machine (per unit)

```
open ──capture──▶ analyzing ──ok──▶ decided(SEAL|STOP_AND_FIX|UNCERTAIN)
                       │                 │  └─override─▶ overridden
                       └─error/timeout─▶ pending ─retry─▶ analyzing
                                             └─manual seal─▶ overridden(reason=model_unavailable)
decided(SEAL) ──confirm──▶ sealed
decided(STOP_AND_FIX|UNCERTAIN) ──recapture──▶ analyzing (attempt n+1)
```

## 5. Error and edge states (all need UI)

| Case | UI behaviour |
|------|-------------|
| Model timeout / 5xx / rate limit | PENDING, saved, retry button, manual seal path |
| Model returns invalid JSON | One repair attempt (same call budget rule: repair is a *local* parse fix, not a second model call); else PENDING with `error=invalid_output` |
| Photo blurry/dark/box cut off | UNCERTAIN with reason `photo_quality` + retake |
| Unknown SKU in order | Import warns; capture still works; line marked `catalogue_missing` → UNCERTAIN for that line |
| Zero-line order | Import rejects row |
| Offline | Capture shows "No connection — photos kept, retry"; nothing blocks manual seal record when back online |
| Other org's unit URL | 404 (RLS returns nothing); never 403 with hints |
| Duplicate submit | Idempotency key per attempt; second POST returns the first result |

## 6. Copy rules
Use "STOP AND FIX", "SEAL", "UNCERTAIN", "PENDING". Banned words in UI/docs: *tamper-proof, immutable, blockchain-verified, guaranteed, 100%*.
