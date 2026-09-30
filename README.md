# Pack Manager — Pre-Seal Package Audit Intelligence

> **Audit the open box before you tape it shut.**  
> Real-time computer vision verification for ecommerce fulfillment centers, 3PL warehouses, and merchant-packed outbound cartons.

---

## 1. Problem Understanding

In modern ecommerce fulfillment (merchant-fulfilled Shopify, Walmart Marketplace, Amazon MFN, and direct-to-consumer 3PL brands), outbound shipping errors represent a severe cost driver:
- **Missing items**: A multi-item order is dispatched with one SKU forgotten.
- **Wrong SKU / Variant substitution**: A packer accidentally picks a similar item (e.g. wrong color, wrong size, or look-alike bottle).
- **Incorrect counts**: Short quantities or accidental duplicate items packed into the carton.
- **Unlisted extra items**: Rogue items falling into the box or left behind on packing benches.

### The Fulfillment Dilemma
Traditional warehouse verification methods have steep drawbacks:
1. **Item-by-item barcode scanning** is slow and tedious, creating massive bottlenecks at packing stations during peak order volume.
2. **Fixed conveyor inspection tunnels** cost tens of thousands of dollars and are out of reach for small-to-mid-market merchants.
3. **Post-delivery customer discovery** is the worst outcome: once the box is taped shut and shipped, an error triggers expensive return shipping labels, customer support tickets, lost inventory, and marketplace chargeback penalties.

---

## 2. Solution Overview

**Pack Manager** provides zero-barcode, pre-seal package verification using a single overhead photograph taken on any smartphone, tablet, or workstation webcam:

1. **One-Shot Multi-Modal Observation**:
   An operator photographs the open, packed carton right before taping it shut. A high-throughput multimodal vision model (`gemini-3.5-flash`) observes the box contents and extracts a structured inventory of visible items, quantities, visibility ratings, confidence scores, and unlisted items.
2. **Deterministic Rules Engine (`lib/agent/rules.ts`)**:
   **The model observes; pure code decides.** The AI vision model is strictly an observer and is prohibited from deciding whether the box is safe to ship. A deterministic rule evaluation engine compares the observation against the expected order lines and returns one of three clear operational verdicts:
   - **`SEAL`**: All ordered items are verified present in exact quantities, with zero extra or substitute items. Ready to tape and ship.
   - **`STOP AND FIX`**: Explicit packing defect identified (missing SKU, short count, or incorrect item). Clear rectification instructions appear on-screen.
   - **`UNCERTAIN`**: Ambiguous photo, occluded items, glare, or darkness. The box is held for quick adjustment or supervisor review. **Uncertain is a first-class verdict and is never silently converted into an approval.**
3. **Fail-Open Resilience**:
   Photos and capture attempts are persistently hashed and recorded **before** the model is invoked. If the vision provider experiences a timeout, rate limit, or network disconnection, the operator is never blocked on the line; an unverified pending record is created with full audit continuity.
4. **Cryptographic Content Hashing & Append-Only Overrides**:
   Every audit record computes a SHA-256 content hash across all inputs, photos, observations, and decisions. If a warehouse supervisor overrides a verdict, the override is appended as an immutable record linked through a hash chain (`prev_hash` $\to$ `row_hash`), ensuring complete traceability.
5. **Multi-Tenant Row-Level Security**:
   Complete organizational data isolation enforced via Supabase PostgreSQL Row-Level Security (RLS) policies.

---

## 3. Architecture & Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) | Server actions, dynamic route handlers, fast client navigation |
| **Frontend** | React 19, Tailwind CSS v4, Lucide Icons | Responsive tablet & desktop fulfillment interface |
| **Visuals** | WebGL GLSL Canvas Shader | Smooth, lightweight animated daylight aurora canvas background |
| **Camera** | HTML5 `MediaDevices.getUserMedia` | Native live webcam & phone camera viewfinder with frame reticle |
| **Vision Model** | Google Gemini (`gemini-3.5-flash`) | Single-call multimodal carton content observation |
| **Rules Engine** | Pure TypeScript (`lib/agent/rules.ts`) | Deterministic defect classification, thresholds, precedence |
| **Database** | Supabase PostgreSQL + RLS | Isolated multi-tenant storage for orders, captures, analyses, overrides |
| **Integrity** | Web Crypto SHA-256 | Deterministic content hashing and sequential override hash chains |

---

## 4. Setup & Installation

