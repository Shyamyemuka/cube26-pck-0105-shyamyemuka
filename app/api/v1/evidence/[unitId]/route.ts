import { NextRequest, NextResponse } from 'next/server';
import { getOrgFromBearerToken } from '@/lib/evidence/auth';
import { getMemoryUnit, buildEvidenceFromStoreUnit } from '@/lib/data/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  const authHeader = request.headers.get('authorization');
  const orgId = getOrgFromBearerToken(authHeader);

  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized: invalid or missing Bearer token' }, { status: 401 });
  }

  const { unitId } = await params;
  const unit = getMemoryUnit(orgId, unitId);

  if (!unit) {
    return NextResponse.json({ error: 'Evidence record not found' }, { status: 404 });
  }

  const record = buildEvidenceFromStoreUnit(unit);
  if (!record) {
    return NextResponse.json({ error: 'No analyzed evidence found for unit' }, { status: 404 });
  }

  return NextResponse.json(record);
}
