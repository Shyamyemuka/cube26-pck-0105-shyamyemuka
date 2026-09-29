# DEMO_SCRIPT — 4:30 min video (slide-only videos are rejected)

**Placement:** Project /docs/DEMO_SCRIPT.md · **Status:** FINAL
The submission rubric wants the video to show: **problem setup, input ingestion, agent reasoning, edge-case handling.** Record a phone screen + a laptop screen. Speak plainly. Do not read the README aloud.

| Time | Show | Say (paraphrase) |
|------|------|-----------------|
| 0:00–0:25 | Face or title card, then the shoebox on a table | "Small sellers mis-ship 1–2% of orders and can't afford scanning stations. Pack Manager checks the open box from a phone photo before sealing." Name the customer and what a wrong box costs. |
| 0:25–1:00 | Import page: upload catalogue + orders (CSV), then "Load demo data" | "Inputs: SKU catalogue, order file, box photos, and (later) evidence records." Point at the unknown-SKU warning. |
| 1:00–2:00 | **Happy path on the phone (cellular):** queue → capture 2 photos → decision **SEAL** | Show latency. Open "Why this verdict?" to show the per-line trace and model/prompt version. |
| 2:00–3:00 | **Defect:** remove one item → **STOP AND FIX** with fix list | Point at missing vs short quantity vs wrong item. Show the JSON output. |
| 3:00–3:35 | **Edge cases:** (a) cover half the box → **UNCERTAIN** with retake; (b) turn off the API key → **PENDING**, photos saved, seal by hand | "Never guess. Never block." |
| 3:35–4:00 | **Override:** disagree with the agent, give a reason → record page shows original verdict + override + hash chain | "Overrides are data. Original verdict is preserved." |
| 4:00–4:30 | Eval report + kill condition slide (numbers only), then evidence API returning the record | "Measured on 50 unseen units, two labelers, kappa X. False-SEAL X%, UNCERTAIN Y%. Kill condition: tripped / not tripped. Here's the record another pod can read." |

Recording checklist:
- [ ] Use the deployed URL, not localhost
- [ ] Wi-Fi OFF on the phone for the cellular shot
- [ ] Hide keys, tokens, and email addresses on screen
- [ ] Show at least one **failure** honestly (the brief rewards this)
- [ ] Upload as unlisted/public link; open it in a private window to verify
- [ ] Video description contains: repo URL, deployed URL, one line on the customer, demo login only if the form asks for it