### Prerequisites
- **Node.js**: v22.0.0 or higher (v22 LTS or v24 LTS recommended)
- **npm**: v10+
- **Google Gemini API Key**: from [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Supabase Project** (optional for local in-memory testing; required for cloud database persistence)

### 1. Clone & Install
```bash
git clone https://github.com/Shyamyemuka/cube26-pck-0105-shyamyemuka.git
cd cube26-pck-0105-shyamyemuka
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your credentials in `.env.local`:
```env
# Vision Model
VLM_PROVIDER=gemini
VLM_MODEL=gemini-3.5-flash
VLM_TIMEOUT_MS=20000
GEMINI_API_KEY=your_gemini_api_key_here
PROMPT_VERSION=pack-audit.v1

# Supabase Persistence
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Cross-Pod Evidence API Tokens (comma-separated token:org_id)
EVIDENCE_API_TOKENS=tok_demo_alpha:org_demo_alpha,tok_demo_bravo:org_demo_bravo
```

### 3. Initialize Database Schema & Seed Data
Apply the database schema in your Supabase SQL editor using [`supabase/migrations/0001_init.sql`](file:///D:/Pack%20Manager/supabase/migrations/0001_init.sql), then run the seed script:
```bash
node --env-file=.env.local node_modules/tsx/dist/cli.mjs scripts/seed.ts
```

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Verification & Test Suite
```bash
npx tsc --noEmit           # Type check
npm test                  # 38 unit & regression tests
```

---

## 5. Usage Guide

### A. Packing Station Queue (`/queue`)
- Displays all pending orders awaiting pre-seal audit for the active warehouse tenant (`org_demo_alpha` or `org_demo_bravo`).
- Filter orders by status: `ALL`, `OPEN`, `SEALED`, `STOPPED`, `UNCERTAIN`.
- Search by Order ID, Unit ID, or SKU name.

### B. Order Manifest Ingestion (`/queue/import`)
- Import single or batch orders directly by pasting standardized order manifests:
  ```text
  MUG-BLUE:1;NOTEBOOK-A5-BLACK:2
  ```
- Select tenant (`org_demo_alpha` or `org_demo_bravo`) and fulfillment channel (`shopify`, `amazon_mfn`, `walmart`, or `3pl_client`).
- Persists directly to the Supabase database.

### C. Live Box Photograph Capture (`/units/[unitId]/capture`)
- Review the required packing manifest line items and target quantities.
- **Open Camera**: Activates your smartphone camera or desktop webcam with an on-screen carton framing reticle. Tap shutter to capture.
- **Upload Photo File**: Select pre-captured photos from your local disk or mobile gallery.
- Each photo is automatically resized client-side and fingerprinted with a SHA-256 hash.

### D. Audit Decision & Defect Breakdown (`/units/[unitId]/decision`)
- View the instant verdict:
  - **`SEAL (PASS)`**: Box is safe to ship.
  - **`STOP AND FIX (FAIL)`**: Discrepancies listed in detail (e.g. `missing(MUG-BLUE)`, `short_quantity(NOTEBOOK-A5)`, `extra_item(USB-CABLE)`).
  - **`UNCERTAIN`**: Ambiguous lighting or occlusion flagged.
- Inspect the itemized checks, confidence scores, observation latency, and token usage.
- Supervisors can enter an authorized human override with a mandatory reason code and explanation.

### E. Evidence Record & Hash Chain (`/units/[unitId]/record`)
- View the complete audit record for any unit: photos, timestamps, model observation JSON, execution trace, and sequential override history.
- Verification hash verifies the integrity of the audit record.

### F. Accuracy Benchmarks (`/eval`)
- Inspect frozen benchmark metrics measured across 50 standardized test units evaluated by independent labelers.

---

## 6. Assumptions and Limitations

### Operational Assumptions
1. **Open Carton Visibility**: Items must be physically visible in the open carton. Pack Manager assumes packing dunnage (bubble wrap, air pillows, kraft paper) is placed *around* or *under* items, not completely shrouding them before inspection.
2. **Standard Merchant Channels**: Designed for merchant-fulfilled ecommerce (`shopify`, `amazon_mfn`, `walmart`, `3pl_client`). Amazon FBA is excluded because Amazon packs FBA units in its own fulfillment centers.
3. **Single Model Call Guarantee**: Exactly one batched vision call is made per unit carrying all checks, keeping per-carton cost under \$0.001.

### Limitations
1. **Severe Occlusion**: If items are stacked beneath opaque objects, the vision model cannot see them. The system correctly handles this by emitting `UNCERTAIN` rather than guessing.
2. **Look-Alike Packaging**: Products with nearly identical exterior packaging (e.g. 30ml vs 50ml serum bottles with identical label art) require clear label visibility to differentiate.
3. **Network Dependency**: Live model observation requires internet access to reach the Google Gen AI API. However, the fail-open architecture guarantees warehouse packers are never blocked if the network is interrupted.
4. **Data Integrity Scope**: The system utilizes SHA-256 content hashes and append-only hash chains to ensure edits are detectable within the audit trail; it does not claim external blockchain or hardware-level tamper resistance.

---

## 7. License

Licensed under the MIT License.
