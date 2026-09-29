import crypto from 'crypto';
import { canonicalJson } from './canonical';

/**
 * Compute SHA-256 hex string from UTF-8 string or Buffer/Uint8Array
 */
export function sha256Hex(data: string | Uint8Array | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Computes analyses.content_hash per DATA_MODEL.md §3:
 * sha256(canonical({ unit_id, order_snapshot, photos:[{sha256}], observation, checks, discrepancies, verdict, route, status, trace }))
 */
export function computeAnalysisContentHash(payload: {
  unit_id: string;
  order_snapshot: unknown;
  photos: Array<{ sha256: string }>;
  observation: unknown;
  checks: unknown;
  discrepancies: unknown;
  verdict: string | null;
  route: string;
  status: string;
  trace: unknown;
}): string {
  const canonical = canonicalJson({
    unit_id: payload.unit_id,
    order_snapshot: payload.order_snapshot,
    photos: payload.photos.map((p) => ({ sha256: p.sha256 })),
    observation: payload.observation,
    checks: payload.checks,
    discrepancies: payload.discrepancies,
    verdict: payload.verdict,
    route: payload.route,
    status: payload.status,
    trace: payload.trace,
  });
  return sha256Hex(canonical);
}

/**
 * Computes overrides.row_hash per DATA_MODEL.md §3:
 * sha256(prev_hash + canonical({ analysis_id, unit_id, operator_id, original_verdict, original_route, new_verdict, reason_code, reason_text, created_at }))
 */
export function computeOverrideRowHash(
  prevHash: string,
  payload: {
    analysis_id: string;
    unit_id: string;
    operator_id: string;
    original_verdict: string | null;
    original_route: string;
    new_verdict: string;
    reason_code: string;
    reason_text: string;
    created_at: string;
  }
): string {
  const canonical = canonicalJson({
    analysis_id: payload.analysis_id,
    unit_id: payload.unit_id,
    operator_id: payload.operator_id,
    original_verdict: payload.original_verdict,
    original_route: payload.original_route,
    new_verdict: payload.new_verdict,
    reason_code: payload.reason_code,
    reason_text: payload.reason_text,
    created_at: payload.created_at,
  });
  return sha256Hex(prevHash + canonical);
}
