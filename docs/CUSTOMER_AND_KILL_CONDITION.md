# Customer letter, PR/FAQ, one-pager, kill condition

**Placement:** Project /docs/CUSTOMER_AND_KILL_CONDITION.md · **Status:** FINAL
Written before code, as the brief's "outcome first" method asks. The customer is **hypothetical**: nobody has been interviewed. Say so in the README. If the owner can get one real seller on a call, ask them to **rank the five problems by urgency**; do not ask whether they would buy this.

## 1. Customer letter (voice: small seller)

> I ship about 60 orders a day from a rented room. Two of us pack on a folding table. Last month I paid for 19 refunds where the wrong colour, a missing item or an extra freebie went out. Each one costs me the item, the return shipping, a reship and sometimes a one-star review. I know a scanning station would catch most of it, but it costs more than the mistakes do and I don't have a place to bolt it down.
> What I want is small: before we tape the box, take a photo and tell me "go" or "stop, something's off". If it isn't sure, say so, don't pretend. And if a buyer says the box was empty or wrong, I want proof of what was in it when it left.
> If it slows a box by more than ten seconds we will stop using it.

## 2. Press release (as if shipped)

**Pack Manager: a phone photo before you tape the box.**
Small sellers and 3PLs can now check every outbound box against the order in about ten seconds, with no scanner and no fixed station. Snap the open box; Pack Manager says SEAL, STOP AND FIX, or UNCERTAIN, shows what it saw, and stores a record you can hand to a marketplace or a buyer. It does not guess: when a photo can't show what's inside, it says so.

## 3. FAQ

| Question | Honest answer |
|----------|--------------|
| Who is this for? | Merchant-fulfilled and 3PL packers with no fixed station. Not FBA sellers (Amazon packs those boxes). Not big DCs (funded vendors already sell there). |
| Why not just scan barcodes? | Scanning needs hardware and per-item handling, and misses look-alike items with no barcode visible. We trade some accuracy for zero hardware. |
| How accurate is it? | Unknown until measured. See `EVAL_REPORT.md`; we report false-SEAL and false-STOP separately and the UNCERTAIN rate. |
| **Questions we'd rather not answer** | |
| Can a vision model count stacked or overlapping items? | Probably not reliably. We route those to UNCERTAIN; the report says how often. |
| Does this beat the funded competitors? | No, and it doesn't try to. The question is whether a phone-only version works for a customer they don't serve. |
| What if it wrongly says SEAL? | That's the metric that matters most (false-SEAL). It is reported with a confidence interval, and the override path exists because humans will disagree. |
| Is the record legal proof? | No. It has a content hash and a hash chain for overrides. It is not tamper-proof, immutable or third-party anchored. |
| Did you talk to real sellers? | No. The customer is hypothetical. |
| Will it work on a real, long-tail catalogue? | Untested. Our eval uses ~12 staged household items. |
| What does it cost per box? | Measured in the report (one model call per unit). |

## 3b. Metrics table (one-pager)

| Metric | Why it matters | Target hypothesis | Measured (fill) |
|--------|----------------|-------------------|-----------------|
| False-SEAL rate | A missed defect is the mis-ship we exist to prevent | ≤ 5% of defective boxes | |
| False-STOP rate | Erodes trust, slows the line | ≤ 15% of good boxes | |
| UNCERTAIN rate | Too high = tool is useless | ≤ 25% | |
| Seconds added per box | Customer's stop condition | ≤ 10 s | |
| Cost per box | Must be far below cost of a mis-ship | report | |
| Labeler agreement (kappa) | Trust in ground truth | ≥ 0.7 | |

## 4. Kill condition

> If on the 50-unit held-out set the **false-SEAL rate on missing or wrong-item defects exceeds 25%**, or the **UNCERTAIN rate exceeds 50%**, or **median added time exceeds 15 seconds**, then a phone-photo-only approach does not work for this customer without per-SKU reference images or extra hardware, and we say that in the demo.

State on demo Day: the numbers, and whether the condition tripped.

## 5. What would change our mind
- If reference images per SKU cut false-SEAL by more than half → recommend "photo catalogue onboarding" as the product wedge.
- If UNCERTAIN concentrates on stacked items → recommend a two-layer capture protocol (photo before and after the top layer).
