import { NextRequest, NextResponse } from 'next/server';
import { getMemoryUnit, saveMemoryUnit } from '@/lib/data/store';
import { computeOverrideRowHash } from '@/lib/evidence/hash';
import { createAdminClient } from '@/lib/supabase/admin';

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

    // Persist override directly to Supabase
    try {
      const supabase = createAdminClient();

      // 1. Update order status
      await supabase
        .from('orders')
        .update({ status: 'overridden' })
        .eq('org_id', unit.org_id)
        .eq('order_id', unit.order_id);

      // 2. Fetch valid operator user ID from profiles for foreign key
      const { data: userProfiles } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('org_id', unit.org_id)
        .limit(1);

      const opUserId =
        userProfiles && userProfiles.length > 0
          ? userProfiles[0].user_id
          : '70738be9-5881-4559-8359-53be276c3e3a';

      // 3. Find latest analysis UUID in Supabase
      const { data: analysisRows } = await supabase
        .from('analyses')
        .select('id')
        .eq('org_id', unit.org_id)
        .eq('unit_id', unit.unit_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (analysisRows && analysisRows.length > 0) {
        await supabase.from('overrides').insert({
          org_id: unit.org_id,
          analysis_id: analysisRows[0].id,
          unit_id: unit.unit_id,
          operator_id: opUserId,
          original_verdict: latestAnalysis.verdict,
          original_route: latestAnalysis.route,
          new_verdict,
          reason_code,
          reason_text: reason_text || '',
          prev_hash: prevHash,
          row_hash: rowHash,
        });
      }
    } catch (dbErr) {
      console.warn('[Supabase Sync Override Warning]:', dbErr);
    }

    return NextResponse.json({
      success: true,
      override: overrideRecord,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
