import { NextRequest, NextResponse } from 'next/server';
import { getMemoryUnit, saveMemoryUnit } from '@/lib/data/store';
import { computeOverrideRowHash } from '@/lib/evidence/hash';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  try {
    const { unitId } = await params;
    const body = await request.json().catch(() => ({}));
    const orgId = body.org_id || 'org_demo_alpha';

    const unit = getMemoryUnit(orgId, unitId);
    if (!unit || unit.analyses.length === 0) {
      return NextResponse.json({ error: 'Cannot override unit without prior analysis' }, { status: 400 });
    }

    const { new_verdict, reason_code, reason_text, operator_id } = body;

    if (!new_verdict || !['SEAL', 'STOP_AND_FIX'].includes(new_verdict)) {
      return NextResponse.json({ error: 'new_verdict must be SEAL or STOP_AND_FIX' }, { status: 400 });
    }

    const validReasons = [
      'agent_wrong_count',
      'agent_wrong_item',
      'photo_unclear_but_ok',
      'model_unavailable',
      'other',
    ];

    if (!reason_code || !validReasons.includes(reason_code)) {
      return NextResponse.json({ error: 'Invalid reason_code' }, { status: 400 });
    }

    if (reason_code === 'other' && (!reason_text || reason_text.trim().length < 5)) {
      return NextResponse.json(
        { error: 'reason_text must be at least 5 characters when reason_code is other' },
        { status: 400 }
      );
    }

    const latestAnalysis = unit.analyses[unit.analyses.length - 1];

    // Determine prev_hash: either previous override's row_hash or analysis content_hash
    const prevHash =
      unit.overrides.length > 0
        ? unit.overrides[unit.overrides.length - 1].row_hash
        : latestAnalysis.content_hash;

    const createdAt = new Date().toISOString();
    const overrideId = `ovr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const opId = operator_id || 'usr-operator-01';

    const rowHash = computeOverrideRowHash(prevHash, {
      analysis_id: latestAnalysis.id,
      unit_id: unit.unit_id,
      operator_id: opId,
      original_verdict: latestAnalysis.verdict,
      original_route: latestAnalysis.route,
      new_verdict,
      reason_code,
      reason_text: reason_text || '',
      created_at: createdAt,
    });

    const overrideRecord = {
      id: overrideId,
      created_at: createdAt,
      operator_id: opId,
      original_verdict: latestAnalysis.verdict,
      original_route: latestAnalysis.route,
      new_verdict,
      reason_code,
      reason_text: reason_text || '',
      prev_hash: prevHash,
      row_hash: rowHash,
    };

    unit.overrides.push(overrideRecord);
    unit.status = 'overridden';
    saveMemoryUnit(unit);

    return NextResponse.json({
      success: true,
      override: overrideRecord,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
