import { describe, it, expect } from 'vitest';
import { evaluate, OrderSnapshot } from '../lib/agent/rules';
import { VlmObservation } from '../lib/agent/schema';
import { DEFAULT_THRESHOLDS } from '../lib/agent/config';

describe('Rules Engine (evaluate)', () => {
  const cfg = DEFAULT_THRESHOLDS;

  // Helper to create a base valid observation
  function makeBaseObs(overrides?: Partial<VlmObservation>): VlmObservation {
    return {
      photo_assessment: {
        usable: true,
        whole_box_visible: true,
        issues: [],
        notes: 'Good photo',
        ...(overrides?.photo_assessment || {}),
      },
      lines: overrides?.lines || [],
      unlisted_items: overrides?.unlisted_items || [],
      overall_notes: overrides?.overall_notes || 'All normal',
    };
  }

  // T1: A:1;B:2 | both seen, qty match, nothing extra, good photo -> SEAL
  it('T1: Order A:1;B:2 - both seen, qty match, nothing extra, good photo -> SEAL', () => {
    const order: OrderSnapshot = {
      order_id: 'ORD-1',
      unit_id: 'UNIT-1',
      channel: 'shopify',
      lines: [
        { sku: 'SKU-A', qty: 1 },
        { sku: 'SKU-B', qty: 2 },
      ],
    };

    const obs = makeBaseObs({
      lines: [
        {
          sku: 'SKU-A',
          matched_item_visible: true,
          observed_qty: 1,
          count_confidence: 0.95,
          visibility: 'clear',
          photo_indexes: [0],
          evidence: 'Item A clearly visible',
        },
        {
          sku: 'SKU-B',
          matched_item_visible: true,
          observed_qty: 2,
          count_confidence: 0.9,
          visibility: 'clear',
          photo_indexes: [0],
          evidence: 'Two items of B visible',
        },
      ],
    });

    const result = evaluate(order, obs, cfg);
    expect(result.verdict).toBe('SEAL');
    expect(result.route).toBe('SEAL');
    expect(result.discrepancies.length).toBe(0);
  });

  // T2: A:1;B:2 | B qty 1, conf 0.9 -> STOP_AND_FIX (short_quantity B)
  it('T2: Order A:1;B:2 - B qty 1, conf 0.9 -> STOP_AND_FIX (short_quantity)', () => {
    const order: OrderSnapshot = {
      order_id: 'ORD-2',
      unit_id: 'UNIT-2',
      channel: 'amazon_mfn',
      lines: [
        { sku: 'SKU-A', qty: 1 },
        { sku: 'SKU-B', qty: 2 },
      ],
    };

    const obs = makeBaseObs({
      lines: [
        {
          sku: 'SKU-A',
          matched_item_visible: true,
          observed_qty: 1,
          count_confidence: 0.95,
          visibility: 'clear',
          photo_indexes: [0],
          evidence: 'Item A',
        },
        {
          sku: 'SKU-B',
          matched_item_visible: true,
          observed_qty: 1,
          count_confidence: 0.9,
          visibility: 'clear',
          photo_indexes: [0],
          evidence: 'Only 1 item B seen',
        },
      ],
    });

    const result = evaluate(order, obs, cfg);
    expect(result.verdict).toBe('STOP_AND_FIX');
    expect(result.discrepancies.some((d) => d.type === 'short_quantity' && d.sku === 'SKU-B')).toBe(true);
  });

  // T3: A:1 | A not seen, whole box visible, conf 0.9 -> STOP_AND_FIX (missing A)
  it('T3: Order A:1 - A not seen, whole box visible, conf 0.9 -> STOP_AND_FIX (missing A)', () => {
    const order: OrderSnapshot = {
      order_id: 'ORD-3',
      unit_id: 'UNIT-3',
      channel: 'walmart',
      lines: [{ sku: 'SKU-A', qty: 1 }],
    };

    const obs = makeBaseObs({
      lines: [
        {
          sku: 'SKU-A',
          matched_item_visible: false,
          observed_qty: 0,
          count_confidence: 0.9,
          visibility: 'not_seen',
          photo_indexes: [0],
          evidence: 'A is not seen in box',
        },
      ],
    });

    const result = evaluate(order, obs, cfg);
    expect(result.verdict).toBe('STOP_AND_FIX');
    expect(result.discrepancies.some((d) => d.type === 'missing' && d.sku === 'SKU-A')).toBe(true);
  });

  // T4: A:1 | A not seen, items_stacked_hidden -> UNCERTAIN
  it('T4: Order A:1 - A not seen, items_stacked_hidden -> UNCERTAIN', () => {
    const order: OrderSnapshot = {
      order_id: 'ORD-4',
      unit_id: 'UNIT-4',
      channel: 'shopify',
      lines: [{ sku: 'SKU-A', qty: 1 }],
    };

    const obs = makeBaseObs({
      photo_assessment: {
        usable: true,
        whole_box_visible: true,
        issues: ['items_stacked_hidden'],
        notes: 'Items stacked',
      },
      lines: [
        {
          sku: 'SKU-A',
          matched_item_visible: false,
          observed_qty: 0,
          count_confidence: 0.9,
          visibility: 'not_seen',
          photo_indexes: [0],
          evidence: 'Cannot see item A',
        },
      ],
    });

    const result = evaluate(order, obs, cfg);
    expect(result.verdict).toBe('UNCERTAIN');
    expect(result.route).toBe('HOLD_RECAPTURE_OR_REVIEW');
  });

  // T5: A:1 | A seen, unlisted item conf 0.9, closest sku null -> STOP_AND_FIX (extra_item)
  it('T5: Order A:1 - A seen, unlisted item conf 0.9, closest sku null -> STOP_AND_FIX (extra_item)', () => {
    const order: OrderSnapshot = {
      order_id: 'ORD-5',
      unit_id: 'UNIT-5',
      channel: 'shopify',
      lines: [{ sku: 'SKU-A', qty: 1 }],
    };

    const obs = makeBaseObs({
      lines: [
        {
          sku: 'SKU-A',
          matched_item_visible: true,
          observed_qty: 1,
          count_confidence: 0.9,
          visibility: 'clear',
          photo_indexes: [0],
          evidence: 'Item A present',
        },
      ],
      unlisted_items: [
        {
          description: 'Phone charger',
          estimated_qty: 1,
          closest_catalogue_sku: null,
          confidence: 0.9,
          photo_indexes: [0],
          evidence: 'Black charger found',
        },
      ],
    });

    const result = evaluate(order, obs, cfg);
    expect(result.verdict).toBe('STOP_AND_FIX');
    expect(result.discrepancies.some((d) => d.type === 'extra_item')).toBe(true);
  });

  // T6: A:1 | A not seen (clear), unlisted conf 0.9 closest=C (in catalogue, not in order) -> STOP_AND_FIX (wrong_item A->C)
  it('T6: Order A:1 - A not seen, unlisted conf 0.9 closest=C -> STOP_AND_FIX (wrong_item A->C)', () => {
    const order: OrderSnapshot = {
      order_id: 'ORD-6',
      unit_id: 'UNIT-6',
      channel: 'shopify',
      lines: [{ sku: 'SKU-A', qty: 1 }],
      catalogue: [
        { sku: 'SKU-A', name: 'Product A' },
        { sku: 'SKU-C', name: 'Product C' },
      ],
    };

    const obs = makeBaseObs({
      lines: [
        {
          sku: 'SKU-A',
          matched_item_visible: false,
          observed_qty: 0,
          count_confidence: 0.9,
          visibility: 'not_seen',
          photo_indexes: [0],
          evidence: 'A not in box',
        },
      ],
      unlisted_items: [
        {
          description: 'Product C box',
          estimated_qty: 1,
          closest_catalogue_sku: 'SKU-C',
          confidence: 0.9,
          photo_indexes: [0],
          evidence: 'Item looks like Product C',
        },
      ],
    });

    const result = evaluate(order, obs, cfg);
    expect(result.verdict).toBe('STOP_AND_FIX');
    expect(
      result.discrepancies.some(
        (d) => d.type === 'wrong_item' && d.sku === 'SKU-A' && d.found_sku === 'SKU-C'
      )
    ).toBe(true);
  });

  // T7: A:2 | A observed 3 conf 0.9 -> STOP_AND_FIX (over_quantity)
  it('T7: Order A:2 - A observed 3 conf 0.9 -> STOP_AND_FIX (over_quantity)', () => {
    const order: OrderSnapshot = {
      order_id: 'ORD-7',
      unit_id: 'UNIT-7',
      channel: 'shopify',
      lines: [{ sku: 'SKU-A', qty: 2 }],
    };

    const obs = makeBaseObs({
      lines: [
        {
          sku: 'SKU-A',
          matched_item_visible: true,
          observed_qty: 3,
          count_confidence: 0.9,
          visibility: 'clear',
          photo_indexes: [0],
          evidence: '3 items seen',
        },
      ],
    });

    const result = evaluate(order, obs, cfg);
    expect(result.verdict).toBe('STOP_AND_FIX');
    expect(result.discrepancies.some((d) => d.type === 'over_quantity' && d.sku === 'SKU-A')).toBe(true);
  });

  // T8: A:1 | A observed 2 conf 0.9 -> STOP_AND_FIX (duplicate)
  it('T8: Order A:1 - A observed 2 conf 0.9 -> STOP_AND_FIX (duplicate)', () => {
    const order: OrderSnapshot = {
      order_id: 'ORD-8',
      unit_id: 'UNIT-8',
      channel: 'shopify',
      lines: [{ sku: 'SKU-A', qty: 1 }],
    };

    const obs = makeBaseObs({
      lines: [
        {
          sku: 'SKU-A',
          matched_item_visible: true,
          observed_qty: 2,
          count_confidence: 0.9,
          visibility: 'clear',
          photo_indexes: [0],
          evidence: '2 units seen for single item order',
        },
      ],
    });

    const result = evaluate(order, obs, cfg);
    expect(result.verdict).toBe('STOP_AND_FIX');
    expect(result.discrepancies.some((d) => d.type === 'duplicate' && d.sku === 'SKU-A')).toBe(true);
  });

  // T9: A:2 | A observed null -> UNCERTAIN (cannot_count)
  it('T9: Order A:2 - A observed null -> UNCERTAIN (cannot_count)', () => {
    const order: OrderSnapshot = {
      order_id: 'ORD-9',
      unit_id: 'UNIT-9',
      channel: 'shopify',
      lines: [{ sku: 'SKU-A', qty: 2 }],
    };

    const obs = makeBaseObs({
      lines: [
        {
          sku: 'SKU-A',
          matched_item_visible: true,
          observed_qty: null,
          count_confidence: 0.5,
          visibility: 'partial',
          photo_indexes: [0],
          evidence: 'Items overlapping, cannot count exact number',
        },
      ],
    });

    const result = evaluate(order, obs, cfg);
    expect(result.verdict).toBe('UNCERTAIN');
    expect(result.route).toBe('HOLD_RECAPTURE_OR_REVIEW');
  });

  // T10: any | usable=false -> UNCERTAIN, all content checks UNCERTAIN
  it('T10: usable=false -> UNCERTAIN, all content checks UNCERTAIN', () => {
    const order: OrderSnapshot = {
      order_id: 'ORD-10',
      unit_id: 'UNIT-10',
      channel: 'shopify',
      lines: [{ sku: 'SKU-A', qty: 1 }, { sku: 'SKU-B', qty: 2 }],
    };

    const obs = makeBaseObs({
      photo_assessment: {
        usable: false,
        whole_box_visible: false,
        issues: ['no_box_visible'],
        notes: 'Blurry floor photo',
      },
    });

    const result = evaluate(order, obs, cfg);
    expect(result.verdict).toBe('UNCERTAIN');
    const contentChecks = result.checks.filter((c) => c.id !== 'photo_quality');
    expect(contentChecks.every((c) => c.status === 'UNCERTAIN')).toBe(true);
  });

  // T11: A:1;B:1 | A qty mismatch FAIL, B UNCERTAIN -> STOP_AND_FIX
  it('T11: A:1;B:1 - A qty mismatch FAIL, B UNCERTAIN -> STOP_AND_FIX', () => {
    const order: OrderSnapshot = {
      order_id: 'ORD-11',
      unit_id: 'UNIT-11',
      channel: 'shopify',
      lines: [{ sku: 'SKU-A', qty: 1 }, { sku: 'SKU-B', qty: 1 }],
    };

    const obs = makeBaseObs({
      lines: [
        {
          sku: 'SKU-A',
          matched_item_visible: true,
          observed_qty: 2, // duplicate FAIL
          count_confidence: 0.9,
          visibility: 'clear',
          photo_indexes: [0],
          evidence: '2 of A',
        },
        {
          sku: 'SKU-B',
          matched_item_visible: true,
          observed_qty: null, // UNCERTAIN
          count_confidence: 0.4,
          visibility: 'partial',
          photo_indexes: [0],
          evidence: 'B partially visible',
        },
      ],
    });

    const result = evaluate(order, obs, cfg);
    expect(result.verdict).toBe('STOP_AND_FIX');
  });

  // T12: A:1 | A PASS, unlisted conf 0.5 -> UNCERTAIN (T_EXTRA_UNSURE <= 0.5 < T_EXTRA)
  it('T12: A:1 - A PASS, unlisted conf 0.5 -> UNCERTAIN', () => {
    const order: OrderSnapshot = {
      order_id: 'ORD-12',
      unit_id: 'UNIT-12',
      channel: 'shopify',
      lines: [{ sku: 'SKU-A', qty: 1 }],
    };

    const obs = makeBaseObs({
      lines: [
        {
          sku: 'SKU-A',
          matched_item_visible: true,
          observed_qty: 1,
          count_confidence: 0.9,
          visibility: 'clear',
          photo_indexes: [0],
          evidence: 'A clear',
        },
      ],
      unlisted_items: [
        {
          description: 'Shadow or item in corner',
          estimated_qty: 1,
          closest_catalogue_sku: null,
          confidence: 0.5, // 0.35 <= 0.5 < 0.70
          photo_indexes: [0],
          evidence: 'Uncertain item',
        },
      ],
    });

    const result = evaluate(order, obs, cfg);
    expect(result.verdict).toBe('UNCERTAIN');
    expect(result.checks.find((c) => c.id === 'no_extra_items')?.status).toBe('UNCERTAIN');
  });

  // T13: A:1 | count_confidence 0.5 on presence -> UNCERTAIN, never SEAL
  it('T13: A:1 - count_confidence 0.5 on presence -> UNCERTAIN, never SEAL', () => {
    const order: OrderSnapshot = {
      order_id: 'ORD-13',
      unit_id: 'UNIT-13',
      channel: 'shopify',
      lines: [{ sku: 'SKU-A', qty: 1 }],
    };

    const obs = makeBaseObs({
      lines: [
        {
          sku: 'SKU-A',
          matched_item_visible: true,
          observed_qty: 1,
          count_confidence: 0.5, // below T_PRESENT = 0.70
          visibility: 'clear',
          photo_indexes: [0],
          evidence: 'Item maybe A',
        },
      ],
    });

    const result = evaluate(order, obs, cfg);
    expect(result.verdict).toBe('UNCERTAIN');
    expect(result.verdict).not.toBe('SEAL');
  });
});
