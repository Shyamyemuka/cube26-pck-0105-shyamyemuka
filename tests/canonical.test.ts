import { describe, it, expect } from 'vitest';
import { canonicalJson } from '../lib/evidence/canonical';
import { computeAnalysisContentHash, computeOverrideRowHash, sha256Hex } from '../lib/evidence/hash';

describe('Canonical JSON & Hashing', () => {
  it('produces identical output regardless of object key order', () => {
    const obj1 = { b: 2, a: 1, c: { y: 'test', x: 10 } };
    const obj2 = { c: { x: 10, y: 'test' }, a: 1, b: 2 };

    const c1 = canonicalJson(obj1);
    const c2 = canonicalJson(obj2);

    expect(c1).toBe(c2);
    expect(c1).toBe('{"a":1,"b":2,"c":{"x":10,"y":"test"}}');
    expect(sha256Hex(c1)).toBe(sha256Hex(c2));
  });

  it('omits undefined fields properly', () => {
    const objWithUndef = { a: 1, b: undefined, c: null };
    const objWithoutUndef = { a: 1, c: null };

    expect(canonicalJson(objWithUndef)).toBe(canonicalJson(objWithoutUndef));
    expect(canonicalJson(objWithUndef)).toBe('{"a":1,"c":null}');
  });

  it('computes stable analysis content hash', () => {
    const payload = {
      unit_id: 'UNIT-001',
      order_snapshot: { sku: 'A', qty: 1 },
      photos: [{ sha256: 'abc123' }],
      observation: { note: 'ok' },
      checks: [{ id: 'line.presence.A', status: 'PASS' }],
      discrepancies: [],
      verdict: 'SEAL',
      route: 'SEAL',
      status: 'decided',
      trace: { latency: 120 },
    };

    const hash1 = computeAnalysisContentHash(payload);
    const hash2 = computeAnalysisContentHash({
      ...payload,
      trace: { latency: 120 }, // same content
    });

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('chains override hashes sequentially', () => {
    const prevHash = 'hash000000000000000000000000000000000000000000000000000000000000';
    const overridePayload = {
      analysis_id: 'ana-1',
      unit_id: 'UNIT-001',
      operator_id: 'user-1',
      original_verdict: 'STOP_AND_FIX',
      original_route: 'STOP_AND_FIX',
      new_verdict: 'SEAL',
      reason_code: 'agent_wrong_count',
      reason_text: 'Counted 2 units correctly by hand',
      created_at: '2026-09-30T10:00:00Z',
    };

    const rowHash1 = computeOverrideRowHash(prevHash, overridePayload);
    expect(rowHash1).toHaveLength(64);

    // Chaining second override
    const overridePayload2 = {
      ...overridePayload,
      reason_text: 'Second review confirmed',
      created_at: '2026-09-30T10:05:00Z',
    };
    const rowHash2 = computeOverrideRowHash(rowHash1, overridePayload2);
    expect(rowHash2).toHaveLength(64);
    expect(rowHash2).not.toBe(rowHash1);
  });
});
