import { NextRequest, NextResponse } from 'next/server';
import { getOrgFromBearerToken } from '@/lib/evidence/auth';
import { listMemoryUnits, buildEvidenceFromStoreUnit } from '@/lib/data/store';
import { PackEvidenceV1 } from '@/lib/evidence/schema';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const orgId = getOrgFromBearerToken(authHeader);

  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized: invalid or missing Bearer token' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filterUnitId = searchParams.get('unit_id');
  const limit = Math.min(200, parseInt(searchParams.get('limit') || '50', 10));

  const units = listMemoryUnits(orgId);
  const items: PackEvidenceV1[] = [];

  for (const u of units) {
    if (filterUnitId && u.unit_id !== filterUnitId) continue;
    const record = buildEvidenceFromStoreUnit(u);
    if (record) items.push(record);
  }

  return NextResponse.json({
    items: items.slice(0, limit),
    next: null,
  });
}
