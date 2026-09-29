import { PackEvidenceV1 } from './schema';

export const CSV_COLUMNS = [
  'record_id',
  'unit_id',
  'org_id',
  'photo_refs',
  'operator_id',
  'captured_at',
  'order_id',
  'channel',
  'order_lines',
  'observed_in_box',
  'operator_verdict',
  'agent_verdict',
  'route',
  'effective_verdict',
  'content_hash',
  'model',
  'prompt_version',
] as const;

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes(';')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportEvidenceToCsv(records: PackEvidenceV1[]): string {
  const header = CSV_COLUMNS.join(',');
  const rows = records.map((rec) => {
    const photoRefs = rec.photos.map((p) => p.ref).join(';');

    // Map effective verdict to lower-case operator_verdict
    let operatorVerdict = 'pending_review';
    if (rec.effective_verdict === 'SEAL') operatorVerdict = 'seal';
    else if (rec.effective_verdict === 'STOP_AND_FIX') operatorVerdict = 'stop_and_fix';
    else if (rec.effective_verdict === 'UNCERTAIN') operatorVerdict = 'uncertain';

    return [
      escapeCsvField(rec.record_id),
      escapeCsvField(rec.unit_id),
      escapeCsvField(rec.org_id),
      escapeCsvField(photoRefs),
      escapeCsvField(rec.operator_id),
      escapeCsvField(rec.captured_at),
      escapeCsvField(rec.order_id),
      escapeCsvField(rec.channel),
      escapeCsvField(rec.order_lines),
      escapeCsvField(rec.observed_in_box),
      escapeCsvField(operatorVerdict),
      escapeCsvField(rec.verdict || ''),
      escapeCsvField(rec.route),
      escapeCsvField(rec.effective_verdict || ''),
      escapeCsvField(rec.content_hash),
      escapeCsvField(rec.model.name),
      escapeCsvField(rec.model.prompt_version),
    ].join(',');
  });

  return [header, ...rows].join('\n');
}
