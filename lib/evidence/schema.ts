import { z } from 'zod';

export const EvidencePhotoRefSchema = z.object({
  ref: z.string(),
  sha256: z.string().length(64),
  bytes: z.number().int().nonnegative(),
});

export const EvidenceCheckSchema = z.object({
  id: z.string(),
  scope: z.enum(['line', 'global']),
  sku: z.string().optional(),
  status: z.enum(['PASS', 'FAIL', 'UNCERTAIN']),
  reason: z.string(),
  confidence: z.number().optional(),
});

export const EvidenceDiscrepancySchema = z.object({
  type: z.enum(['missing', 'short_quantity', 'over_quantity', 'duplicate', 'extra_item', 'wrong_item']),
  sku: z.string().nullable(),
  found_sku: z.string().nullable().optional(),
  expected_qty: z.number().optional(),
  observed_qty: z.number().nullable().optional(),
  detail: z.string(),
});

export const EvidenceOverrideSchema = z.object({
  at: z.string(),
  operator_id: z.string(),
  original_verdict: z.enum(['SEAL', 'STOP_AND_FIX', 'UNCERTAIN']).nullable(),
  new_verdict: z.enum(['SEAL', 'STOP_AND_FIX']),
  reason_code: z.enum([
    'agent_wrong_count',
    'agent_wrong_item',
    'photo_unclear_but_ok',
    'model_unavailable',
    'other',
  ]),
  reason_text: z.string(),
  row_hash: z.string().length(64),
});

export const PackEvidenceV1Schema = z.object({
  schema: z.literal('pack_evidence.v1'),
  record_id: z.string(),
  unit_id: z.string(),
  org_id: z.string(),
  order_id: z.string(),
  channel: z.enum(['amazon_mfn', 'shopify', 'walmart', '3pl_client']),
  captured_at: z.string(),
  operator_id: z.string(),
  attempt_no: z.number().int().positive(),
  order_lines: z.string(),
  observed_in_box: z.string(),
  photos: z.array(EvidencePhotoRefSchema),
  status: z.enum(['decided', 'pending']),
  verdict: z.enum(['SEAL', 'STOP_AND_FIX', 'UNCERTAIN']).nullable(),
  route: z.enum(['SEAL', 'STOP_AND_FIX', 'HOLD_RECAPTURE_OR_REVIEW', 'PENDING']),
  checks: z.array(EvidenceCheckSchema),
  discrepancies: z.array(EvidenceDiscrepancySchema),
  model: z.object({
    provider: z.string(),
    name: z.string(),
    prompt_version: z.string(),
    thresholds: z.record(z.string(), z.number()),
  }),
  overrides: z.array(EvidenceOverrideSchema),
  effective_verdict: z.enum(['SEAL', 'STOP_AND_FIX', 'UNCERTAIN']).nullable(),
  content_hash: z.string(),
  hash_note: z.literal(
    'Content hash (SHA-256 over canonical JSON). Not tamper-proof or immutable.'
  ),
  generated_at: z.string(),
});

export type PackEvidenceV1 = z.infer<typeof PackEvidenceV1Schema>;
