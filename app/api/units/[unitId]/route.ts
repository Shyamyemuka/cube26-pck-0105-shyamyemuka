import { NextRequest, NextResponse } from 'next/server';
import { getMemoryUnit } from '@/lib/data/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  const { unitId } = await params;
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('org_id') || 'org_demo_alpha';

  const unit = getMemoryUnit(orgId, unitId);
  if (!unit) {
    return NextResponse.json({ error: `Unit ${unitId} not found for org ${orgId}` }, { status: 404 });
  }

  return NextResponse.json({ unit });
}
