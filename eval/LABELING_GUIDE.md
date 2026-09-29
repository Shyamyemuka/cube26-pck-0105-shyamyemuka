# Pack Manager — Labeling Guide for Ground Truth

**Purpose:** Provide independent human labelers (Labeler A and Labeler B) with unambiguous criteria to label open box photos against expected order lines.

## 1. Ground Truth Verdicts
Each unit must receive one overall verdict:
- **`SEAL`**: All items on the order are present with exact quantities, in good visible condition, and NO unlisted extra or wrong items are in the box.
- **`STOP_AND_FIX`**: At least one unambiguous defect is present:
  - Missing item: An item on the order is definitely not in the box.
  - Short quantity: Fewer items visible than ordered (e.g. ordered 2, saw 1).
  - Over quantity: More items visible than ordered.
  - Extra item: An unlisted item is in the box that is not part of the order.
  - Wrong item: A substitute or wrong SKU was packed instead of the ordered item.
- **`UNCERTAIN`**: You cannot honestly tell whether the order is correct from the photographs alone:
  - Heavy occlusion / items stacked deep where lower layers are invisible.
  - Photo is too dark, blurry, or glaring to identify the product.
  - Box edges are cut off so parts of the box interior are unseen.

## 2. Per-Item Check Guidelines
For each SKU in the order lines:
- **Presence**:
  - `Y`: Confidently present in the box.
  - `N`: Confidently missing (full view of box interior visible, item not present).
  - `?`: Cannot tell due to obstruction or bad lighting.
- **Quantity**:
  - Exact count if clear (e.g. `1`, `2`).
  - `?` if overlapping or stacked so exact count cannot be verified.
- **Extra Items**:
  - `N`: No unlisted items.
  - `Y`: Unlisted item present (name it if recognizable).
  - `?`: Suspicious object or shadow that might be an extra item.

## 3. Disagreements and Adjudication
- Labelers must complete their spreadsheets independently without communicating.
- Any disagreements are discussed and reconciled into `eval/labels/adjudication.csv`.
