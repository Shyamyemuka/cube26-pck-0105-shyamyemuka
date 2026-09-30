import { NextRequest, NextResponse } from 'next/server';
import { listMemoryUnits, saveMemoryUnit, StoreUnit } from '@/lib/data/store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('org_id') || 'org_demo_alpha';

  const units = listMemoryUnits(orgId);
  return NextResponse.json({
    units,
    total: units.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orgId = body.org_id || 'org_demo_alpha';
    const unitId = body.unit_id || `UNIT-${Date.now().toString().slice(-6)}`;
    const orderId = body.order_id || `ORD-${unitId}`;
    const channel = body.channel || 'shopify';
    const orderLines = body.order_lines || [];

    if (!Array.isArray(orderLines) || orderLines.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one order line with sku and qty' },
        { status: 400 }
      );
    }

    const newUnit: StoreUnit = {
      org_id: orgId,
      unit_id: unitId,
      order_id: orderId,
      channel,
      status: 'open',
      order_lines: orderLines.map((line: any) => ({
        sku: String(line.sku).trim(),
        qty: Number(line.qty) || 1,
        name: line.name ? String(line.name).trim() : undefined,
        description: line.description ? String(line.description).trim() : undefined,
      })),
      captures: [],
      analyses: [],
      overrides: [],
    };

    saveMemoryUnit(newUnit);

    return NextResponse.json({
      success: true,
      unit: newUnit,
    });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ error: e.message || 'Failed to create unit' }, { status: 500 });
  }
}
