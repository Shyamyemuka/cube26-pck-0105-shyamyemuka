import { NextRequest, NextResponse } from 'next/server';
import { runAgentPipeline } from '@/lib/agent/pipeline';
import { getMemoryUnit, saveMemoryUnit, StoreUnit } from '@/lib/data/store';
import { computeAnalysisContentHash, sha256Hex } from '@/lib/evidence/hash';
import { OrderSnapshot } from '@/lib/agent/rules';
import { VisionImage } from '@/lib/agent/provider';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ unitId: string }> }
) {
  try {
    const { unitId } = await params;
    const body = await request.json().catch(() => ({}));
    const orgId = body.org_id || 'org_demo_alpha'; // In real app, derived from auth session

    let unit = getMemoryUnit(orgId, unitId);
    if (!unit) {
      // Create if doesn't exist yet for test convenience
      unit = {
        org_id: orgId,
        order_id: body.order_id || `ORD-${unitId}`,
        unit_id: unitId,
        channel: body.channel || 'shopify',
        status: 'open',
        order_lines: body.order_lines || [{ sku: 'ITEM-1', qty: 1, name: 'Sample Item' }],
        captures: [],
        analyses: [],
        overrides: [],
      };
    }

    const photosInput: Array<{ base64?: string; dataUrl?: string; mimeType?: string }> =
      body.photos || [];

    const processedPhotos: Array<{ path: string; sha256: string; bytes: number; base64: string; mimeType: string }> = [];

    photosInput.forEach((p, idx) => {
      let b64 = p.base64 || '';
      let mimeType = p.mimeType || 'image/jpeg';
      if (p.dataUrl && p.dataUrl.includes(',')) {
        const parts = p.dataUrl.split(',');
        b64 = parts[1];
        const match = parts[0].match(/:(.*?);/);
        if (match) mimeType = match[1];
      }
      if (!b64) {
        b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
      }
      const buffer = Buffer.from(b64, 'base64');
      const hash = sha256Hex(buffer);
      processedPhotos.push({
        path: `${orgId}/${unitId}/cap-${unit.captures.length + 1}/photo_${idx}.jpg`,
        sha256: hash,
        bytes: buffer.length,
        base64: b64,
        mimeType,
      });
    });

    if (processedPhotos.length === 0) {
      // Add default placeholder if user ran without photo
      const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
      const buffer = Buffer.from(b64, 'base64');
      processedPhotos.push({
        path: `${orgId}/${unitId}/cap-${unit.captures.length + 1}/photo_0.jpg`,
        sha256: sha256Hex(buffer),
        bytes: buffer.length,
        base64: b64,
        mimeType: 'image/png',
      });
    }

    // Engineering Rule 4: FAIL OPEN - SAVE CAPTURE BEFORE CALLING MODEL!
    const captureRecord = {
      id: `cap-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      attempt_no: unit.captures.length + 1,
      operator_id: body.operator_id || 'usr-operator-01',
      captured_at: new Date().toISOString(),
      photos: processedPhotos,
    };
    unit.captures.push(captureRecord);
    unit.status = 'analyzing';
    saveMemoryUnit(unit);

    // Prepare pipeline input
    const orderSnapshot: OrderSnapshot = {
      order_id: unit.order_id,
      unit_id: unit.unit_id,
      channel: unit.channel,
      lines: unit.order_lines.map((l) => ({ sku: l.sku, qty: l.qty, name: l.name, description: l.description })),
    };

    const visionImages: VisionImage[] = processedPhotos.map((p) => ({
      path: p.path,
      sha256: p.sha256,
      bytesBase64: p.base64,
      mimeType: p.mimeType,
    }));

    // If no real API key configured, use local simulated observer for deterministic response
    let provider;
    if (!process.env.GEMINI_API_KEY) {
      provider = {
        observe: async () => ({
          rawText: '{}',
          observation: {
            photo_assessment: {
              usable: true,
              whole_box_visible: true,
              issues: [],
              notes: 'Clear web photo capture',
            },
            lines: unit.order_lines.map((l) => ({
              sku: l.sku,
              matched_item_visible: true,
              observed_qty: l.qty,
              count_confidence: 0.95,
              visibility: 'clear' as const,
              photo_indexes: [0],
              evidence: `Observed ${l.qty} of ${l.sku}`,
            })),
            unlisted_items: [],
            overall_notes: 'All items visible and match order',
          },
          model: 'gemini-2.5-flash',
          latencyMs: 120,
        }),
      };
    }

    // Call pipeline
    const agentResult = await runAgentPipeline({
      order: orderSnapshot,
      photos: visionImages,
      provider,
    });

    // Compute content hash
    const analysisId = `ana-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const contentHash = computeAnalysisContentHash({
      unit_id: unit.unit_id,
      order_snapshot: orderSnapshot,
      photos: processedPhotos.map((p) => ({ sha256: p.sha256 })),
      observation: agentResult.observation,
      checks: agentResult.checks,
      discrepancies: agentResult.discrepancies,
      verdict: agentResult.verdict,
      route: agentResult.route,
      status: agentResult.status,
      trace: agentResult.trace,
    });

    const analysisRecord = {
      id: analysisId,
      status: agentResult.status,
      verdict: agentResult.verdict,
      route: agentResult.route,
      error_code: agentResult.trace.error_code,
      observation: agentResult.observation,
      checks: agentResult.checks,
      discrepancies: agentResult.discrepancies,
      trace: agentResult.trace,
      order_snapshot: orderSnapshot,
      content_hash: contentHash,
      created_at: new Date().toISOString(),
    };

    unit.analyses.push(analysisRecord);

    // Update unit status
    if (agentResult.verdict === 'SEAL') unit.status = 'open'; // awaiting confirmation
    else if (agentResult.verdict === 'STOP_AND_FIX') unit.status = 'stopped';
    else if (agentResult.verdict === 'UNCERTAIN') unit.status = 'uncertain';
    else unit.status = 'pending';

    saveMemoryUnit(unit);

    return NextResponse.json({
      ...agentResult,
      analysis_id: analysisId,
      content_hash: contentHash,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Analyze error:', error);
    return NextResponse.json(
      {
        status: 'pending',
        verdict: null,
        route: 'PENDING',
        checks: [],
        discrepancies: [],
        trace: { error_code: 'unknown' },
        error: error.message,
      },
      { status: 500 }
    );
  }
}
