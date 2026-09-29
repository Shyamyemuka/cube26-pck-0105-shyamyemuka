import { describe, it, expect } from 'vitest';
import { parseOrderLines, formatOrderLines } from '../lib/ingest/parse-lines';

describe('Ingest Line Parser', () => {
  it('parses simple order line string', () => {
    const parsed = parseOrderLines('SKU-A:1;SKU-B:2');
    expect(parsed).toEqual([
      { sku: 'SKU-A', qty: 1 },
      { sku: 'SKU-B', qty: 2 },
    ]);
  });

  it('handles irregular whitespace around delimiters', () => {
    const parsed = parseOrderLines('  SKU-A : 1 ;   SKU-B: 3  ');
    expect(parsed).toEqual([
      { sku: 'SKU-A', qty: 1 },
      { sku: 'SKU-B', qty: 3 },
    ]);
  });

  it('merges duplicate SKUs by adding quantities', () => {
    const parsed = parseOrderLines('SKU-A:1;SKU-B:2;SKU-A:3');
    expect(parsed).toEqual([
      { sku: 'SKU-A', qty: 4 },
      { sku: 'SKU-B', qty: 2 },
    ]);
  });

  it('throws on non-integer or zero or negative quantities', () => {
    expect(() => parseOrderLines('SKU-A:0')).toThrow(/positive integer/);
    expect(() => parseOrderLines('SKU-A:-1')).toThrow(/positive integer/);
    expect(() => parseOrderLines('SKU-A:abc')).toThrow(/positive integer/);
    expect(() => parseOrderLines('SKU-A:1.5')).toThrow(/positive integer/);
  });

  it('throws on empty string or missing SKU', () => {
    expect(() => parseOrderLines('')).toThrow(/empty/);
    expect(() => parseOrderLines('   ')).toThrow(/empty/);
    expect(() => parseOrderLines(':2')).toThrow(/Empty SKU/);
  });

  it('formats order lines to canonical string', () => {
    const str = formatOrderLines([
      { sku: 'ITEM-1', qty: 5 },
      { sku: 'ITEM-2', qty: 1 },
    ]);
    expect(str).toBe('ITEM-1:5;ITEM-2:1');
  });
});
