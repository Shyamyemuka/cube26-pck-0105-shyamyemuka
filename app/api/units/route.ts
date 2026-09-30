import { NextRequest, NextResponse } from 'next/server';
import { listMemoryUnits, saveMemoryUnit, StoreUnit } from '@/lib/data/store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('org_id') || 'org_demo_alpha';

  const units = listMemoryUnits(orgId);
  return NextResponse.json({ units });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const orgId = body.org_id || 'org_demo_alpha';
    const orderId = body.order_id || `ORD-${Date.now().toString().slice(-4)}`;
    const unitId = body.unit_id || `UNIT-${Date.now().toString().slice(-4)}`;
    const channel = body.channel || 'shopify';
    const orderLines: Array<{ sku: string; qty: number; name?: string; description?: string }> =
      body.order_lines || [];

    if (orderLines.length === 0) {
      return NextResponse.json({ error: 'order_lines cannot be empty' }, { status: 400 });
    }

    const newUnit: StoreUnit = {
      org_id: orgId,
      order_id: orderId,
      unit_id: unitId,
      channel,
      status: 'open',
      order_lines: orderLines.map((l) => ({
        sku: l.sku,
        qty: l.qty,
        name: l.name || l.sku,
        description: l.description || '',
      })),
      captures: [],
      analyses: [],
      overrides: [],
    };

    saveMemoryUnit(newUnit);

    return NextResponse.json({ success: true, unit: newUnit });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
