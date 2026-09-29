# UX_SPEC — Visual and interaction rules

**Placement:** Project /docs/UX_SPEC.md · **Status:** FINAL
Screens and flows are in `APP_FLOW.md`; this file is the look, feel and microcopy. Scored under "UX, Demo & Documentation".

## 1. Design principles
1. **Ten-second box.** A packer holds a phone in one hand. Big targets (≥ 48 px), one primary action per screen.
2. **Verdict first.** The banner is the first thing on the decision screen; details below.
3. **Never colour-only.** Icon + word + colour for every status.
4. **Say why.** Every FAIL/UNCERTAIN has a one-line reason a warehouse worker understands.
5. **Never blocks.** Failure states offer a way forward.

## 2. Tokens
| Token | Value | Use |
|-------|-------|-----|
| `--seal` | green 600 `#16a34a` on green 50 | SEAL, PASS |
| `--stop` | red 600 `#dc2626` on red 50 | STOP_AND_FIX, FAIL |
| `--unsure` | amber 600 `#d97706` on amber 50 | UNCERTAIN |
| `--pending` | slate 500 `#64748b` on slate 100 | PENDING |
| Font | system UI stack (`ui-sans-serif, system-ui`) | no webfont dependency |
| Radius | 12 px cards, 999 px chips | |
| Min tap | 48 × 48 px | |
Light theme only for v1; contrast ratio ≥ 4.5:1 for text.

## 3. Components
- **VerdictBanner** (`SEAL` ✓ / `STOP AND FIX` ✕ / `UNCERTAIN` ? / `PENDING` ⏳), full width, 64 px tall, 20 px bold.
- **StatusChip** (`PASS`, `FAIL`, `UNCERTAIN`) with icon.
- **LineRow**: SKU + name (truncate), expected qty, seen qty, chip, note.
- **PhotoTray**: 3 slots, thumbnails, retake button, size + hash prefix in small grey text.
- **OverrideSheet**: bottom sheet on mobile, modal on desktop.
- **HashBadge**: first 12 chars of hash, copy button, tooltip "Content hash. Not tamper-proof."
- **Toast**: bottom, 4 s, for retry/undo.

## 4. Microcopy (use exactly)

| Situation | Text |
|-----------|------|
| Capture guidance | "Open box from above. Whole box in frame. Spread items if you can." |
| Analyzing | "Checking box…" (never "AI is thinking") |
| SEAL | "Box matches the order." |
| STOP_AND_FIX | "Fix before sealing." + fix list |
| UNCERTAIN | "Can't tell from this photo. Retake, or check by hand." + reason |
| PENDING | "Check unavailable. Photos saved." + "Retry check" / "Seal by hand (unverified)" |
| Override reason placeholder | "What did you see that the check missed?" |
| Record footer | "Content hash only. Not tamper-proof." |
Reasons map (`photo_quality`, `occluded`, `cannot_count`, `partial_view`, `low_confidence`, `catalogue_missing`) → plain sentences in `lib/agent/reasons.ts`.

## 5. Empty, loading and error states
Every list has an empty state with the next action. Loading uses skeletons, not spinners over blank screens. Errors are inline with a retry, never a bare stack trace.

## 6. Demo-friendliness
- "Load demo data" button seeds catalogue + 5 orders in one tap.
- Record page prints cleanly (CSS `@media print`) — useful for the video.
- Latency shown on the decision footer ("Checked in 6.2 s").
