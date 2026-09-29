import { NextRequest, NextResponse } from 'next/server';
import { getOrgFromBearerToken } from '@/lib/evidence/auth';
import { getMemoryUnit } from '@/lib/data/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ unitId: string; index: string }> }
) {
  const authHeader = request.headers.get('authorization');
  const orgId = getOrgFromBearerToken(authHeader);

  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized: invalid or missing Bearer token' }, { status: 401 });
  }

  const { unitId, index } = await params;
  const unit = getMemoryUnit(orgId, unitId);

  if (!unit || unit.captures.length === 0) {
    return NextResponse.json({ error: 'Unit or photo not found' }, { status: 404 });
  }

  const photoIdx = parseInt(index, 10);
  const latestCap = unit.captures[unit.captures.length - 1];
  const photo = latestCap.photos[photoIdx];

  if (!photo) {
    return NextResponse.json({ error: 'Photo index out of range' }, { status: 404 });
  }

  // If live Supabase storage is used, return 302 redirect to signed URL:
  // const { data } = await supabase.storage.from('captures').createSignedUrl(photo.path, 60);
  // return NextResponse.redirect(data.signedUrl);

  return NextResponse.json({
    ref: photo.path,
    sha256: photo.sha256,
    url: `/api/photos/view?ref=${encodeURIComponent(photo.path)}`,
  });
}
