import { PackEvidenceV1, PackEvidenceV1Schema } from './schema';
import { VlmObservation } from '../agent/schema';
import { Thresholds } from '../agent/config';

export interface BuildEvidenceInput {
  orgId: string;
  unitId: string;
  orderId: string;
  channel: 'amazon_mfn' | 'shopify' | 'walmart' | '3pl_client';
  orderLinesStr: string;
  capture: {
    id: string;
    attempt_no: number;
    operator_id: string;
    captured_at: string;
    photos: Array<{ path: string; sha256: string; bytes?: number }>;
  };
  analysis: {
    id: string;
    status: 'decided' | 'pending';
    verdict: 'SEAL' | 'STOP_AND_FIX' | 'UNCERTAIN' | null;
    route: 'SEAL' | 'STOP_AND_FIX' | 'HOLD_RECAPTURE_OR_REVIEW' | 'PENDING';
    observation: VlmObservation | null;
    checks: Array<{
      id: string;
      scope: 'line' | 'global';
      sku?: string;
      status: 'PASS' | 'FAIL' | 'UNCERTAIN';
      reason: string;
      confidence?: number;
    }>;
    discrepancies: Array<{
      type: 'missing' | 'short_quantity' | 'over_quantity' | 'duplicate' | 'extra_item' | 'wrong_item';
      sku: string | null;
      found_sku?: string | null;
      expected_qty?: number;
      observed_qty?: number | null;
      detail: string;
    }>;
    trace: {
      model: string;
      prompt_version: string;
      thresholds: Thresholds;
      latency_ms: number;
    };
    content_hash: string;
  };
  overrides?: Array<{
    created_at: string;
    operator_id: string;
    original_verdict: 'SEAL' | 'STOP_AND_FIX' | 'UNCERTAIN' | null;
    new_verdict: 'SEAL' | 'STOP_AND_FIX';
    reason_code: 'agent_wrong_count' | 'agent_wrong_item' | 'photo_unclear_but_ok' | 'model_unavailable' | 'other';
    reason_text: string;
    row_hash: string;
  }>;
}

export function buildEvidenceRecord(input: BuildEvidenceInput): PackEvidenceV1 {
  const { orgId, unitId, orderId, channel, orderLinesStr, capture, analysis } = input;
  const overrides = input.overrides || [];

  // Derive record_id from first 8 chars of analysis id
  const hexPart = analysis.id.replace(/-/g, '').substring(0, 8).toUpperCase();
  const recordId = `PCK-${hexPart}`;

  // Derive observed_in_box hint
  const observedParts: string[] = [];
  const obs = analysis.observation;
  const tCount = analysis.trace.thresholds.T_COUNT;

  if (obs && obs.lines) {
    for (const line of obs.lines) {
      if (line.count_confidence >= tCount && line.observed_qty !== null) {
        observedParts.push(`${line.sku}:${line.observed_qty}`);
      } else {
        observedParts.push(`${line.sku}:?`);
      }
    }
  }

  if (obs && obs.unlisted_items) {
    for (const item of obs.unlisted_items) {
      const name = item.closest_catalogue_sku || item.description || 'UNLISTED';
      const qty = item.estimated_qty ?? 1;
      observedParts.push(`${name}:${qty}`);
    }
  }

  const observedInBox = observedParts.length > 0 ? observedParts.join(';') : 'none';

  // Effective verdict is latest override new_verdict or agent verdict
  const effectiveVerdict =
    overrides.length > 0 ? overrides[overrides.length - 1].new_verdict : analysis.verdict;

  const photos = capture.photos.map((p) => ({
    ref: p.path,
    sha256: p.sha256,
    bytes: p.bytes || 0,
  }));

  const record: PackEvidenceV1 = {
    schema: 'pack_evidence.v1',
    record_id: recordId,
    unit_id: unitId,
    org_id: orgId,
    order_id: orderId,
    channel,
    captured_at: capture.captured_at,
    operator_id: capture.operator_id,
    attempt_no: capture.attempt_no,
    order_lines: orderLinesStr,
    observed_in_box: observedInBox,
    photos,
    status: analysis.status,
    verdict: analysis.verdict,
    route: analysis.route,
    checks: analysis.checks,
    discrepancies: analysis.discrepancies,
    model: {
      provider: 'gemini',
      name: analysis.trace.model,
      prompt_version: analysis.trace.prompt_version,
      thresholds: analysis.trace.thresholds as unknown as Record<string, number>,
    },
    overrides: overrides.map((o) => ({
      at: o.created_at,
      operator_id: o.operator_id,
      original_verdict: o.original_verdict,
      new_verdict: o.new_verdict,
      reason_code: o.reason_code,
      reason_text: o.reason_text,
      row_hash: o.row_hash,
    })),
    effective_verdict: effectiveVerdict,
    content_hash: analysis.content_hash,
    hash_note: 'Content hash (SHA-256 over canonical JSON). Not tamper-proof or immutable.',
    generated_at: new Date().toISOString(),
  };

  return PackEvidenceV1Schema.parse(record);
}
