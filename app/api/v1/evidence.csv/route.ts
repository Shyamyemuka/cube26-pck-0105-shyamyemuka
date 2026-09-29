import { NextRequest, NextResponse } from 'next/server';
import { getOrgFromBearerToken } from '@/lib/evidence/auth';
import { listMemoryUnits, buildEvidenceFromStoreUnit } from '@/lib/data/store';
import { exportEvidenceToCsv } from '@/lib/evidence/csv';
import { PackEvidenceV1 } from '@/lib/evidence/schema';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const orgId = getOrgFromBearerToken(authHeader);

  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized: invalid or missing Bearer token' }, { status: 401 });
  }

  const units = listMemoryUnits(orgId);
  const records: PackEvidenceV1[] = [];

  for (const u of units) {
    const record = buildEvidenceFromStoreUnit(u);
    if (record) records.push(record);
  }

  const csv = exportEvidenceToCsv(records);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="evidence_${orgId}.csv"`,
    },
  });
}
