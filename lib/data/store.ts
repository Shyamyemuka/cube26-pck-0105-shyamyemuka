import { createAdminClient } from '../supabase/admin';
import { PackEvidenceV1 } from '../evidence/schema';
import { buildEvidenceRecord } from '../evidence/build';
import { DEFAULT_THRESHOLDS } from '../agent/config';

// In-memory fallback cache for development/demo when live DB is unavailable
export interface StoreUnit {
  order_id: string;
  unit_id: string;
  channel: 'amazon_mfn' | 'shopify' | 'walmart' | '3pl_client';
  status: 'open' | 'analyzing' | 'sealed' | 'stopped' | 'uncertain' | 'pending' | 'overridden';
  org_id: string;
  order_lines: Array<{ sku: string; qty: number; name?: string; description?: string }>;
  captures: Array<{
    id: string;
    attempt_no: number;
    operator_id: string;
    captured_at: string;
    photos: Array<{ path: string; sha256: string; bytes?: number; base64?: string }>;
  }>;
  analyses: Array<{
    id: string;
    status: 'decided' | 'pending';
    verdict: 'SEAL' | 'STOP_AND_FIX' | 'UNCERTAIN' | null;
    route: 'SEAL' | 'STOP_AND_FIX' | 'HOLD_RECAPTURE_OR_REVIEW' | 'PENDING';
    error_code?: string;
    observation: any;
    checks: any[];
    discrepancies: any[];
    trace: any;
    order_snapshot: any;
    content_hash: string;
    created_at: string;
  }>;
  overrides: Array<{
    id: string;
    created_at: string;
    operator_id: string;
    original_verdict: 'SEAL' | 'STOP_AND_FIX' | 'UNCERTAIN' | null;
    original_route: string;
    new_verdict: 'SEAL' | 'STOP_AND_FIX';
    reason_code: 'agent_wrong_count' | 'agent_wrong_item' | 'photo_unclear_but_ok' | 'model_unavailable' | 'other';
    reason_text: string;
    prev_hash: string;
    row_hash: string;
  }>;
}

// Global in-memory map keyed by `${org_id}:${unit_id}`
const memoryStore = new Map<string, StoreUnit>();

// Pre-populate with initial demo orders
function initDemoMemoryStore() {
  if (memoryStore.size > 0) return;

  const demoItems: StoreUnit[] = [
    {
      org_id: 'org_demo_alpha',
      order_id: 'ORD-5001',
      unit_id: 'UNIT-5001',
      channel: 'shopify',
      status: 'open',
      order_lines: [
        { sku: 'MUG-BLUE', qty: 1, name: 'Ceramic Blue Coffee Mug' },
        { sku: 'NOTEBOOK-A5-BLACK', qty: 1, name: 'Hardcover A5 Notebook - Black' },
      ],
      captures: [],
      analyses: [],
      overrides: [],
    },
    {
      org_id: 'org_demo_alpha',
      order_id: 'ORD-5002',
      unit_id: 'UNIT-5002',
      channel: 'amazon_mfn',
      status: 'open',
      order_lines: [
        { sku: 'CHARGER-65W', qty: 1, name: '65W USB-C Fast Charger' },
        { sku: 'PEN-PACK', qty: 2, name: 'Black Gel Pens Pack of 3' },
      ],
      captures: [],
      analyses: [],
      overrides: [],
    },
    {
      org_id: 'org_demo_alpha',
      order_id: 'ORD-5003',
      unit_id: 'UNIT-5003',
      channel: 'walmart',
      status: 'open',
      order_lines: [
        { sku: 'BOTTLE-WATER-SILVER', qty: 1, name: 'Insulated Water Bottle - Silver' },
        { sku: 'SOCKS-PAIR', qty: 2, name: 'Cotton Crew Socks Pair' },
      ],
      captures: [],
      analyses: [],
      overrides: [],
    },
    {
      org_id: 'org_demo_bravo',
      order_id: 'ORD-5006',
      unit_id: 'UNIT-5006',
      channel: 'amazon_mfn',
      status: 'open',
      order_lines: [
        { sku: 'NOTEBOOK-A5-NAVY', qty: 1, name: 'Hardcover A5 Notebook - Navy Blue' },
        { sku: 'PEN-PACK', qty: 1, name: 'Black Gel Pens Pack of 3' },
      ],
      captures: [],
      analyses: [],
      overrides: [],
    },
  ];

  for (const item of demoItems) {
    memoryStore.set(`${item.org_id}:${item.unit_id}`, item);
  }
}

initDemoMemoryStore();

export function getMemoryUnit(orgId: string, unitId: string): StoreUnit | undefined {
  initDemoMemoryStore();
  return memoryStore.get(`${orgId}:${unitId}`);
}

export function saveMemoryUnit(unit: StoreUnit) {
  initDemoMemoryStore();
  memoryStore.set(`${unit.org_id}:${unit.unit_id}`, unit);
}

export function listMemoryUnits(orgId: string): StoreUnit[] {
  initDemoMemoryStore();
  return Array.from(memoryStore.values()).filter((u) => u.org_id === orgId);
}

export function buildEvidenceFromStoreUnit(unit: StoreUnit): PackEvidenceV1 | null {
  if (unit.captures.length === 0 || unit.analyses.length === 0) {
    return null;
  }

  const latestCapture = unit.captures[unit.captures.length - 1];
  const latestAnalysis = unit.analyses[unit.analyses.length - 1];

  const orderLinesStr = unit.order_lines.map((l) => `${l.sku}:${l.qty}`).join(';');

  return buildEvidenceRecord({
    orgId: unit.org_id,
    unitId: unit.unit_id,
    orderId: unit.order_id,
    channel: unit.channel,
    orderLinesStr,
    capture: latestCapture,
    analysis: latestAnalysis,
    overrides: unit.overrides,
  });
}
