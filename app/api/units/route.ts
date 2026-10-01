import { NextRequest, NextResponse } from 'next/server';
import { listMemoryUnits, saveMemoryUnit, getMemoryUnit, StoreUnit } from '@/lib/data/store';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('org_id') || 'org_demo_alpha';

  // Synchronize orders from Supabase if configured
  try {
    const supabase = createAdminClient();
    const { data: dbOrders } = await supabase
      .from('orders')
      .select('*, order_lines(*)')
      .eq('org_id', orgId);

    if (dbOrders && dbOrders.length > 0) {
      for (const o of dbOrders) {
        if (!getMemoryUnit(orgId, o.unit_id)) {
          saveMemoryUnit({
            org_id: o.org_id,
            unit_id: o.unit_id,
            order_id: o.order_id,
            channel: o.channel as any,
            status: o.status as any,
            order_lines: (o.order_lines || []).map((l: any) => ({
              sku: l.sku,
              qty: l.qty,
            })),
            captures: [],
            analyses: [],
            overrides: [],
          });
        }
      }
    }
  } catch (e) {
    // Fall back smoothly to memory store if DB is offline
  }

  const units = listMemoryUnits(orgId);
  return NextResponse.json({
    units,
    total: units.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
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

    // Persist directly to Supabase
    try {
      const supabase = createAdminClient();
      await supabase.from('orders').upsert({
        org_id: newUnit.org_id,
        order_id: newUnit.order_id,
        unit_id: newUnit.unit_id,
        channel: newUnit.channel,
        status: newUnit.status,
      }, { onConflict: 'org_id,order_id' });

      if (newUnit.order_lines.length > 0) {
        const linesPayload = newUnit.order_lines.map((l) => ({
          org_id: newUnit.org_id,
          order_id: newUnit.order_id,
          sku: l.sku,
          qty: l.qty,
        }));
        await supabase.from('order_lines').upsert(linesPayload, { onConflict: 'org_id,order_id,sku' });
      }
    } catch (dbErr) {
      console.warn('[Supabase Sync Warning]:', dbErr);
    }

    return NextResponse.json({
      success: true,
      unit: newUnit,
    });
  } catch (err: unknown) {
    const e = err as Error;
    return NextResponse.json({ error: e.message || 'Failed to create unit' }, { status: 500 });
  }
}
