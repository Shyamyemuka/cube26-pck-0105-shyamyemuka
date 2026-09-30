import { describe, it, expect } from 'vitest';
import { getMemoryUnit, saveMemoryUnit, listMemoryUnits } from '../lib/data/store';

describe('Unit Persistence Store', () => {
  it('pre-populates demo units for org_demo_alpha and org_demo_bravo', () => {
    const alphaUnits = listMemoryUnits('org_demo_alpha');
    const bravoUnits = listMemoryUnits('org_demo_bravo');

    expect(alphaUnits.length).toBeGreaterThanOrEqual(3);
    expect(bravoUnits.length).toBeGreaterThanOrEqual(1);

    expect(alphaUnits.some((u) => u.unit_id === 'UNIT-5001')).toBe(true);
    expect(bravoUnits.some((u) => u.unit_id === 'UNIT-5006')).toBe(true);
  });

  it('saves and retrieves a newly imported order unit with custom SKUs', () => {
    const customUnitId = `TEST-UNIT-${Date.now()}`;
    const customOrgId = 'org_demo_alpha';

    saveMemoryUnit({
      org_id: customOrgId,
      order_id: 'ORD-CUSTOM-99',
      unit_id: customUnitId,
      channel: 'shopify',
      status: 'open',
      order_lines: [
        { sku: 'MUG-BLUE', qty: 1, name: 'Ceramic Blue Mug' },
        { sku: 'NOTEBOOK-A5-BLACK', qty: 2, name: 'Notebook Black' },
      ],
      captures: [],
      analyses: [],
      overrides: [],
    });

    const retrieved = getMemoryUnit(customOrgId, customUnitId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.order_id).toBe('ORD-CUSTOM-99');
    expect(retrieved?.order_lines).toHaveLength(2);
    expect(retrieved?.order_lines[0]).toEqual({
      sku: 'MUG-BLUE',
      qty: 1,
      name: 'Ceramic Blue Mug',
    });
    expect(retrieved?.order_lines[1]).toEqual({
      sku: 'NOTEBOOK-A5-BLACK',
      qty: 2,
      name: 'Notebook Black',
    });

    const updatedList = listMemoryUnits(customOrgId);
    expect(updatedList.some((u) => u.unit_id === customUnitId)).toBe(true);
  });

  it('enforces org tenancy isolation in memory store', () => {
    const unitId = `ISO-UNIT-${Date.now()}`;
    saveMemoryUnit({
      org_id: 'org_demo_alpha',
      order_id: 'ORD-ISO',
      unit_id: unitId,
      channel: 'shopify',
      status: 'open',
      order_lines: [{ sku: 'SKU-A', qty: 1 }],
      captures: [],
      analyses: [],
      overrides: [],
    });

    expect(getMemoryUnit('org_demo_alpha', unitId)).toBeDefined();
    expect(getMemoryUnit('org_demo_bravo', unitId)).toBeUndefined();
  });
});
