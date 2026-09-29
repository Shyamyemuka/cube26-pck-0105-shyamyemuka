import { describe, it, expect } from 'vitest';
import { buildEvidenceRecord } from '../lib/evidence/build';
import { exportEvidenceToCsv, CSV_COLUMNS } from '../lib/evidence/csv';
import { PackEvidenceV1Schema } from '../lib/evidence/schema';
import { DEFAULT_THRESHOLDS } from '../lib/agent/config';

describe('Evidence Contract (pack_evidence.v1)', () => {
  const baseInput = {
    orgId: 'org_demo_alpha',
    unitId: 'UNIT-0042',
    orderId: 'ORD-1234',
    channel: 'amazon_mfn' as const,
    orderLinesStr: 'SKU-A:1;SKU-B:2',
    capture: {
      id: 'cap-1111-2222',
      attempt_no: 1,
      operator_id: 'usr-0001',
      captured_at: '2026-09-30T08:15:22Z',
      photos: [
        {
          path: 'org_demo_alpha/UNIT-0042/cap-1/photo1.jpg',
          sha256: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
          bytes: 231044,
        },
      ],
    },
    analysis: {
      id: 'ana-3333-4444',
      status: 'decided' as const,
      verdict: 'STOP_AND_FIX' as const,
      route: 'STOP_AND_FIX' as const,
      observation: {
        photo_assessment: {
          usable: true,
          whole_box_visible: true,
          issues: [],
          notes: 'Clear photo',
        },
        lines: [
          {
            sku: 'SKU-A',
            matched_item_visible: true,
            observed_qty: 1,
            count_confidence: 0.95,
            visibility: 'clear' as const,
            photo_indexes: [0],
            evidence: 'SKU-A visible',
          },
          {
            sku: 'SKU-B',
            matched_item_visible: true,
            observed_qty: 1,
            count_confidence: 0.88,
            visibility: 'clear' as const,
            photo_indexes: [0],
            evidence: 'Only 1 of SKU-B visible',
          },
        ],
        unlisted_items: [],
        overall_notes: '',
      },
      checks: [
        {
          id: 'line.quantity.SKU-B',
          scope: 'line' as const,
          sku: 'SKU-B',
          status: 'FAIL' as const,
          reason: 'Expected 2, saw 1 (conf 0.88)',
          confidence: 0.88,
        },
        {
          id: 'no_extra_items',
          scope: 'global' as const,
          status: 'PASS' as const,
          reason: 'none seen, full view',
        },
      ],
      discrepancies: [
        {
          type: 'short_quantity' as const,
          sku: 'SKU-B',
          expected_qty: 2,
          observed_qty: 1,
          detail: 'Expected 2, saw 1',
        },
      ],
      trace: {
        model: 'gemini-2.5-flash',
        prompt_version: 'pack-audit.v1',
        thresholds: DEFAULT_THRESHOLDS,
        latency_ms: 1250,
      },
      content_hash: 'c1d2e3f4a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    },
  };

  it('1. Record validates against Zod schema', () => {
    const record = buildEvidenceRecord(baseInput);
    const parsed = PackEvidenceV1Schema.safeParse(record);
    expect(parsed.success).toBe(true);
    expect(record.schema).toBe('pack_evidence.v1');
    expect(record.record_id.startsWith('PCK-')).toBe(true);
  });

  it('2. CSV header equals the specified contract columns', () => {
    const record = buildEvidenceRecord(baseInput);
    const csv = exportEvidenceToCsv([record]);
    const firstLine = csv.split('\n')[0];
    expect(firstLine).toBe(CSV_COLUMNS.join(','));
  });

  it('3. Override present => verdict unchanged, effective_verdict changed, override listed', () => {
    const inputWithOverride = {
      ...baseInput,
      overrides: [
        {
          created_at: '2026-09-30T08:18:00Z',
          operator_id: 'usr-0002',
          original_verdict: 'STOP_AND_FIX' as const,
          new_verdict: 'SEAL' as const,
          reason_code: 'agent_wrong_count' as const,
          reason_text: 'Second unit was under tissue paper',
          row_hash: '9988776655443322110099887766554433221100998877665544332211009988',
        },
      ],
    };

    const record = buildEvidenceRecord(inputWithOverride);
    expect(record.verdict).toBe('STOP_AND_FIX'); // original agent verdict preserved!
    expect(record.effective_verdict).toBe('SEAL'); // effective verdict adjusted
    expect(record.overrides.length).toBe(1);
    expect(record.overrides[0].reason_code).toBe('agent_wrong_count');
  });

  it('5. No field contains secrets (SUPABASE, sk-, AIza) or signed URL tokens', () => {
    const record = buildEvidenceRecord(baseInput);
    const serialized = JSON.stringify(record);

    expect(serialized).not.toMatch(/SUPABASE/i);
    expect(serialized).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
    expect(serialized).not.toMatch(/AIza[a-zA-Z0-9_-]{20,}/);
    expect(serialized).not.toMatch(/token=/i);
    expect(serialized).not.toMatch(/apikey=/i);
  });
});
